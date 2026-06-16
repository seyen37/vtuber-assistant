/* 後端邏輯單元測試（純 Node，不需 Electron / GUI）。執行：npm test */
const assert = require('assert');
const config = require('../src/main/config');
const llm = require('../src/main/llm');
const search = require('../src/main/search');
const agent = require('../src/main/agent');

const realFetch = global.fetch;
let pass = 0, fail = 0, skip = 0;
async function test(name, fn) {
  try { await fn(); console.log('  PASS', name); pass++; }
  catch (e) { console.log('  FAIL', name, '\n      ->', e.message); fail++; }
}
function skipTest(name, why) { console.log('  SKIP', name, '(' + why + ')'); skip++; }

(async () => {
  console.log('\n[config]');
  await test('deepMerge 巢狀覆寫，未提供的鍵保留預設', () => {
    const out = config.deepMerge({ a: 1, ollama: { baseUrl: 'x', model: 'm' } }, { ollama: { model: 'm2' } });
    assert.strictEqual(out.a, 1);
    assert.strictEqual(out.ollama.baseUrl, 'x');
    assert.strictEqual(out.ollama.model, 'm2');
  });
  await test('DEFAULTS 結構完整（含 character）', () => {
    const d = config.DEFAULTS;
    assert.ok(d.ollama && d.openai && d.search);
    assert.strictEqual(d.search.provider, 'duckduckgo');
    assert.ok(typeof d.character === 'string' && d.character.endsWith('.model3.json'));
  });

  console.log('\n[llm]');
  await test('safeParseJSON 容錯', () => {
    assert.deepStrictEqual(llm.safeParseJSON('{"a":1}'), { a: 1 });
    assert.deepStrictEqual(llm.safeParseJSON('bad'), {});
    assert.deepStrictEqual(llm.safeParseJSON({ a: 2 }), { a: 2 });
  });
  await test('toOllamaMessages 轉換 assistant tool_calls + tool 結果', () => {
    const canonical = [
      { role: 'assistant', content: '', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'web_search', arguments: '{"query":"foo"}' } }] },
      { role: 'tool', tool_call_id: 'c1', name: 'web_search', content: 'result' }
    ];
    const out = llm.toOllamaMessages(canonical);
    assert.strictEqual(out[0].tool_calls[0].function.name, 'web_search');
    assert.deepStrictEqual(out[0].tool_calls[0].function.arguments, { query: 'foo' });
    assert.strictEqual(out[1].role, 'tool');
    assert.strictEqual(out[1].content, 'result');
  });
  await test('callOpenAI 送出 tools 並解析 tool_calls', async () => {
    let captured;
    global.fetch = async (url, opts) => {
      captured = { url, body: JSON.parse(opts.body), headers: opts.headers };
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '', tool_calls: [{ id: 'x1', type: 'function', function: { name: 'web_search', arguments: '{"query":"taipei"}' } }] } }] }), text: async () => '' };
    };
    const r = await llm.callLLM({ provider: 'openai', openai: { baseUrl: 'https://api.test/v1', apiKey: 'k', model: 'gpt-x' } }, [{ role: 'user', content: 'hi' }], [agent.SEARCH_TOOL]);
    assert.ok(captured.url.endsWith('/chat/completions'));
    assert.strictEqual(captured.headers.Authorization, 'Bearer k');
    assert.strictEqual(captured.body.tools.length, 1);
    assert.strictEqual(r.toolCalls[0].name, 'web_search');
    assert.deepStrictEqual(r.toolCalls[0].arguments, { query: 'taipei' });
  });
  await test('callOllama /api/chat、model 跟著設定切換', async () => {
    let b1, b2;
    global.fetch = async (u, o) => { b1 = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ message: { content: 'a', tool_calls: [] } }), text: async () => '' }; };
    await llm.callLLM({ provider: 'ollama', ollama: { baseUrl: 'http://localhost:11434', model: 'qwen2.5' } }, [{ role: 'user', content: 'h' }], []);
    global.fetch = async (u, o) => { b2 = JSON.parse(o.body); return { ok: true, status: 200, json: async () => ({ message: { content: 'b', tool_calls: [] } }), text: async () => '' }; };
    await llm.callLLM({ provider: 'ollama', ollama: { baseUrl: 'http://localhost:11434', model: 'llama3.1' } }, [{ role: 'user', content: 'h' }], []);
    assert.strictEqual(b1.model, 'qwen2.5');
    assert.strictEqual(b2.model, 'llama3.1');
    assert.strictEqual(b1.stream, false);
  });
  await test('callOpenAI 非 2xx 丟出可讀錯誤', async () => {
    global.fetch = async () => ({ ok: false, status: 401, json: async () => ({}), text: async () => 'unauthorized' });
    await assert.rejects(() => llm.callLLM({ provider: 'openai', openai: { baseUrl: 'https://api.test/v1', apiKey: 'bad', model: 'gpt-x' } }, [{ role: 'user', content: 'hi' }], []), /401/);
  });

  console.log('\n[search]');
  await test('resolveDdgUrl 解出 uddg 真實網址', () => {
    assert.strictEqual(search.resolveDdgUrl('//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1&rut=z'), 'https://example.com/a?b=1');
  });
  await test('parseDdgHtml 解析 + 去標籤/實體', () => {
    const sample = '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage&rut=abc">Example &amp; Title</a><a class="result__snippet" href="#">This is a <b>snippet</b> &#39;text&#39;.</a><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Ffoo.com">Second</a><a class="result__snippet" href="#">second</a>';
    const out = search.parseDdgHtml(sample, 5);
    assert.strictEqual(out.length, 2);
    assert.strictEqual(out[0].title, 'Example & Title');
    assert.strictEqual(out[0].url, 'https://example.com/page');
    assert.strictEqual(out[0].snippet, "This is a snippet 'text'.");
  });

  console.log('\n[agent]');
  await test('啟用搜尋 -> web_search -> 收斂 + sources', async () => {
    const o1 = llm.callLLM, o2 = search.webSearch; let n = 0;
    llm.callLLM = async (c, m, tools) => { n++; return n === 1 ? { content: '', toolCalls: [{ id: 'c1', name: 'web_search', arguments: { query: 'taipei' } }] } : { content: 'Sunny [1]', toolCalls: [] }; };
    let q = null; search.webSearch = async (x) => { q = x; return [{ title: 'w', url: 'https://w.test', snippet: 's' }]; };
    try {
      const r = await agent.runAgent([{ role: 'user', content: 'q' }], { systemPrompt: 's', webSearchEnabled: true, search: {} });
      assert.strictEqual(q, 'taipei'); assert.ok(r.content.includes('Sunny')); assert.strictEqual(r.sources.length, 1);
    } finally { llm.callLLM = o1; search.webSearch = o2; }
  });
  await test('不支援工具 -> 自動降級純對話（不報錯）', async () => {
    const o1 = llm.callLLM; let n = 0, lastTools = null;
    llm.callLLM = async (c, m, tools) => { n++; lastTools = tools; if (n === 1) throw new Error('Ollama 回應 400：gemma2 does not support tools'); return { content: 'plain', toolCalls: [] }; };
    try {
      const r = await agent.runAgent([{ role: 'user', content: 'hi' }], { systemPrompt: 's', webSearchEnabled: true, search: {} });
      assert.strictEqual(r.content, 'plain'); assert.strictEqual(n, 2); assert.strictEqual(lastTools.length, 0);
    } finally { llm.callLLM = o1; }
  });
  await test('關閉搜尋 -> 不帶工具', async () => {
    const o1 = llm.callLLM; let seen = null;
    llm.callLLM = async (c, m, tools) => { seen = tools; return { content: 'direct', toolCalls: [] }; };
    try {
      const r = await agent.runAgent([{ role: 'user', content: 'hi' }], { systemPrompt: 's', webSearchEnabled: false });
      assert.strictEqual(r.content, 'direct'); assert.strictEqual(seen.length, 0);
    } finally { llm.callLLM = o1; }
  });
  await test('dedupeSources 去重', () => {
    assert.strictEqual(agent.dedupeSources([{ url: 'a' }, { url: 'a' }, { url: 'b' }, { url: '' }]).length, 2);
  });

  console.log('\n[integration: live DuckDuckGo]');
  global.fetch = realFetch;
  if (typeof global.fetch === 'undefined') { skipTest('ddgSearch live', 'no fetch'); }
  else {
    try {
      const results = await search.ddgSearch('Open-LLM-VTuber github', 5);
      assert.ok(results.length > 0 && results[0].url.startsWith('http'));
      console.log('      sample:', results[0].title, '-', results[0].url);
    } catch (e) { skipTest('ddgSearch live', e.message); }
  }

  console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped\n');
  process.exit(fail > 0 ? 1 : 0);
})();
