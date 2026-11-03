#!/usr/bin/env node
/**
 * 每日一学 · 「AI 前沿」与「投资」素材抓取
 *
 * 做两件事：
 *   1. 抓当天的公开素材：Hugging Face 每日论文、Hacker News 热帖、GitHub 新项目、
 *      腾讯行情（指数 + 近 30 日走势）、东方财富 7×24 快讯；
 *   2. 把素材交给模型，写成中文的「今天在发生什么 / 为什么值得看」，
 *      分别写进 data/frontier.js 与 data/invest.js。
 *
 * 用法：
 *   node scripts/fetch-extra.mjs                 # 抓今天
 *   node scripts/fetch-extra.mjs --date 2026-11-03
 *   node scripts/fetch-extra.mjs --only frontier # 只抓前沿
 *   node scripts/fetch-extra.mjs --force         # 覆盖已存在的当天条目
 *   node scripts/fetch-extra.mjs --mock          # 不联网不调模型，写占位条目（验收用）
*   node scripts/fetch-extra.mjs --dump          # 只抓素材并打印，不写文件（排查数据源用）
 *
 * 环境变量：API_KEY / BASE_URL / MODEL 与 generate.mjs 相同。
 * 任何一栏抓失败都只跳过那一栏（页面上没有当天数据就不显示该板块），不阻塞每天的正文生成。
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTIER_FILE = path.join(ROOT, 'data', 'frontier.js');
const INVEST_FILE = path.join(ROOT, 'data', 'invest.js');

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes('--' + f);
const argVal = (f, d) => {
  const i = args.indexOf('--' + f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};

const TZ = process.env.TZ || 'Asia/Shanghai';
const todayLocal = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
const DATE = argVal('date', todayLocal());
const FORCE = hasFlag('force');
const MOCK = hasFlag('mock');
const ONLY = argVal('only', '');
const KEY = process.env.API_KEY || process.env.OPENAI_API_KEY || '';
const BASE = (process.env.BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
const MODEL = process.env.MODEL || 'deepseek-chat';

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn(...a);

/* ---------------- 网络 ---------------- */

async function httpText(url, { headers = {}, timeout = 25000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'daily-learn/1.0 (+https://github.com/qing-qian152/knowledges-shared-station)', ...headers },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { text: decode(buf, res.headers.get('content-type') || ''), buf };
}

function decode(buf, contentType = '') {
  const head = buf.subarray(0, 2048).toString('latin1');
  const gbk = /charset=["']?gb2312|charset=["']?gbk/i.test(contentType + head) || /^\s*v_(sh|sz|hk|us)/.test(head);
  if (gbk) {
    try { return new TextDecoder('gbk').decode(buf); } catch { return buf.toString('latin1'); }
  }
  return buf.toString('utf8');
}

async function httpJson(url, opts) {
  const { text } = await httpText(url, opts);
  return JSON.parse(text);
}

const tryOr = async (label, fn, fallback) => {
  try {
    return await fn();
  } catch (e) {
    warn(`⚠ ${label} 抓取失败：${String(e.message || e).slice(0, 160)}`);
    return fallback;
  }
};

/* ---------------- 素材：AI 前沿 ---------------- */

async function getHuggingFace() {
  const list = await httpJson('https://huggingface.co/api/daily_papers');
  return (Array.isArray(list) ? list : []).slice(0, 8).map((p) => {
    const paper = p.paper || p;
    return {
      title: paper.title || '',
      url: `https://huggingface.co/papers/${paper.id || ''}`,
      upvotes: p.upvotes ?? paper.upvotes ?? null,
      publishedAt: String(paper.publishedAt || p.publishedAt || '').slice(0, 10),
      authors: (paper.authors || []).slice(0, 3).map((a) => a.name).filter(Boolean).join(', '),
      abstract: String(paper.summary || '').replace(/\s+/g, ' ').slice(0, 420),
    };
  }).filter((x) => x.title && x.url);
}

async function getHackerNews() {
  const ids = (await httpJson('https://hacker-news.firebaseio.com/v0/topstories.json')).slice(0, 24);
  const items = await Promise.all(ids.map((id) =>
    httpJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)));
  return items
    .filter((x) => x && x.type === 'story' && x.title && x.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => ({
      title: x.title,
      url: x.url || `https://news.ycombinator.com/item?id=${x.id}`,
      score: x.score,
      comments: x.descendants || 0,
      at: new Date((x.time || 0) * 1000).toISOString().slice(0, 10),
    }));
}

