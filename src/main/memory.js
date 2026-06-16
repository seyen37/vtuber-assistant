// 輕量本地記憶：把對話存成 userData/memory.jsonl，發問時用關鍵字回想撈相關片段注入脈絡。
// 純本地、無嵌入模型、無外部相依。評分相關的純函式（tokenize/topMemories/formatMemoryBlock）可單元測試。
const path = require('path');
const fs = require('fs');

function memoryPath() {
  try {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), 'memory.jsonl');
  } catch (_e) {
    return path.join(__dirname, '..', '..', 'memory.jsonl');
  }
}

// 斷詞：拉丁字詞 + 數字當一個 token；中日韓漢字逐字當 token（簡單但對中文回想夠用）。
function tokenize(s) {
  s = String(s == null ? '' : s).toLowerCase();
  const toks = [];
  (s.match(/[a-z0-9]+/g) || []).forEach((t) => toks.push(t));
  (s.match(/[一-鿿぀-ヿ]/g) || []).forEach((c) => toks.push(c));
  return toks;
}

// 單一記憶項目對 query 的分數：query 詞彙在項目中出現幾種（去重）。
function scoreEntry(queryTokens, entry) {
  const set = new Set(tokenize(entry && entry.text));
  let score = 0;
  const seen = new Set();
  for (const t of queryTokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (set.has(t)) score += 1;
  }
  return score;
}

// 取最相關的 k 則：分數 > 0，依分數高→低、再依新（索引大）排序。
function topMemories(entries, query, k) {
  const qt = tokenize(query);
  if (!qt.length) return [];
  const scored = (entries || []).map((e, i) => ({ e, i, s: scoreEntry(qt, e) }));
  const hit = scored.filter((x) => x.s > 0);
  hit.sort((a, b) => (b.s - a.s) || (b.i - a.i));
  return hit.slice(0, k || 4).map((x) => x.e);
}

function formatMemoryBlock(entries) {
  if (!entries || !entries.length) return '';
  const lines = entries.map((e) =>
    (e.role === 'user' ? '使用者曾說：' : '你（助手）曾回覆：') + String(e.text || '').slice(0, 300)
  );
  return '【與使用者過去的相關記憶（僅供參考，未必完全相關）】\n' + lines.join('\n');
}

// ---- fs 端 ----
function loadAll() {
  try {
    const raw = fs.readFileSync(memoryPath(), 'utf-8');
    return raw.split('\n').filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch (_e) { return null; }
    }).filter(Boolean);
  } catch (_e) {
    return [];
  }
}

function appendMemory(cfg, entries) {
  if (!cfg || !cfg.memory || !cfg.memory.enabled) return;
  const clean = (entries || []).filter((e) => e && e.text && String(e.text).trim());
  if (!clean.length) return;
  const p = memoryPath();
  const now = Date.now();
  const lines = clean.map((e) => JSON.stringify({ ts: now, role: e.role || 'user', text: String(e.text) })).join('\n') + '\n';
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, lines, 'utf-8');
  } catch (_e) { return; }
  // 上限裁切（保留最新 maxEntries 則）
  const max = (cfg.memory && cfg.memory.maxEntries) || 500;
  const all = loadAll();
  if (all.length > max) {
    const keep = all.slice(all.length - max);
    try { fs.writeFileSync(p, keep.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf-8'); } catch (_e) {}
  }
}

function recall(cfg, query, k) {
  if (!cfg || !cfg.memory || !cfg.memory.enabled) return [];
  return topMemories(loadAll(), query, k || (cfg.memory && cfg.memory.recallK) || 4);
}

function stats() {
  return { count: loadAll().length, path: memoryPath() };
}

function clearMemory() {
  try { fs.writeFileSync(memoryPath(), '', 'utf-8'); } catch (_e) {}
  return { ok: true };
}

module.exports = {
  memoryPath, tokenize, scoreEntry, topMemories, formatMemoryBlock,
  loadAll, appendMemory, recall, stats, clearMemory
};
