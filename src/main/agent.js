// Agent 迴圈：tool-calling。模型可呼叫 web_search 取得最新資訊，
// 取得結果後回饋模型，最終產生帶來源引用的回答。
//
// 以 module 物件方式引用 llm / search，方便測試時注入 mock。
const llm = require('./llm');
const search = require('./search');

const SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      '搜尋網際網路以取得最新或你不確定的資訊（時事、價格、新聞、規格等）。回傳數則結果（標題、網址、摘要）。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '精準的搜尋關鍵字' }
      },
      required: ['query']
    }
  }
};

function dedupeSources(list) {
  const seen = new Set();
  const out = [];
  for (const r of list) {
    if (!r || !r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    out.push(r);
  }
  return out;
}

// history: [{ role:'user'|'assistant', content }]
async function runAgent(history, cfg, onStatus) {
  onStatus = onStatus || (() => {});
  const messages = [{ role: 'system', content: cfg.systemPrompt }, ...history];
  let tools = cfg.webSearchEnabled ? [SEARCH_TOOL] : [];
  const sources = [];
  const maxIters = 4;

  // 有些本地模型（gemma、phi、部分量化版…）不支援工具呼叫。
  // 偵測到「不支援 tools」就自動降級為純對話，而不是讓整個請求失敗——
  // 這正是「切到某個本地模型後完全沒反應 / 一直報錯」的根因。
  function toolsUnsupported(err) {
    return /does not support tools|tools.*not.*support|unknown.*tool|invalid.*tool|registry\.ollama/i.test(
      String((err && err.message) || '')
    );
  }
  async function askLLM(msgs) {
    try {
      return await llm.callLLM(cfg, msgs, tools);
    } catch (e) {
      if (tools.length && toolsUnsupported(e)) {
        tools = []; // 後續都不再帶工具
        onStatus('此模型不支援找資料，改用純對話');
        return await llm.callLLM(cfg, msgs, tools);
      }
      throw e;
    }
  }

  for (let i = 0; i < maxIters; i++) {
    onStatus(i === 0 ? '思考中…' : '整理資料中…');
    const { content, toolCalls } = await askLLM(messages);

    if (toolCalls && toolCalls.length) {
      // 紀錄 assistant 的 tool_calls（canonical OpenAI 格式）
      messages.push({
        role: 'assistant',
        content: content || '',
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments || {}) }
        }))
      });

      for (const tc of toolCalls) {
        if (tc.name === 'web_search') {
          const q = (tc.arguments && tc.arguments.query) || '';
          onStatus('搜尋：' + q);
          let results = [];
          try {
            results = await search.webSearch(q, cfg);
          } catch (e) {
            results = [];
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              name: 'web_search',
              content: '搜尋失敗：' + e.message
            });
            continue;
          }
          results.forEach((r) => sources.push(r));
          const summary =
            results
              .map((r, idx) => '[' + (idx + 1) + '] ' + r.title + '\n' + r.url + '\n' + r.snippet)
              .join('\n\n') || '（沒有找到結果）';
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: 'web_search',
            content: summary
          });
        } else {
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: '（未知的工具呼叫）'
          });
        }
      }
      continue; // 帶著工具結果再問一次
    }

    // 沒有工具呼叫 → 視為最終答案
    return { content: content || '（沒有產生回應）', sources: dedupeSources(sources) };
  }

  // 超過迭代上限：要求模型根據已有資料直接收斂
  onStatus('整理資料中…');
  const final = await llm.callLLM(
    cfg,
    [...messages, { role: 'user', content: '請根據以上搜尋結果，用繁體中文給我最終答覆，並以 [編號] 標註來源。' }],
    []
  );
  return { content: final.content || '（沒有產生回應）', sources: dedupeSources(sources) };
}

module.exports = { runAgent, dedupeSources, SEARCH_TOOL };
