#!/usr/bin/env node
/**
 * 每日一学 · 内容生成脚本
 *
 * 用法：
 *   node scripts/generate.mjs                # 生成今天的内容
 *   node scripts/generate.mjs --date 2026-11-02
 *   node scripts/generate.mjs --topic 3      # 指定 topics.json 里的第 3 个主题
 *   node scripts/generate.mjs --mock         # 不调模型，用主题词生成占位内容（先看页面效果）
 *   node scripts/generate.mjs --force        # 覆盖已存在的当天文件
 *
 * 环境变量：
 *   API_KEY    模型 API Key（也认 OPENAI_API_KEY）
 *   BASE_URL   默认 https://api.deepseek.com/v1
 *   MODEL      默认 deepseek-chat
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAYS_DIR = path.join(ROOT, 'data', 'days');
const TOPICS_FILE = path.join(ROOT, 'topics.json');
const INDEX_FILE = path.join(DAYS_DIR, 'index.js');

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes('--' + f);
const argVal = (f, d) => {
  const i = args.indexOf('--' + f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};

// GitHub Actions 跑在 UTC，cron 定在北京 06:00（=22:00 UTC 前一天）。
// 所以「今天是哪天」必须按目标时区算，否则内容日期会整体差一天。
const TZ = process.env.TZ || 'Asia/Shanghai';
const todayLocal = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekdayOf = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return WEEK[new Date(y, m - 1, d).getDay()];
};

const DATE = argVal('date', todayLocal());
const FORCE = hasFlag('force');
const MOCK = hasFlag('mock');
const KEY = process.env.API_KEY || process.env.OPENAI_API_KEY || '';
const BASE = (process.env.BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
const MODEL = process.env.MODEL || 'deepseek-chat';

// CI 里静默退化成占位内容会把整站变成空壳，宁可直接报错让人去配 secret。
if (!KEY && !MOCK && process.env.CI) {
  console.error('✗ 未配置 API_KEY。在 GitHub 仓库 Settings → Secrets 添加 DEEPSEEK_API_KEY 后重跑。');
  process.exit(1);
}

const outFile = path.join(DAYS_DIR, `${DATE}.js`);

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

/* ------------------------------------------------------------------ */

