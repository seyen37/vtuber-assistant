const $ = (id) => document.getElementById(id);

let history = [];     // [{role, content}]
let sending = false;
let statusTimer = null;
let speakTimer = null;

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

function speakFor(text) {
  // 依文字長度模擬講話時間，期間做嘴型動作
  const ms = Math.min(8000, 800 + (text || '').length * 45);
  window.L2D.setSpeaking(true);
  clearTimeout(speakTimer);
  speakTimer = setTimeout(() => window.L2D.setSpeaking(false), ms);
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
  window.L2D.setSpeaking(true);
  const typing = addMsg('ai', '思考中…');
  typing.classList.add('typing');

  try {
    const res = await window.api.sendMessage({ history });
    typing.remove();
    if (res && res.ok) {
      addMsg('ai', res.content, res.sources);
      history.push({ role: 'assistant', content: res.content });
      speakFor(res.content);
    } else {
      window.L2D.setSpeaking(false);
      addMsg('ai', '出錯了：' + ((res && res.error) || '未知錯誤'));
    }
  } catch (e) {
    typing.remove();
    window.L2D.setSpeaking(false);
    addMsg('ai', '出錯了：' + e.message);
  } finally {
    sending = false;
    $('send').disabled = false;
    hideStatusSoon();
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
  toggleProviderGroups();
  toggleTavily();
  return cfg;
}

async function saveSettings() {
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
    systemPrompt: $('cfg-system').value
  };
  await window.api.saveConfig(partial);
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
  $('btn-min').addEventListener('click', () => window.api.minimize());
  $('btn-close').addEventListener('click', () => window.api.close());
  window.api.onStatus((s) => showStatus(s));
}

async function boot() {
  bindUI();
  const cfg = await loadSettings();
  const ok = await window.L2D.init($('live2d'), cfg && cfg.character);
  if (!ok) showStatus('Live2D 載入失敗');
}

window.addEventListener('DOMContentLoaded', boot);
