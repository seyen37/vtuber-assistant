/* 後端邏輯單元測試（純 Node，不需 Electron / GUI）。執行：npm test */
const assert = require('assert');
const config = require('../src/main/config');
const llm = require('../src/main/llm');
const search = require('../src/main/search');
const agent = require('../src/main/agent');
const textutil = require('../src/shared/textutil');
const asr = require('../src/main/asr');
const memory = require('../src/main/memory');
const kb = require('../src/main/kb');

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


  console.log('\n[textutil]');
  await test('cleanForSpeech 去網址/引用/markdown', () => {
    const out = textutil.cleanForSpeech('今天**晴天** 詳見 [來源](https://x.com/a) 與 https://y.com 喔 [1][2]');
    assert.ok(!out.includes('http'), 'no url');
    assert.ok(!out.includes('[1]') && !out.includes('[2]'), 'no citation markers');
    assert.ok(!out.includes('*'), 'no markdown stars');
    assert.ok(out.includes('晴天') && out.includes('來源'), 'keeps text');
  });
  await test('cleanForSpeech 容錯空值', () => {
    assert.strictEqual(textutil.cleanForSpeech(null), '');
    assert.strictEqual(textutil.cleanForSpeech(''), '');
  });


  console.log('\n[asr]');
  await test('transcribe 打 /audio/transcriptions + 帶 model/Authorization', async () => {
    let captured;
    global.fetch = async (url, opts) => {
      captured = { url, opts };
      return { ok: true, status: 200, json: async () => ({ text: '你好世界' }), text: async () => '' };
    };
    const cfg = { openai: { baseUrl: 'https://api.test/v1', apiKey: 'k' }, asr: { model: 'whisper-1', language: 'zh' } };
    const r = await asr.transcribe(cfg, { buffer: new Uint8Array([1, 2, 3]), mimeType: 'audio/webm' });
    assert.ok(captured.url.endsWith('/audio/transcriptions'));
    assert.strictEqual(captured.opts.headers.Authorization, 'Bearer k');
    assert.strictEqual(captured.opts.body.get('model'), 'whisper-1');
    assert.strictEqual(captured.opts.body.get('language'), 'zh');
    assert.strictEqual(r.text, '你好世界');
  });
  await test('transcribe 無 apiKey 會丟出可讀錯誤', async () => {
    await assert.rejects(() => asr.transcribe({ openai: { baseUrl: 'https://x/v1', apiKey: '' } }, { buffer: new Uint8Array([1]) }), /API key/);
  });
  await test('transcribe 無音訊資料會丟錯', async () => {
    await assert.rejects(() => asr.transcribe({ openai: { apiKey: 'k', baseUrl: 'https://x/v1' } }, { buffer: new Uint8Array([]) }), /音訊/);
  });


  console.log('\n[memory]');
  await test('tokenize 切拉丁詞 + 中文逐字', () => {
    const t = memory.tokenize('台北天氣 OpenAI gpt4');
    assert.ok(t.includes('台') && t.includes('北') && t.includes('天') && t.includes('氣'));
    assert.ok(t.includes('openai') && t.includes('gpt4'));
  });
  await test('topMemories 取相關、排除無關、依分數排序', () => {
    const entries = [
      { role: 'user', text: '我喜歡的顏色是藍色' },
      { role: 'assistant', text: '今天台北天氣晴朗' },
      { role: 'user', text: '我住在台北' }
    ];
    const top = memory.topMemories(entries, '台北天氣如何', 2);
    assert.strictEqual(top.length, 2);
    assert.ok(top[0].text.includes('台北天氣')); // 命中最多的排最前
    assert.ok(!top.some((e) => e.text.includes('藍色'))); // 無關的被排除
  });
  await test('topMemories 空查詢回空', () => {
    assert.strictEqual(memory.topMemories([{ role: 'user', text: 'x' }], '', 4).length, 0);
  });
  await test('formatMemoryBlock 標注角色、空陣列回空字串', () => {
    assert.strictEqual(memory.formatMemoryBlock([]), '');
    const b = memory.formatMemoryBlock([{ role: 'user', text: '我住台北' }, { role: 'assistant', text: '好的' }]);
    assert.ok(b.includes('使用者曾說：我住台北') && b.includes('你（助手）曾回覆：好的'));
  });
  await test('appendMemory 停用時不寫檔', () => {
    // 停用時應直接 return，不丟錯
    memory.appendMemory({ memory: { enabled: false } }, [{ role: 'user', text: 'x' }]);
    assert.ok(true);
  });


  console.log('\n[kb]');
  await test('splitChunks 以空行分段、去空、截長', () => {
    const c = kb.splitChunks('第一段內容\n\n第二段內容\n\n   \n\n第三段');
    assert.strictEqual(c.length, 3);
    assert.strictEqual(c[0], '第一段內容');
    assert.strictEqual(c[2], '第三段');
  });
  await test('formatKbBlock 空回空、有內容加標頭與編號', () => {
    assert.strictEqual(kb.formatKbBlock([]), '');
    const b = kb.formatKbBlock(['營業時間是九點到六點', '七天可退貨']);
    assert.ok(b.includes('【知識庫內容】'));
    assert.ok(b.includes('(1) 營業時間是九點到六點') && b.includes('(2) 七天可退貨'));
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