function buildPrompt(topic) {
  return `你是一位中文写作与英语教学都很扎实的内容编辑。请为「每日一学」生成 ${DATE}（${weekdayOf(DATE)}）的一整期内容。

今日的选题种子：
- 主题：${topic.theme}
- 语文：${topic.chinese}
- 古诗文：${topic.poem}
- 英文：${topic.english}
- AI 知识：${topic.ai}
- 听力：${topic.listening}

只输出一个 JSON 对象，不要任何解释、不要 markdown 代码围栏。字段结构必须严格如下（缺字段视为不合格）：

{
  "theme": "当日主题，8-14 字的短句",
  "chinese": {
    "title": "篇名（节选要标注）",
    "author": "作者",
    "tag": "体裁 · 主题，如 现代散文 · 写景",
    "readingTime": "约 N 分钟",
    "body": ["段落1", "段落2", "段落3"],
    "explain": [{ "line": "原句", "note": "讲解，可用 <b></b> 标重点" }],
    "words": [{ "w": "词", "meaning": "释义", "use": "用法点拨" }],
    "expressions": [{ "s": "好句", "why": "妙在哪里" }],
    "techniques": [{ "name": "手法名", "desc": "解释", "example": "文中例句" }],
    "imitation": { "prompt": "仿写任务", "steps": ["步骤1", "步骤2", "步骤3"] }
  },
  "poem": {
    "title": "诗题", "author": "作者", "dynasty": "朝代", "tag": "体裁",
    "body": ["诗句1，", "诗句2。"],
    "notes": [{ "line": "词", "note": "注释" }],
    "translation": "白话译文，一段",
    "appreciation": ["赏析段落1", "赏析段落2", "赏析段落3"],
    "recite": "背诵提示"
  },
  "english": {
    "title": "英文标题",
    "level": "CET-6 / IELTS 6.5",
    "words": 330,
    "body": ["段落1", "段落2", "段落3", "段落4"],
    "vocab": [{ "w": "单词", "pos": "n.", "cn": "中文释义", "ex": "英文例句" }],
    "phrases": [{ "p": "短语", "cn": "中文", "ex": "英文例句" }],
    "patterns": [{ "s": "原文句式", "cn": "中文意思", "note": "用法说明" }],
    "grammar": [{ "point": "语法点", "explain": "讲解", "example": "原文例句" }],
    "summary": "中文摘要，100-150 字",
    "questions": [{ "q": "题干（英文）", "options": ["选项A文字", "选项B文字", "选项C文字", "选项D文字"], "answer": 0, "explain": "中文解析" }],
    "output": { "prompt": "输出任务", "tasks": ["要求1", "要求2", "要求3"] }
  },
  "listening": {
    "title": "听力标题（如 VOA Learning English · 今日音频）",
    "level": "难度标签，如 慢速英语 / CET-6",
    "source": "来源站点名，如 VOA Learning English",
    "url": "当天音频所在页面的 http(s) 链接",
    "note": "一句话使用说明（在这个页面的哪里找音频、怎么配合听）"
  },
  "ai": {
    "term": "AI 概念名",
    "oneLiner": "一句话定义",
    "explain": ["讲清楚1", "讲清楚2", "讲清楚3"],
    "analogy": "一个生活化的比喻",
    "example": "真实场景举例",
    "takeaway": "一句话记住它",
    "quiz": { "q": "单选题干", "options": ["A", "B", "C", "D"], "answer": 1, "explain": "中文解析" },
    "next": "明天学什么"
  }
}

硬性要求：
1. 语文：选一篇公版名篇（明清以前，或 1949 年前已故作者）的节选，或你原创；600-900 字，3-5 段，首段最好抓住人。讲解 3-4 条，要具体到字词和节奏，不要说空话。好词 5-8 个，好句 3 句，写作手法 4-5 种，仿写任务要能当天写完。
2. 古诗文：与今日主题呼应的一首，注释 4-6 条，译文一段，赏析 3-4 段（要讲结构、讲字眼），背诵提示给结构线索。
3. 英文：你必须原创，300-350 词，分 4 段，CET-6 / IELTS 6.5 难度；句子要有长有短，避免模板腔。生词 10-12 个（含例句），短语 5-6 个，句式 3-4 个，语法点 3 个（都要从本篇原文里举例）。摘要 100-150 字中文。阅读题 5 道单选，answer 用 0 起始的下标，解析用中文说清错项为什么错。输出任务要求读者真正动笔。
4. 听力：不要编写听写文本。只给出一个真实可访问的英文听力页面链接（优先 VOA Learning English、BBC 6 Minute English 这类每天有更新的栏目），url 必须是 http(s) 开头、能在浏览器打开；note 说明在这个页面上怎么找到当天音频、怎么配合精听。
5. AI：每天一个概念，从基础往上走（Token、上下文窗口、幻觉、RAG、微调、Agent、Skill、MCP、评测……）。explain 三段要有递进，example 要具体到"你说什么、它做什么"。quiz 四个选项，answer 为下标。
6. 全部内容使用中文全角标点；字符串内部需要引号时用中文引号“”或「」，不要用 ASCII 双引号。
7. JSON 必须能被 JSON.parse 直接解析。`;
}

function stub(topic) {
  const day = WEEK[new Date().getDay()];
  return {
    theme: topic.theme,
    chinese: {
      title: '（占位）' + topic.chinese,
      author: '待生成',
      tag: '占位内容',
      readingTime: '—',
      body: ['这是占位内容。运行 `node scripts/generate.mjs --force` 并配置 API_KEY 后，这里会变成当天真正的文章。'],
      explain: [{ line: '占位', note: '配置好 API Key 后重新生成即可。' }],
      words: [{ w: '占位', meaning: '—', use: '—' }],
      expressions: [{ s: '—', why: '—' }],
      techniques: [{ name: '—', desc: '—', example: '—' }],
      imitation: { prompt: '—', steps: ['—'] },
    },
    poem: {
      title: '（占位）' + topic.poem, author: '—', dynasty: '—', tag: '—',
      body: ['占位'], notes: [{ line: '—', note: '—' }], translation: '—',
      appreciation: ['—'], recite: '—',
    },
    english: {
      title: 'Placeholder: ' + topic.english, level: 'CET-6', words: 0,
      body: ['Placeholder content. Configure API_KEY and re-run the generator.'],
      vocab: [{ w: 'placeholder', pos: 'n.', cn: '占位', ex: 'This is a placeholder.' }],
      phrases: [{ p: '—', cn: '—', ex: '—' }],
      patterns: [{ s: '—', cn: '—', note: '—' }],
      grammar: [{ point: '—', explain: '—', example: '—' }],
      summary: '占位摘要。',
      questions: [{ q: 'Placeholder question?', options: ['A', 'B', 'C', 'D'], answer: 0, explain: '占位解析。' }],
      output: { prompt: '—', tasks: ['—'] },
    },
    listening: {
      title: '（占位）' + topic.listening, level: '—', source: 'VOA Learning English',
      url: 'https://learningenglish.voanews.com/', note: '占位。',
    },
    ai: {
      term: '（占位）' + topic.ai, oneLiner: '占位。',
      explain: ['占位。', '占位。', '占位。'], analogy: '—', example: '—', takeaway: '—',
      quiz: { q: '占位？', options: ['A', 'B', 'C', 'D'], answer: 0, explain: '占位。' },
      next: '—',
    },
  };
}