async function getRepos() {
  const since = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  const q = encodeURIComponent(`created:>${since} stars:>1500`);
  const data = await httpJson(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=12`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  return (data.items || []).slice(0, 10).map((r) => ({
    name: r.full_name,
    url: r.html_url,
    stars: r.stargazers_count,
    lang: r.language || '',
    desc: String(r.description || '').slice(0, 200),
    topics: (r.topics || []).slice(0, 4),
  }));
}

async function frontierMaterial() {
  const [hf, hn, repos] = await Promise.all([
    tryOr('Hugging Face 论文榜', getHuggingFace, []),
    tryOr('Hacker News', getHackerNews, []),
    tryOr('GitHub 新项目', getRepos, []),
  ]);
  return { hf, hn, repos };
}

/* ---------------- 素材：投资 ---------------- */

const INDICES = [
  ['sh000001', '上证指数'],
  ['sz399001', '深证成指'],
  ['sz399006', '创业板指'],
  ['sh000300', '沪深300'],
  ['hkHSI', '恒生指数'],
  ['usIXIC', '纳斯达克综合'],
];

async function getQuotes() {
  const codes = INDICES.map(([c]) => c).join(',');
  const { text } = await httpText(`https://qt.gtimg.cn/q=${codes}`, { headers: { Referer: 'https://gu.qq.com/' } });
  const out = [];
  for (const line of text.split(';')) {
    const m = line.match(/v_([a-z0-9]+)="([^"]*)"/i);
    if (!m) continue;
    const code = m[1];
    const f = m[2].split('~');
    const name = f[1] || (INDICES.find(([c]) => c === code) || [])[1] || code;
    const last = Number(f[3]);
    const prev = Number(f[4]);
    if (!isFinite(last) || !isFinite(prev) || !prev) continue;
    out.push({
      name,
      code,
      last,
      chg: +(last - prev).toFixed(2),
      pct: +(((last - prev) / prev) * 100).toFixed(2),
      url: `https://gu.qq.com/${code}`,
    });
  }
  return out;
}

async function getSeries(code, n = 30) {
  for (const suffix of ['qfq', '']) {
    try {
      const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,${n},${suffix}`;
      const data = await httpJson(url);
      const rows = data?.data?.[code]?.day || data?.data?.[code]?.qfqday || [];
      const series = rows
        .map((r) => [String(r[0]).slice(0, 10), Number(r[2])])
        .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p[0]) && isFinite(p[1]));
      if (series.length >= 2) return series;
    } catch { /* 换一种参数再试 */ }
  }
  return [];
}

async function getNews() {
  const url = 'https://np-listapi.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_724&fastColumn=102&sortEnd=&pageSize=14&req_trace=1';
  const data = await httpJson(url, { headers: { Referer: 'https://finance.eastmoney.com/' } });
  const list = data?.data?.fastNewsList || [];
  return list.map((n) => {
    const title = String(n.title || '').trim();
    const summary = String(n.summary || '').replace(/^【[^】]*】/, '').trim();
    return {
      time: String(n.showTime || '').slice(0, 16),
      title,
      gist: summary.slice(0, 200),
      source: '东方财富 7×24 快讯',
      url: n.code ? `https://finance.eastmoney.com/a/${n.code}.html` : '',
    };
  }).filter((n) => n.title).slice(0, 10);
}

