// 共用文字工具（瀏覽器以 window.TextUtil 使用；Node 測試以 require 使用）。
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.TextUtil = api;
})(typeof self !== 'undefined' ? self : this, function () {
  // 情緒標籤：LLM 在回覆最前面放 [情緒:X]，X 限以下六種。
  const EMOTIONS = ['開心', '難過', '生氣', '驚訝', '害羞', '一般'];
  // 抓「已知」情緒值（解析用）
  const EMO_KNOWN = /\[\s*情緒\s*[:：]\s*(開心|難過|生氣|驚訝|害羞|一般)\s*\]/;
  // 去掉「任何」情緒標籤（容錯：值不在清單也清掉，避免唸出來）
  function stripEmotionTags(s) {
    return String(s == null ? '' : s).replace(/\[\s*情緒\s*[:：][^\]]*\]/g, '');
  }

  // 解析情緒並回傳去標籤後的文字：{ emotion: '開心'|null, text }
  function parseEmotion(input) {
    const s = String(input == null ? '' : input);
    const m = s.match(EMO_KNOWN);
    const emotion = m ? m[1] : null;
    const text = stripEmotionTags(s).replace(/^[ \t\r\n]+/, '').replace(/[ \t]+/g, ' ').trim();
    return { emotion, text };
  }

  // 把要「唸出來」的文字清乾淨：去掉情緒標籤、網址、[編號] 引用標記、常見 markdown 記號。
  function cleanForSpeech(input) {
    let s = String(input == null ? '' : input);
    // 情緒標籤（先清，避免唸出「情緒開心」）
    s = stripEmotionTags(s);
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
  // 句界切分（給 TTS 分塊串流用）：依中英句末標點/換行切句。
  // mergeMax：只把「很短的相鄰句」併在一起（減少合成次數、又不犧牲快開口）。
  // hardMax：只有「超長且無句末標點的長串」才硬切（避免自然句被切斷）。
  function splitSentences(input, mergeMax, hardMax) {
    const mMax = mergeMax || 24;
    const hMax = hardMax || 80;
    const s = String(input == null ? '' : input).replace(/\r/g, '');
    if (!s.trim()) return [];
    const raw = s.split(/(?<=[。！？!?…；])|(?<=\n)/)
      .map((x) => x.replace(/\n/g, ' ').trim())
      .filter(Boolean);
    const pieces = [];
    for (const r of raw) {
      if (r.length <= hMax) pieces.push(r);
      else for (let i = 0; i < r.length; i += hMax) pieces.push(r.slice(i, i + hMax));
    }
    const out = [];
    let cur = '';
    for (const p of pieces) {
      if (!cur) cur = p;
      else if ((cur + p).length <= mMax) cur = cur + p;
      else { out.push(cur); cur = p; }
    }
    if (cur) out.push(cur);
    return out;
  }

  return { cleanForSpeech, parseEmotion, stripEmotionTags, splitSentences, EMOTIONS };
});