async function callModel(prompt) {
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: '你是严谨的中文编辑与英语教师，只输出合法 JSON。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  };
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${t.slice(0, 400)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

function validate(day) {
  const need = ['chinese', 'poem', 'english', 'listening', 'ai'];
  const missing = need.filter((k) => !day[k] || typeof day[k] !== 'object');
  if (missing.length) throw new Error('缺少字段: ' + missing.join(', '));
  const e = day.english;
  if (!Array.isArray(e.questions) || e.questions.length < 3) throw new Error('english.questions 不足 3 题');
  e.questions.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`第 ${i + 1} 题缺少选项`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      throw new Error(`第 ${i + 1} 题 answer 下标越界`);
    }
  });
  const l = day.listening || {};
  if (!l.title) throw new Error('listening.title 缺失');
  if (!/^https?:\/\//.test(String(l.url || ''))) throw new Error('listening.url 必须是 http(s) 链接');
  return day;
}

async function updateIndex(day) {
  let text = '';
  if (await exists(INDEX_FILE)) text = await readFile(INDEX_FILE, 'utf8');

  const entries = [];
  const re = /\{\s*date:\s*"(\d{4}-\d{2}-\d{2})",\s*weekday:\s*"([^"]*)",\s*theme:\s*"([^"]*)",\s*modules:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(text))) entries.push({ date: m[1], weekday: m[2], theme: m[3], modules: Number(m[4]) });

  const item = { date: day.date, weekday: day.weekday || weekdayOf(day.date), theme: day.theme || '', modules: 5 };
  const i = entries.findIndex((x) => x.date === item.date);
  if (i >= 0) entries[i] = item; else entries.push(item);
  entries.sort((a, b) => a.date.localeCompare(b.date));

  const body = entries
    .map((x) => `  { date: "${x.date}", weekday: "${x.weekday}", theme: "${x.theme.replace(/"/g, '“')}", modules: ${x.modules} }`)
    .join(',\n');

  await writeFile(INDEX_FILE, `/* 日期索引：生成脚本会自动维护 */\nwindow.LEARN_INDEX = [\n${body}\n];\n`, 'utf8');
}

/* ------------------------------------------------------------------ */

async function main() {
  await mkdir(DAYS_DIR, { recursive: true });
  const topics = JSON.parse(await readFile(TOPICS_FILE, 'utf8'));

  const topicArg = argVal('topic');
  let topic;
  if (topicArg !== undefined) {
    const n = Number(topicArg);
    topic = Number.isFinite(n) ? topics[(n - 1 + topics.length) % topics.length] : topics.find((t) => t.theme.includes(String(topicArg)));
    if (!topic) throw new Error('找不到这个主题：' + topicArg);
  } else {
    // 按已经生成的天数轮转，保证同一个 30 天池不会重复
    const n = await countDays();
    topic = topics[n % topics.length];
  }

  if (!FORCE && (await exists(outFile))) {
    console.log(`✋ ${DATE} 已存在，跳过。要覆盖请加 --force`);
    return;
  }

  console.log(`▸ 日期 ${DATE}（${weekdayOf(DATE)}） 主题：${topic.theme}`);

  let day;
  if (MOCK || !KEY) {
    if (!MOCK) console.log('⚠ 没有 API_KEY，使用占位内容。设置 API_KEY 后重跑 --force 可生成真实内容。');
    day = stub(topic);
  } else {
    console.log(`▸ 调用 ${MODEL} @ ${BASE} …`);
    day = await callModel(buildPrompt(topic));
    validate(day);
    console.log('✓ 内容已生成并通过结构校验');
  }

  day.date = DATE;
  day.weekday = weekdayOf(DATE);

  const js = `/* ${DATE} · ${day.weekday} —— 由 scripts/generate.mjs 生成 */\nwindow.LEARN_DAY = ${JSON.stringify(day, null, 2)};\n`;
  await writeFile(outFile, js, 'utf8');
  await updateIndex(day);
  console.log(`✓ 已写入 data/days/${DATE}.js，索引已更新`);
}

async function countDays() {
  const { readdir } = await import('node:fs/promises');
  try {
    const files = await readdir(DAYS_DIR);
    return files.filter((f) => /^\d{4}-\d{2}-\d{2}\.js$/.test(f)).length;
  } catch { return 0; }
}

main().catch((e) => {
  console.error('✗ ' + e.message);
  process.exit(1);
});