async function investMaterial() {
  const quotes = await tryOr('腾讯行情', getQuotes, []);
  const [seriesList, news] = await Promise.all([
    Promise.all(quotes.map((q) => tryOr(`走势 ${q.code}`, () => getSeries(q.code), []))),
    tryOr('东方财富快讯', getNews, []),
  ]);
  const indices = quotes.map((q, i) => ({ ...q, series: seriesList[i] || [], source: '腾讯行情' }));
  return { indices, news, at: new Date().toISOString() };
}

/* ---------------- 模型 ---------------- */

function extractJson(text) {
  let s = String(text || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(s); } catch { /* 往下走 */ }
  const start = s.indexOf('{');
  if (start < 0) throw new Error('输出里没有 JSON 对象');
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error(`JSON 没有闭合（疑似被截断），结尾：${s.slice(-80)}`);
  return JSON.parse(s.slice(start, end + 1));
}

async function callModel(prompt, { temperature = 0.6, maxTokens = 3000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: '你是严谨的中文科技编辑与财经编辑，只输出一个合法的 JSON 对象，不要任何解释、注释或 Markdown 围栏。' },
        {
          role: 'user',
          content: attempt === 1
            ? prompt
            : `${prompt}\n\n【重要】上一次你的输出不是完整合法的 JSON。这次只输出一个 JSON 对象，字符串用双引号，不要有尾随内容。`,
        },
      ],
      temperature: attempt === 1 ? temperature : 0.3,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    };
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
    const data = await res.json();
    const choice = data?.choices?.[0];
    const raw = choice?.message?.content || '';
    if (choice?.finish_reason === 'length') { lastErr = new Error('输出被截断'); continue; }
    try {
      return extractJson(raw);
    } catch (e) {
      lastErr = e;
      log(`⚠ 第 ${attempt} 次解析失败：${e.message.split('\n')[0]}`);
    }
  }
  throw new Error(`两次都没拿到合法 JSON：${lastErr?.message}`);
}

/* ---------------- 提示词 ---------------- */

function frontierPrompt(m) {
  return `今天是 ${DATE}。下面是我抓到的当天公开素材，请写成一份给中文读者看的「AI 前沿速递」。

【Hugging Face 每日论文榜（按热度）】
${JSON.stringify(m.hf, null, 1)}

【Hacker News 今日热帖】
${JSON.stringify(m.hn, null, 1)}

【GitHub 近 60 天冒头的项目】
${JSON.stringify(m.repos, null, 1)}

请只输出一个 JSON 对象，字段严格如下：
{
  "lead": "一段 90-140 字的导语：今天这几条共同在说什么，指出现场的主线，不要罗列",
  "items": [
    { "title": "中文标题，25 字以内，说清做了什么，不要直译英文标题",
      "url": "必须是上面素材里出现过的链接，不能自己编",
      "source": "来源，例如「Hugging Face 每日论文 · 第 1 名（213 赞）」或「Hacker News · 412 分」",
      "publishedAt": "发布时间或榜单时间，如「2026-11-02 上榜」",
      "meta": "一句客观的量化信息，如「4 个 harness × 9 个模型」，没有就写空字符串",
      "takeaway": "一句话记住：它到底改变了对什么的理解，30-45 字",
      "why": "为什么值得看：60-100 字，要说出方法上的关键点和它的问题设定，不要复述摘要" }
  ],
  "repos": [
    { "name": "owner/repo", "url": "仓库链接", "stars": 12345, "lang": "主语言",
      "what": "它解决什么问题，40-60 字，说人话",
      "tryThis": "今天可以怎么试，要具体到点哪里、跑什么命令",
      "minutes": 20 }
  ],
  "task": { "title": "今天上手做这一件", "goal": "一句话目标", "time": "约 20 分钟", "url": "材料链接（可选）",
            "steps": ["第一步", "第二步", "第三步"], "done": "做完的标准", "output": "产出什么" },
  "concept": { "term": "今天顺带补一个概念", "line": "一句话讲清" },
  "keywords": ["三个词", "最多四个"],
  "note": "最后一句提醒读者别被数字骗了之类的话，40 字以内"
}

硬性要求：
1. items 选 3-4 条，必须来自上面的素材，url 必须原样使用素材里的链接，**不许编造链接或论文**。
2. 只解读素材里写出来的事实；素材没写的背景（发布日期、团队规模、融资金额）不要编。确实需要背景时，用「据其摘要」这类限定语。
3. 中文全角标点；字符串里需要引号时用「」或“”，不要用 ASCII 双引号。
4. repos 选 2-3 个真正能跑起来的，tryThis 要能让读者 20 分钟内看到结果。
5. 不要出现「赋能」「闭环」「生态」这类空词。
6. JSON 必须能被 JSON.parse 直接解析。`;
}

