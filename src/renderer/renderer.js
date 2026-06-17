const $ = (id) => document.getElementById(id);

let history = [];     // [{role, content}]
let sending = false;
let statusTimer = null;
let mouthTimer = null;

// 語音輸出（TTS）狀態
let speechCfg = { enabled: true, voice: '', rate: 1.0, pitch: 1.0 };
let voices = [];

// 語音輸入（ASR）狀態
let asrEnabled = true;
let mediaRecorder = null;
let audioChunks = [];
let recording = false;

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function addMsg(role, text, sources) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  div.textContent = text;
  if (sources && sources.length) {
    const s = document.createElement('div');
    s.className = 'sources';
    s.innerHTML =
      '來源：' +
      sources
        .map(
          (r, i) =>
            '<a href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener" title="' +
            escapeHtml(r.url) + '">[' + (i + 1) + '] ' + escapeHtml(r.title || r.url) + '</a>'
        )
        .join('');
    div.appendChild(s);
  }
  $('chat').appendChild(div);
  $('chat').scrollTop = $('chat').scrollHeight;
  return div;
}

function showStatus(text) {
  const el = $('status');
  el.textContent = text;
  el.classList.add('show');
}
function hideStatusSoon() {
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => $('status').classList.remove('show'), 600);
}

// ---------- 語音輸出（TTS）----------
function loadVoices() {
  if (!window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices() || [];
  const sel = $('cfg-voice');
  if (sel) {
    sel.innerHTML =
      '<option value="">（系統預設 / 自動挑中文）</option>' +
      voices
        .map((v) => '<option value="' + escapeHtml(v.name) + '">' + escapeHtml(v.name) + '（' + escapeHtml(v.lang) + '）</option>')
        .join('');
    sel.value = speechCfg.voice || '';
  }
}

function pickVoice() {
  if (!voices.length && window.speechSynthesis) voices = window.speechSynthesis.getVoices() || [];
  if (speechCfg.voice) {
    const v = voices.find((x) => x.name === speechCfg.voice);
    if (v) return v;
  }
  return (
    voices.find((v) => /zh[-_]?TW|zh[-_]?Hant/i.test(v.lang)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null
  );
}

// 沒有語音/關閉時的後備：用計時器讓嘴型仍會動
function mouthByTimer(text) {
  const ms = Math.min(8000, 800 + (text || '').length * 45);
  window.L2D.setSpeaking(true);
  clearTimeout(mouthTimer);
  mouthTimer = setTimeout(() => window.L2D.setSpeaking(false), ms);
}

function speak(text) {
  const clean = window.TextUtil ? window.TextUtil.cleanForSpeech(text) : text;
  const synth = window.speechSynthesis;
  if (!speechCfg.enabled || !synth || !clean) {
    mouthByTimer(clean || text);
    return;
  }
  try { synth.cancel(); } catch (_e) {}
  const u = new SpeechSynthesisUtterance(clean);
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'zh-TW'; }
  u.rate = speechCfg.rate || 1;
  u.pitch = speechCfg.pitch || 1;
  u.onstart = () => window.L2D.setSpeaking(true);
  u.onend = () => window.L2D.setSpeaking(false);
  u.onerror = () => window.L2D.setSpeaking(false);
  synth.speak(u);
}

function stopSpeaking() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (_e) {}
  clearTimeout(mouthTimer);
  window.L2D.setSpeaking(false);
}

// ---------- 語音輸入（ASR）----------
function updateMicUi() {
  const b = $('btn-mic');
  if (!b) return;
  b.style.display = asrEnabled ? '' : 'none';
  b.classList.toggle('recording', recording);
  b.textContent = recording ? '⏺' : '🎤';
  b.title = recording ? '停止並轉寫' : '語音輸入（點一下開始）';
}

