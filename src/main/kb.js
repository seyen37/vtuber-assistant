// 知識庫客服模式：讀本機知識庫檔，分段後用關鍵字檢索撈最相關段落，注入脈絡讓助手「依知識庫回答」。
// 檢索評分重用 memory 的純函式（關鍵字重疊），保持輕量、一致、可測。
const path = require('path');
const fs = require('fs');
const { topMemories } = require('./memory');

function kbPath(cfg) {
  const rel = (cfg && cfg.kb && cfg.kb.path) || '/assets/knowledge/knowledge.md';
  return path.join(__dirname, '..', '..', String(rel).replace(/^\/+/, ''));
}

function loadText(cfg) {
  try { return fs.readFileSync(kbPath(cfg), 'utf-8'); } catch (_e) { return ''; }
}

// 以空行分段；過長段落截斷；略過純標題/引言雜訊（保留有內容的段）。
function splitChunks(text) {
  return String(text == null ? '' : text)
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && s.length > 1)
    .map((s) => (s.length > 800 ? s.slice(0, 800) : s));
}

function loadChunks(cfg) {
  return splitChunks(loadText(cfg)).map((t) => ({ text: t }));
}

function retrieve(cfg, query, k) {
  const top = topMemories(loadChunks(cfg), query, k || (cfg && cfg.kb && cfg.kb.topK) || 4);
  return top.map((e) => e.text);
}

function formatKbBlock(chunks) {
  if (!chunks || !chunks.length) return '';
  return '【知識庫內容】\n' + chunks.map((c, i) => '(' + (i + 1) + ') ' + c).join('\n\n');
}

function stats(cfg) {
  return { count: loadChunks(cfg).length, path: kbPath(cfg) };
}

module.exports = { kbPath, splitChunks, loadChunks, retrieve, formatKbBlock, stats };