function investPrompt(m) {
  const idx = m.indices.map((i) => ({
    名称: i.name, 代码: i.code, 最新: i.last, 涨跌: i.chg, 涨跌幅: i.pct,
    近30日: i.series.map((p) => `${p[0]} ${p[1]}`),
  }));
  return `今天是 ${DATE}（北京时间）。下面是抓到的行情与快讯，请写成一份给中文读者看的「今日投资观察」。

【指数行情】
${JSON.stringify(idx, null, 1)}

【7×24 快讯】
${JSON.stringify(m.news, null, 1)}

请只输出一个 JSON 对象，字段严格如下：
{
  "brief": "120-180 字的今日一眼：几个市场涨跌的对比说明什么，注意「哪个涨得最凶 / 跌得最狠」本身是信息；不要预测，不要给建议",
  "knowledge": {
    "term": "今天讲一个投资概念（如市盈率、换手率、久期、北向资金、量价背离……），每天换一个，不要重复常识",
    "plain": "90-140 字，说人话地解释它是什么、怎么算、看它能回答什么问题",
    "example": "用一个具体的数字例子算一遍",
    "pitfall": "最容易踩的坑，40-70 字",
    "quiz": { "q": "一道单选题题干", "options": ["A", "B", "C", "D"], "answer": 1, "explain": "解析：说清对在哪、错项错在哪" }
  },
  "news": [
    { "time": "快讯时间，如 2026-11-03 07:50", "title": "标题（可压缩，但要保真）",
      "source": "东方财富 7×24 快讯", "gist": "40-70 字：这条消息为什么重要，对哪个板块有影响",
      "url": "必须原样使用素材里的 url，没有就写空字符串" }
  ],
  "disclaimer": "以上行情与新闻均为公开信息整理，数据截至标注时间，仅用于学习与了解市场，不构成任何投资建议；据此操作风险自负。"
}

硬性要求：
1. brief 里引用的涨跌幅必须和上面数据一致，不要自己算错；涨跌方向说清楚。
2. news 选 3-5 条与市场真正相关的（宏观、政策、行业、公司业绩），不要选纯广告或无关社会新闻；标题不许改写事实。
3. 只描述，不预测、不给买卖建议；不出现「牛股」「抄底」「必涨」这类词。
4. 中文全角标点；字符串里需要引号时用「」或“”。
5. JSON 必须能被 JSON.parse 直接解析。`;
}

/* ---------------- 校验 ---------------- */

