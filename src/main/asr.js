// 語音輸入（ASR）：把錄到的音訊送到 OpenAI 相容的 /audio/transcriptions 轉成文字。
// 沿用 cfg.openai 的 baseUrl + apiKey（Ollama 無轉寫端點，故 ASR 一律走雲端）。

function trimUrl(u) {
  return String(u || '').replace(/\/+$/, '');
}

// audio: { buffer: ArrayBuffer | Uint8Array, mimeType?, filename? }
async function transcribe(cfg, audio) {
  const o = (cfg && cfg.openai) || {};
  if (!o.apiKey) {
    throw new Error('語音輸入需要雲端 API key：請到設定的「雲端（OpenAI 相容）」填入 API Key。');
  }
  const asr = (cfg && cfg.asr) || {};
  const model = asr.model || 'whisper-1';

  const src = audio && audio.buffer;
  const bytes = src instanceof Uint8Array ? src : new Uint8Array(src || []);
  if (!bytes.length) throw new Error('沒有音訊資料');

  const blob = new Blob([bytes], { type: (audio && audio.mimeType) || 'audio/webm' });
  const form = new FormData();
  form.append('file', blob, (audio && audio.filename) || 'speech.webm');
  form.append('model', model);
  if (asr.language) form.append('language', asr.language);

  const res = await fetch(trimUrl(o.baseUrl) + '/audio/transcriptions', {
    method: 'POST',
    // 不要手動設 Content-Type，讓 fetch 自動帶 multipart boundary
    headers: { Authorization: 'Bearer ' + o.apiKey },
    body: form
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error('轉寫失敗 ' + res.status + '：' + t.slice(0, 200));
  }
  const data = await res.json();
  return { text: (data && data.text) || '' };
}

module.exports = { transcribe, trimUrl };
