// Edge-TTS（msedge-tts）：合成文字為 MP3 音訊（回傳 Buffer）。
// 走 MS 線上服務、免 API key；需網路。失敗時呼叫端可回退瀏覽器內建語音。
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const DEFAULT_VOICE = 'zh-TW-HsiaoChenNeural';

// 合成整段文字 → MP3 Buffer。opts: { voice, rate, pitch }
async function synthesize(text, opts = {}) {
  const clean = String(text == null ? '' : text).trim();
  if (!clean) throw new Error('空文字，無法合成');
  const voice = opts.voice || DEFAULT_VOICE;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // 語速/音高（msedge-tts ProsodyOptions；非 1 才帶，避免相容性問題）
  const prosody = {};
  if (opts.rate && Number(opts.rate) !== 1) prosody.rate = Number(opts.rate);
  if (opts.pitch && Number(opts.pitch) !== 1) prosody.pitch = Number(opts.pitch);

  const { audioStream } = tts.toStream(clean, Object.keys(prosody).length ? prosody : undefined);
  const chunks = [];
  await new Promise((resolve, reject) => {
    audioStream.on('data', (d) => chunks.push(d));
    audioStream.on('end', resolve);
    audioStream.on('error', reject);
  });
  try { tts.close(); } catch (_e) {}
  return Buffer.concat(chunks);
}

module.exports = { synthesize, DEFAULT_VOICE };
