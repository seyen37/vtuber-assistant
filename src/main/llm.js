// LLM 抽象層：對外提供統一的 callLLM(cfg, messages, tools)。
// 內部支援兩種 provider：本機 Ollama 與 OpenAI 相容雲端端點。
//
// 訊息一律使用 OpenAI 標準格式（canonical）：
//   { role:'system'|'user'|'assistant'|'tool', content, tool_calls?, tool_call_id?, name? }
// 對 Ollama 呼叫時於此層轉換格式，讓上層（agent）保持 provider 無關。

function safeParseJSON(s) {
  if (s == null) return {};
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch (_e) { return {}; }
}

function trimUrl(u) {
  return String(u || '').replace(/\/+$/, '');
}

// ---- OpenAI 相容 ----
async function callOpenAI(cfg, messages, tools) {
  const { baseUrl, apiKey, model } = cfg.openai || {};
  const body = { model, messages };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }
  const res = await fetch(`${trimUrl(baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`雲端 LLM 回應 ${res.status}：${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const m = (data.choices && data.choices[0] && data.choices[0].message) || {};
  const toolCalls = (m.tool_calls || []).map((tc, i) => ({
    id: tc.id || `call_${i}`,
    name: tc.function && tc.function.name,
    arguments: safeParseJSON(tc.function && tc.function.arguments)
  }));
  return { content: m.content || '', toolCalls };
}

// ---- Ollama ----
// 把 canonical(OpenAI) 訊息轉成 Ollama /api/chat 接受的格式。
function toOllamaMessages(messages) {
  return messages.map((m) => {
    if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length) {
      return {
        role: 'assistant',
        content: m.content || '',
        tool_calls: m.tool_calls.map((tc) => ({
          function: {
            name: tc.function.name,
            arguments: safeParseJSON(tc.function.arguments)
          }
        }))
      };
    }
    if (m.role === 'tool') {
      // Ollama 以 role:'tool' + content 回饋工具結果
      return { role: 'tool', content: m.content || '' };
    }
    return { role: m.role, content: m.content || '' };
  });
}

async function callOllama(cfg, messages, tools) {
  const { baseUrl, model } = cfg.ollama || {};
  const body = {
    model,
    messages: toOllamaMessages(messages),
    stream: false
  };
  if (tools && tools.length) body.tools = tools;
  const res = await fetch(`${trimUrl(baseUrl)}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Ollama 回應 ${res.status}：${t.slice(0, 300)}（請確認 Ollama 已啟動、模型已 pull）`);
  }
  const data = await res.json();
  const m = data.message || {};
  const toolCalls = (m.tool_calls || []).map((tc, i) => ({
    id: tc.id || `call_${i}`,
    name: tc.function && tc.function.name,
    arguments: safeParseJSON(tc.function && tc.function.arguments)
  }));
  return { content: m.content || '', toolCalls };
}

async function callLLM(cfg, messages, tools) {
  if ((cfg.provider || 'ollama') === 'openai') {
    return callOpenAI(cfg, messages, tools);
  }
  return callOllama(cfg, messages, tools);
}

module.exports = { callLLM, callOpenAI, callOllama, toOllamaMessages, safeParseJSON };
