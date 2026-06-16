// 共用文字工具（瀏覽器以 window.TextUtil 使用；Node 測試以 require 使用）。
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TextUtil = api;
})(typeof self !== 'undefined' ? self : this, function () {
  // 把要「唸出來」的文字清乾淨：去掉網址、[編號] 引用標記、常見 markdown 記號。
  function cleanForSpeech(input) {
    let s = String(input == null ? '' : input);
    // markdown 連結 [文字](url) -> 文字
    s = s.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1');
    // 裸網址
    s = s.replace(/https?:\/\/[^\s)]+/g, '');
    // 引用標記 [1] [2] [12]
    s = s.replace(/\[\d+\]/g, '');
    // 行首 markdown 標題 / 清單符號
    s = s.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
    s = s.replace(/^[ \t]*[-*+][ \t]+/gm, '');
    // 強調 / 行內程式碼記號
    s = s.replace(/[*_`~]+/g, '');
    // 收斂空白
    s = s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
    return s;
  }
  return { cleanForSpeech };
});
