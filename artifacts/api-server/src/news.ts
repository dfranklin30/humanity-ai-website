// AI News aggregator — pulls free, no-key sources (arXiv + Google News RSS across
// AI, frontier models, and ethics & policy) and returns normalized items for the homepage
// "AI News" ticker plus an arXiv "latest research & models" feed. Results are
// cached in memory so page loads never hammer the upstreams. Fails soft: a dead
// source is skipped, and on total failure we serve the last good cache.

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  category: "news" | "policy" | "research";
}
export interface ArxivItem {
  title: string;
  authors: string;
  url: string;
  published: string | null;
  summary: string;
}
export interface NewsPayload {
  ticker: NewsItem[];
  arxiv: ArxivItem[];
  updatedAt: string;
}

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
let cache: { at: number; data: NewsPayload } | null = null;
let inflight: Promise<NewsPayload> | null = null;

async function fetchText(url: string, timeoutMs = 15000): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HumanityAINewsBot/1.0)" },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, d) => {
      try { return String.fromCharCode(Number(d)); } catch { return ""; }
    })
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function toIso(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(decodeEntities(raw));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Parse an RSS 2.0 feed (Google News etc.) into news items.
function parseRss(xml: string, source: string, category: NewsItem["category"], limit: number): NewsItem[] {
  const items: NewsItem[] = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  for (const c of chunks) {
    const block = "<item " + c.split(/<\/item>/i)[0];
    const titleRaw = firstTag(block, "title");
    const linkRaw = firstTag(block, "link");
    if (!titleRaw || !linkRaw) continue;
    const title = decodeEntities(titleRaw);
    const url = decodeEntities(linkRaw);
    if (!title || !/^https?:/i.test(url)) continue;
    items.push({ title, source, url, publishedAt: toIso(firstTag(block, "pubDate")), category });
    if (items.length >= limit) break;
  }
  return items;
}

// Parse an arXiv Atom feed into paper entries.
function parseArxiv(xml: string, limit: number): ArxivItem[] {
  const out: ArxivItem[] = [];
  const entries = xml.split(/<entry>/i).slice(1);
  for (const e of entries) {
    const block = e.split(/<\/entry>/i)[0];
    const title = decodeEntities(firstTag(block, "title") || "");
    const id = decodeEntities(firstTag(block, "id") || "");
    const summary = decodeEntities(firstTag(block, "summary") || "").slice(0, 300);
    const authors = (block.match(/<name>([\s\S]*?)<\/name>/gi) || [])
      .map((m) => decodeEntities(m))
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
    if (!title || !/^https?:/i.test(id)) continue;
    out.push({ title, authors, url: id, published: toIso(firstTag(block, "published")), summary });
    if (out.length >= limit) break;
  }
  return out;
}

function gnews(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

// The three headline queries are chosen to match what this organization is for.
// The third slot used to track chip stocks and semiconductor prices; it now
// follows ethics, governance, regulation, safety, bias, literacy and access —
// the subjects the board actually works on. arXiv still supplies the research
// tail, unchanged.
async function build(): Promise<NewsPayload> {
  const [aiNews, modelNews, policyNews, arxivXml] = await Promise.all([
    fetchText(gnews("artificial intelligence when:7d")),
    fetchText(gnews("(OpenAI OR Anthropic OR \"Google DeepMind\" OR \"Meta AI\" OR Mistral OR xAI) AI model when:7d")),
    fetchText(
      gnews(
        '("AI ethics" OR "AI governance" OR "responsible AI" OR "AI regulation" OR "AI safety" OR "algorithmic bias" OR "AI literacy" OR "AI accessibility") when:7d',
      ),
    ),
    fetchText(
      "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=12",
    ),
  ]);

  const news = [
    ...(aiNews ? parseRss(aiNews, "AI News", "news", 12) : []),
    ...(modelNews ? parseRss(modelNews, "Models", "news", 8) : []),
    ...(policyNews ? parseRss(policyNews, "Ethics & Policy", "policy", 10) : []),
  ];
  const arxiv = arxivXml ? parseArxiv(arxivXml, 10) : [];

  // Dedupe by leading title text.
  const seen = new Set<string>();
  const ticker: NewsItem[] = [];
  for (const n of news) {
    const key = n.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    ticker.push(n);
  }
  // Fold the newest arXiv papers into the ticker as research highlights.
  for (const a of arxiv.slice(0, 5)) {
    ticker.push({ title: a.title, source: "arXiv", url: a.url, publishedAt: a.published, category: "research" });
  }
  // Newest first where a date is known.
  ticker.sort(
    (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
  );

  return { ticker: ticker.slice(0, 30), arxiv, updatedAt: new Date().toISOString() };
}

/** Cached aggregate news for the homepage ticker + arXiv feed. Never throws. */
export async function getAggregatedNews(): Promise<NewsPayload> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await build();
      if (data.ticker.length || data.arxiv.length) {
        cache = { at: Date.now(), data };
        return data;
      }
      if (cache) return cache.data;
      return data;
    } catch {
      if (cache) return cache.data;
      return { ticker: [], arxiv: [], updatedAt: new Date().toISOString() };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