async function toggleMic() {
  if (!asrEnabled) {
    showStatus('語音輸入未啟用（在設定開啟）');
    hideStatusSoon();
    return;
  }
  if (recording) {
    try { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); } catch (_e) {}
    return;
  }
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    showStatus('此環境不支援錄音');
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    showStatus('無法存取麥克風：' + e.message);
    return;
  }
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) audioChunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    try { stream.getTracks().forEach((t) => t.stop()); } catch (_e) {}
    recording = false;
    updateMicUi();
    const blob = new Blob(audioChunks, { type: (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm' });
    if (!blob.size) { showStatus('沒有錄到聲音'); hideStatusSoon(); return; }
    showStatus('轉寫中…');
    try {
      const buf = await blob.arrayBuffer();
      const res = await window.api.transcribe({ buffer: buf, mimeType: blob.type });
      if (res && res.ok && (res.text || '').trim()) {
        $('input').value = res.text.trim();
        hideStatusSoon();
        send(); // 轉寫成功後自動送出
      } else {
        showStatus(res && res.error ? ('轉寫失敗：' + res.error) : '沒聽清楚，再試一次');
        hideStatusSoon();
      }
    } catch (e) {
      showStatus('轉寫錯誤：' + e.message);
      hideStatusSoon();
    }
  };
  mediaRecorder.start();
  recording = true;
  updateMicUi();
  showStatus('錄音中…再按一次結束');
}

async function send() {
  if (sending) return;
  const text = $('input').value.trim();
  if (!text) return;
  $('input').value = '';
  addMsg('user', text);
  history.push({ role: 'user', content: text });

  sending = true;
  $('send').disabled = true;
  window.L2D.setSpeaking(true); // 思考時先讓角色有動作
  const typing = addMsg('ai', '思考中…');
  typing.classList.add('typing');

  try {
    const res = await window.api.sendMessage({ history });
    typing.remove();
    if (res && res.ok) {
      addMsg('ai', res.content, res.sources);
      history.push({ role: 'assistant', content: res.content });
      speak(res.content); // 唸出回覆 + 帶動嘴型
    } else {
      stopSpeaking();
      addMsg('ai', '出錯了：' + ((res && res.error) || '未知錯誤'));
    }
  } catch (e) {
    typing.remove();
    stopSpeaking();
    addMsg('ai', '出錯了：' + e.message);
  } finally {
    sending = false;
    $('send').disabled = false;
    hideStatusSoon();
  }
}

// ---------- Chrome 內建 AI（Gemini Nano）可用性偵測 ----------
// 純 renderer 端：Prompt API 只存在於瀏覽器。Electron 內建 Chromium 通常不提供。
async function detectChromeAI() {
  const el = $('chromeai-status');
  el.textContent = '偵測中…';
  try {
    const LM = window.LanguageModel || (window.ai && (window.ai.languageModel || window.ai)) || null;
    if (!LM) {
      el.textContent = '❌ 不可用：此環境沒有 Prompt API（Electron 內建 Chromium 通常不含 Gemini Nano）。需在真正的 Chrome 138+ 開啟旗標才會有。';
      return;
    }
    let status = '';
    if (typeof LM.availability === 'function') {
      status = await LM.availability();
    } else if (typeof LM.capabilities === 'function') {
      const c = await LM.capabilities();
      status = (c && c.available) || 'unknown';
    } else {
      el.textContent = '偵測到 API 物件，但沒有 availability()/capabilities() 方法（版本不符）。';
      return;
    }
    const map = {
      available: '✅ 可用（模型已就緒，可直接用）',
      readily: '✅ 可用（模型已就緒，可直接用）',
      downloadable: '⬇ 可下載（API 在，但 ~4GB 模型尚未下載）',
      'after-download': '⬇ 可下載（API 在，但模型尚未下載）',
      downloading: '⏳ 模型下載中…稍後再試',
      unavailable: '❌ 不可用（此裝置/瀏覽器不支援）',
      no: '❌ 不可用（此裝置/瀏覽器不支援）'
    };
    el.textContent = '偵測結果：' + (map[status] || ('（' + status + '）'));
    if (status === 'available' || status === 'readily') {
      el.textContent += '　→ 可用的話再跟我說，我幫你接成第三個 LLM provider（純對話、不支援找資料）。';
    }
  } catch (e) {
    el.textContent = '偵測失敗：' + e.message;
  }
}

// ---------- 設定面板 ----------
function toggleProviderGroups() {
  const p = $('cfg-provider').value;
  $('grp-ollama').style.display = p === 'ollama' ? '' : 'none';
  $('grp-openai').style.display = p === 'openai' ? '' : 'none';
}
function toggleTavily() {
  $('grp-tavily').style.display = $('cfg-search-provider').value === 'tavily' ? '' : 'none';
}

function updateMuteIcon() {
  const b = $('btn-mute');
  if (b) b.textContent = speechCfg.enabled ? '🔊' : '🔇';
}

async function populateCharacters(selected) {
  try {
    const chars = await window.api.listCharacters();
    const sel = $('cfg-character');
    sel.innerHTML = chars
      .map((c) => '<option value="' + escapeHtml(c.path) + '">' + escapeHtml(c.name) + '</option>')
      .join('');
    if (selected && chars.some((c) => c.path === selected)) {
      sel.value = selected;
    } else if (chars[0]) {
      sel.value = chars[0].path;
    }
  } catch (_e) {}
}

async function refreshOllamaModels() {
  const url = $('cfg-ollama-url').value.trim() || 'http://localhost:11434';
  $('settings-msg').textContent = '偵測中…';
  try {
    const res = await window.api.listOllamaModels(url);
    if (res && res.ok) {
      $('ollama-models').innerHTML = res.models
        .map((m) => '<option value="' + escapeHtml(m) + '"></option>')
        .join('');
      $('settings-msg').textContent = res.models.length
        ? '找到 ' + res.models.length + ' 個本機模型，點輸入框可選'
        : '沒找到模型（先用 ollama pull 安裝）';
    } else {
      $('settings-msg').textContent = '偵測失敗：' + ((res && res.error) || '未知') + '（Ollama 有開嗎？）';
    }
  } catch (e) {
    $('settings-msg').textContent = '偵測失敗：' + e.message;
  }
}

async function loadSettings() {
  const cfg = await window.api.getConfig();
  await populateCharacters(cfg.character);
  $('cfg-provider').value = cfg.provider;
  $('cfg-ollama-url').value = cfg.ollama.baseUrl;
  $('cfg-ollama-model').value = cfg.ollama.model;
  $('cfg-openai-url').value = cfg.openai.baseUrl;
  $('cfg-openai-key').value = cfg.openai.apiKey;
  $('cfg-openai-model').value = cfg.openai.model;
  $('cfg-web').checked = cfg.webSearchEnabled;
  $('cfg-search-provider').value = cfg.search.provider;
  $('cfg-tavily-key').value = cfg.search.tavilyApiKey;
  $('cfg-system').value = cfg.systemPrompt;

  // 語音輸出
  speechCfg = Object.assign({ enabled: true, voice: '', rate: 1.0, pitch: 1.0 }, cfg.speech || {});
  $('cfg-speech').checked = !!speechCfg.enabled;
  $('cfg-rate').value = speechCfg.rate;
  $('cfg-rate-val').textContent = Number(speechCfg.rate).toFixed(1) + 'x';
  loadVoices();
  updateMuteIcon();

  // 語音輸入
  const asr = Object.assign({ enabled: true, model: 'whisper-1', language: 'zh' }, cfg.asr || {});
  asrEnabled = !!asr.enabled;
  $('cfg-asr').checked = asrEnabled;
  $('cfg-asr-model').value = asr.model;
  $('cfg-asr-lang').value = asr.language;
  updateMicUi();

  // 記憶
  $('cfg-memory').checked = !((cfg.memory || {}).enabled === false);
  try {
    const st = await window.api.memoryStats();
    $('memory-stats').textContent = '目前已記住 ' + ((st && st.count) || 0) + ' 則對話';
  } catch (_e) {}

  // 知識庫客服
  const k = cfg.kb || {};
  $('cfg-kb').checked = !!k.enabled;
  $('cfg-kb-strict').checked = k.strict !== false;
  try {
    const ks = await window.api.kbStats();
    $('kb-stats').textContent = '知識庫目前 ' + ((ks && ks.count) || 0) + ' 段內容';
  } catch (_e) {}

  // 桌面 / 桌寵
  try {
    const d = (cfg.desktop) || (await window.api.getDesktop()) || {};
    $('cfg-clickthrough').checked = !!d.clickThrough;
    $('cfg-ontop').checked = d.alwaysOnTop !== false;
    $('cfg-autolaunch').checked = !!d.autoLaunch;
  } catch (_e) {}

  toggleProviderGroups();
  toggleTavily();
  return cfg;
}

async function saveSettings() {
  speechCfg.enabled = $('cfg-speech').checked;
  speechCfg.voice = $('cfg-voice').value;
  speechCfg.rate = parseFloat($('cfg-rate').value) || 1.0;
  asrEnabled = $('cfg-asr').checked;

  const partial = {
    character: $('cfg-character').value,
    provider: $('cfg-provider').value,
    ollama: { baseUrl: $('cfg-ollama-url').value.trim(), model: $('cfg-ollama-model').value.trim() },
    openai: {
      baseUrl: $('cfg-openai-url').value.trim(),
      apiKey: $('cfg-openai-key').value.trim(),
      model: $('cfg-openai-model').value.trim()
    },
    webSearchEnabled: $('cfg-web').checked,
    search: {
      provider: $('cfg-search-provider').value,
      tavilyApiKey: $('cfg-tavily-key').value.trim()
    },
    speech: { enabled: speechCfg.enabled, voice: speechCfg.voice, rate: speechCfg.rate, pitch: speechCfg.pitch },
    asr: {
      enabled: asrEnabled,
      model: $('cfg-asr-model').value.trim() || 'whisper-1',
      language: $('cfg-asr-lang').value.trim()
    },
    memory: { enabled: $('cfg-memory').checked },
    kb: { enabled: $('cfg-kb').checked, strict: $('cfg-kb-strict').checked },
    systemPrompt: $('cfg-system').value
  };
  await window.api.saveConfig(partial);
  // 桌面/桌寵設定走專用 IPC（會即時套用視窗行為並持久化）
  try {
    await window.api.setDesktop({
      clickThrough: $('cfg-clickthrough').checked,
      alwaysOnTop: $('cfg-ontop').checked,
      autoLaunch: $('cfg-autolaunch').checked
    });
  } catch (_e) {}
  updateMuteIcon();
  updateMicUi();
  // 立即套用角色（不必重開程式）
  try {
    if ($('cfg-character').value) await window.L2D.loadModel($('cfg-character').value);
  } catch (e) {
    console.error('[L2D] 換角色失敗', e);
  }
  $('settings-msg').textContent = '已儲存 ✓';
  setTimeout(() => {
    $('settings-msg').textContent = '';
    $('settings').classList.add('hidden');
  }, 700);
}

function bindUI() {
  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    send();
  });
  $('btn-settings').addEventListener('click', () => {
    loadSettings();
    $('settings').classList.remove('hidden');
  });
  $('btn-cancel').addEventListener('click', () => $('settings').classList.add('hidden'));
  $('btn-save').addEventListener('click', saveSettings);
  $('cfg-provider').addEventListener('change', toggleProviderGroups);
  $('cfg-search-provider').addEventListener('change', toggleTavily);
  $('btn-ollama-refresh').addEventListener('click', refreshOllamaModels);
  $('btn-detect-chromeai').addEventListener('click', detectChromeAI);
  $('btn-clear-memory').addEventListener('click', async () => {
    try {
      await window.api.clearMemory();
      const st = await window.api.memoryStats();
      $('memory-stats').textContent = '已清除，目前 ' + ((st && st.count) || 0) + ' 則對話';
    } catch (e) {
      $('memory-stats').textContent = '清除失敗：' + e.message;
    }
  });
  $('cfg-rate').addEventListener('input', () => {
    $('cfg-rate-val').textContent = Number($('cfg-rate').value).toFixed(1) + 'x';
  });
  $('btn-mic').addEventListener('click', toggleMic);

  // 標題列靜音切換（即時生效並存檔）
  $('btn-mute').addEventListener('click', async () => {
    speechCfg.enabled = !speechCfg.enabled;
    updateMuteIcon();
    if (!speechCfg.enabled) stopSpeaking();
    try { await window.api.saveConfig({ speech: { enabled: speechCfg.enabled } }); } catch (_e) {}
  });

  $('btn-min').addEventListener('click', () => window.api.minimize());
  $('btn-close').addEventListener('click', () => window.api.close());
  window.api.onStatus((s) => showStatus(s));
  // 系統匣（托盤）「開啟設定…」
  if (window.api.onOpenSettings) {
    window.api.onOpenSettings(() => { loadSettings(); $('settings').classList.remove('hidden'); });
  }

  // 語音清單常常是非同步載入
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

async function boot() {
  bindUI();
  const cfg = await loadSettings();
  const ok = await window.L2D.init($('live2d'), cfg && cfg.character);
  if (!ok) showStatus('Live2D 載入失敗');
}

window.addEventListener('DOMContentLoaded', boot);
