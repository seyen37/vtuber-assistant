// 網路搜尋模組。對外提供 webSearch(query, cfg) -> [{title, url, snippet}]。
// 預設 DuckDuckGo（免 API key）；亦可在設定切換成 Tavily（需 key、agent 效果更佳）。

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

// DuckDuckGo 的連結是轉址：//duckduckgo.com/l/?uddg=<真實網址>&...
function resolveDdgUrl(href) {
  if (!href) return '';
  let h = href;
  if (h.startsWith('//')) h = 'https:' + h;
  const m = h.match(/[?&]uddg=([^&]+)/);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch (_e) { return h; }
  }
  return h;
}

// 解析 html.duckduckgo.com 回傳的 HTML。匯出供測試使用。
function parseDdgHtml(html, max) {
  const results = [];
  // 逐個 result 區塊比對：標題連結 + 之後的摘要
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const links = [];
  let lm;
  while ((lm = linkRe.exec(html)) !== null) {
    links.push({ url: resolveDdgUrl(lm[1]), title: stripTags(lm[2]) });
  }
  const snippets = [];
  let sm;
  while ((sm = snippetRe.exec(html)) !== null) {
    snippets.push(stripTags(sm[1]));
  }
  for (let i = 0; i < links.length && results.length < (max || 5); i++) {
    if (!links[i].url || !links[i].title) continue;
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || ''
    });
  }
  return results;
}

async function ddgSearch(query, max) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      Accept: 'text/html'
    }
  });
  if (!res.ok) throw new Error(`DuckDuckGo 回應 ${res.status}`);
  const html = await res.text();
  return parseDdgHtml(html, max);
}

async function tavilySearch(query, cfg, max) {
  const apiKey = cfg.search && cfg.search.tavilyApiKey;
  if (!apiKey) throw new Error('Tavily 需要 API key（請於設定填入）');
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: max || 5,
      search_depth: 'basic'
    })
  });
  if (!res.ok) throw new Error(`Tavily 回應 ${res.status}`);
  const data = await res.json();
  return (data.results || []).slice(0, max || 5).map((r) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: r.content || ''
  }));
}

async function webSearch(query, cfg) {
  cfg = cfg || {};
  const s = cfg.search || {};
  const max = s.maxResults || 5;
  if ((s.provider || 'duckduckgo') === 'tavily') {
    return tavilySearch(query, cfg, max);
  }
  return ddgSearch(query, max);
}

module.exports = { webSearch, ddgSearch, tavilySearch, parseDdgHtml, resolveDdgUrl, stripTags };