function checkFrontier(f) {
  if (!f || typeof f !== 'object') throw new Error('返回不是对象');
  if (!String(f.lead || '').trim()) throw new Error('缺少 lead');
  if (!Array.isArray(f.items) || f.items.length < 2) throw new Error('items 少于 2 条');
  f.items.forEach((it, i) => {
    if (!it || !it.title) throw new Error(`items[${i}] 缺 title`);
    if (!/^https?:\/\//.test(String(it.url || ''))) throw new Error(`items[${i}] 的 url 不是 http(s)`);
  });
  if (!Array.isArray(f.keywords)) f.keywords = [];
  return f;
}

function checkInvest(v) {
  if (!v || typeof v !== 'object') throw new Error('返回不是对象');
  if (!Array.isArray(v.indices) || !v.indices.length) throw new Error('缺少 indices');
  v.indices.forEach((x, i) => {
    if (!x || !x.name) throw new Error(`indices[${i}] 缺 name`);
    if (!isFinite(Number(x.last))) throw new Error(`indices[${i}] 的 last 不是数字`);
    if (!Array.isArray(x.series)) x.series = [];
  });
  const k = v.knowledge;
  if (!k || !k.term) throw new Error('缺少 knowledge.term');
  if (!k.quiz || !Array.isArray(k.quiz.options) || !Number.isInteger(k.quiz.answer)) {
    throw new Error('knowledge.quiz 不完整');
  }
  if (!Array.isArray(v.news)) v.news = [];
  return v;
}

/* ---------------- 读写数据文件 ---------------- */

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function loadStore(file, globalName) {
  if (!(await exists(file))) return { header: '', data: {} };
  const src = await readFile(file, 'utf8');
  const header = (src.match(/^(\/\/[^\n]*\n)+/) || [''])[0];
  let data = {};
  try {
    const w = {};
    new Function('window', src)(w);
    data = w[globalName] || {};
  } catch (e) {
    warn(`⚠ ${path.basename(file)} 解析失败，将重建：${e.message}`);
  }
  return { header, data };
}

async function saveStore(file, globalName, header, data) {
  const dates = Object.keys(data).sort();
  const ordered = {};
  for (const d of dates) ordered[d] = data[d];
  const body = `${header || '// 由每日例行流程写入；结构见 README「AI 前沿板块 / 投资板块」两节。\n'}window.${globalName} = ${JSON.stringify(ordered, null, 2)};\n`;
  await writeFile(file, body, 'utf8');
}

/* ---------------- 主流程 ---------------- */

async function doFrontier() {
  const { header, data } = await loadStore(FRONTIER_FILE, 'LEARN_FRONTIER');
  if (data[DATE] && !FORCE) {
    log(`= 前沿：${DATE} 已有数据，跳过（要覆盖加 --force）`);
    return;
  }
  if (MOCK) {
    data[DATE] = {
      updated: new Date().toISOString(),
      lead: '（占位）这里会写今天 AI 圈的主线。',
      items: [
        { title: '（占位）一条论文', url: 'https://huggingface.co/papers', source: '占位', publishedAt: DATE, meta: '', takeaway: '占位', why: '占位' },
        { title: '（占位）一条热帖', url: 'https://news.ycombinator.com/', source: '占位', publishedAt: DATE, meta: '', takeaway: '占位', why: '占位' },
      ],
      repos: [], keywords: ['占位'], note: '占位',
    };
    await saveStore(FRONTIER_FILE, 'LEARN_FRONTIER', header, data);
    log(`✓ 前沿（占位）已写入 ${DATE}`);
    return;
  }
  const material = await frontierMaterial();
  log(`▸ 素材：HF 论文 ${material.hf.length} 条 · HN ${material.hn.length} 条 · 仓库 ${material.repos.length} 个`);
  if (!material.hf.length && !material.hn.length) throw new Error('前沿素材全空，跳过');
  if (!KEY) throw new Error('未配置 API_KEY，无法写中文解读');
  const out = checkFrontier(await callModel(frontierPrompt(material)));
  // 只留素材里真实存在的链接：模型偶尔会把 url 编得很像真的，这类链接点开是 404
  const allowed = new Set([
    ...material.hf.map((x) => x.url), ...material.hn.map((x) => x.url), ...material.repos.map((x) => x.url),
  ]);
  const dropped = [];
  out.items = out.items.filter((it) => (allowed.has(it.url) ? true : dropped.push(it.title) && false));
  if (dropped.length) warn(`⚠ 前沿：丢弃 ${dropped.length} 条链接不在素材里的条目：${dropped.join(' / ')}`);
  if (out.items.length < 2) throw new Error('过滤掉编造链接后不足 2 条，跳过');
  if (Array.isArray(out.repos)) out.repos = out.repos.filter((r) => allowed.has(r.url));
  if (out.task && out.task.url && !allowed.has(out.task.url)) out.task.url = '';
  out.updated = new Date().toISOString();
  data[DATE] = out;
  await saveStore(FRONTIER_FILE, 'LEARN_FRONTIER', header, data);
  log(`✓ 前沿已写入 ${DATE}：${out.items.length} 条资讯 · ${(out.repos || []).length} 个仓库`);
}

async function doInvest() {
  const { header, data } = await loadStore(INVEST_FILE, 'LEARN_INVEST');
  if (data[DATE] && !FORCE) {
    log(`= 投资：${DATE} 已有数据，跳过（要覆盖加 --force）`);
    return;
  }
  if (MOCK) {
    data[DATE] = {
      updated: new Date().toISOString(),
      asof: `${DATE} 收盘（占位）`,
      brief: '（占位）这里会写今天的行情一眼。',
      knowledge: { term: '市盈率（PE）', plain: '占位', example: '占位', pitfall: '占位', quiz: { q: '占位', options: ['A', 'B'], answer: 1, explain: '占位' } },
      indices: [{ name: '上证指数', code: 'sh000001', last: 3600, chg: 1, pct: 0.03, source: '占位', series: [] }],
      news: [],
      disclaimer: '占位',
    };
    await saveStore(INVEST_FILE, 'LEARN_INVEST', header, data);
    log(`✓ 投资（占位）已写入 ${DATE}`);
    return;
  }
  const material = await investMaterial();
  log(`▸ 素材：指数 ${material.indices.length} 个（${material.indices.filter((i) => i.series.length > 1).length} 个有走势）· 快讯 ${material.news.length} 条`);
  if (!material.indices.length) throw new Error('没抓到行情，跳过');
  if (!KEY) throw new Error('未配置 API_KEY，无法写中文解读');
  const out = await callModel(investPrompt(material), { temperature: 0.4, maxTokens: 2600 });
  out.updated = new Date().toISOString();
  // 行情与走势一律以抓到的数字为准：模型只负责写文字，指数表由我们填，
  // 这样它就算把 -1.33% 记成 -1.13% 也不会进到页面上。
  out.indices = material.indices;
  if (Array.isArray(out.news)) {
    const ok = new Set(material.news.map((n) => n.url).filter(Boolean));
    out.news = out.news.map((n) => (n.url && !ok.has(n.url) ? { ...n, url: '' } : n));
  }
  if (!out.asof) {
    const t = new Date().toLocaleString('sv-SE', { timeZone: TZ }).slice(0, 16);
    out.asof = `${t}（北京时间）`;
  }
  checkInvest(out);
  data[DATE] = out;
  await saveStore(INVEST_FILE, 'LEARN_INVEST', header, data);
  log(`✓ 投资已写入 ${DATE}：${out.indices.length} 个指数 · ${out.news.length} 条消息`);
}

async function main() {
  log(`▸ 日期 ${DATE}（${TZ}）${MOCK ? ' · mock' : ''}`);
  if (hasFlag('dump')) {
    const [f, v] = await Promise.all([frontierMaterial(), investMaterial()]);
    log(JSON.stringify({
      frontier: { hf: f.hf.length, hn: f.hn.length, repos: f.repos.length, sample: f.hf[0] || f.hn[0] || null },
      invest: { indices: v.indices.map((i) => [i.name, i.last, i.pct, i.series.length]), news: v.news.slice(0, 3) },
    }, null, 1));
    return;
  }
  const jobs = [];
  if (!ONLY || ONLY === 'frontier') jobs.push(['前沿', doFrontier]);
  if (!ONLY || ONLY === 'invest') jobs.push(['投资', doInvest]);
  let failed = 0;
  for (const [label, fn] of jobs) {
    try {
      await fn();
    } catch (e) {
      failed++;
      warn(`✗ ${label} 跳过：${String(e.message || e).slice(0, 200)}`);
    }
  }
  if (failed === jobs.length) {
    // 两栏都失败通常是网络或 key 的问题，让 CI 红掉，免得还以为更新过了
    console.error('✗ 前沿与投资都没写成');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('✗ ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
