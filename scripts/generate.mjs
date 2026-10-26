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
  "quote": {
    "text": "一句名言原文（中文或英文，英文不用翻译）",
    "author": "真实作者名",
    "source": "出处（没有就写空字符串）"
  },
  "chinese": {
    "title": "篇名",
    "author": "作者",
    "tag": "体裁 · 主题，如 现代散文 · 写景",
    "readingTime": "约 N 分钟",
    "image": "插图场景名",
    "imageCaption": "配图说明，一句话，10-18 字",
    "body": ["第1段", "第2段", "第3段"],
    "explain": [{ "line": "原句", "note": "讲解，可用 <b></b> 标重点" }],
    "words": [{ "w": "词", "meaning": "释义", "use": "用法点拨" }],
    "expressions": [{ "s": "好句", "why": "妙在哪里" }],
    "techniques": [{ "name": "手法名", "desc": "解释", "example": "文中例句" }],
    "imitation": { "prompt": "仿写任务", "steps": ["步骤1", "步骤2", "步骤3"] }
  },
  "poem": {
    "title": "诗题", "author": "作者", "dynasty": "朝代", "tag": "体裁",
    "image": "插图场景名",
    "imageCaption": "配图说明，一句话",
    "body": ["诗句1，", "诗句2。"],
    "notes": [{ "line": "词", "note": "注释" }],
    "translation": "白话译文，一段",
    "appreciation": ["赏析段落1", "赏析段落2", "赏析段落3"],
    "recite": "背诵提示"
  },
  "english": {
    "title": "英文标题",
    "level": "IELTS 7.0",
    "words": 520,
    "body": ["段落1", "段落2", "段落3", "段落4", "段落5"],
    "vocab": [{ "w": "单词", "pos": "n.", "cn": "中文释义", "ex": "英文例句" }],
    "collocations": [{ "phrase": "地道搭配", "cn": "中文意思", "ex": "英文例句" }],
    "phrases": [{ "p": "短语", "cn": "中文", "ex": "英文例句" }],
    "patterns": [{ "s": "原文句式", "cn": "中文意思", "note": "用法说明" }],
    "grammar": [{ "point": "语法点", "explain": "讲解", "example": "原文例句" }],
    "summary": "中文摘要，120-160 字",
    "questions": [{ "q": "题干（英文）", "options": ["选项A文字", "选项B文字", "选项C文字", "选项D文字"], "answer": 0, "explain": "中文解析" }],
    "output": { "prompt": "输出任务", "tasks": ["要求1", "要求2", "要求3"] }
  },
  "listening": {
    "title": "听力标题（如 中国日报英语点津 · 今日音频）",
    "level": "难度标签，如 慢速英语 / 雅思 6.5",
    "source": "来源站点名，如 中国日报英语点津",
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
  },
  "checklist": [
    { "text": "今天要做的一件事（一句话）", "tip": "怎么做的提示（可空字符串）" }
  ]
}

插图场景名只能从这个列表里选（按意境匹配，不要硬凑）：
lotus-moon（荷塘月色）｜autumn-mountain（山间秋意）｜bamboo（竹林清影）｜snow-peak（雪岭）
｜spring-river（春江）｜rain-window（雨窗）｜dunes（大漠孤烟）｜lamp（灯下）｜paper（素纸）

硬性要求：
1. 引言：一句压得住当日主题的名言，中外皆可，中文 18-36 字、英文不超过 20 词；作者必须真实存在，宁可选常见名句也不要编造；找不到可靠出处的 author 就换一句。source 没有把握就写空字符串。
2. 语文：必须是**一篇完整的文章**，1200-2000 字，5-9 段，不许只给节选或片段。选公版名篇（1949 年前已故作者，如朱自清、鲁迅、郁达夫、老舍、傅雷、胡适、徐志摩、梁实秋、周作人、归有光、范仲淹、苏轼等）就给全文；否则自己写一篇完整的原创散文。首段要抓人，中段要有细节和转折，结尾要收得住。讲解 4-5 条，要具体到字词、节奏、标点，不要说空话。好词 6-8 个，好句 3-4 句，写作手法 4-5 种，仿写任务要能当天写完。
3. 古诗文：与今日主题呼应的整首（词要整阕），注释 4-6 条，译文一段，赏析 3-4 段（讲结构、讲字眼、讲情感转折），背诵提示给结构线索。
4. 英文：你必须原创，480-600 词，5-6 段，**雅思 6.5-7.5 水平**：要有抽象概念、解释性从句、让步与对比，避免四六级模板腔和口语化表达。生词 12-15 个（含例句），**地道搭配 8-10 个**（collocations，如 "pose a threat to"、"a growing body of evidence"这种真正能背下来用的），短语 6-8 个，句式 4-5 个，语法点 3-4 个（都要从本篇原文里举例）。摘要 120-160 字中文。阅读题 5-6 道单选，answer 用 0 起始的下标，解析用中文说清错项为什么错。输出任务要求读者真正动笔。
5. 听力：**必须给中国大陆能直接打开的链接**，优先「中国日报英语点津 language.chinadaily.com.cn」「CGTN」「21世纪英文报 i21st.cn」这类国内站点；不要给 VOA、BBC、YouTube、Spotify（国内常打不开）。url 必须是 http(s) 开头；note 说明在这个页面上怎么找到当天音频、怎么配合精听。
6. AI：每天一个概念，从基础往上走（Agent、Token、上下文窗口、幻觉、RAG、微调、Skill、MCP、评测……）。explain 三段要有递进，example 要具体到"你说什么、它做什么"。quiz 四个选项，answer 为下标。
7. 清单：5-6 项，覆盖五个板块，每项一句话、动词开头（读完/背下/做完/听/讲），tip 给一句方法提示，不要空话。
8. 全部内容使用中文全角标点；字符串内部需要引号时用中文引号“”或「」，不要用 ASCII 双引号。
9. JSON 必须能被 JSON.parse 直接解析。`;
}

function stub(topic) {
  return {
    theme: topic.theme,
    quote: { text: '（占位）真正的引言会在配置 API_KEY 后出现在这里。', author: '待生成', source: '' },
    chinese: {
      title: '（占位）' + topic.chinese,
      author: '待生成',
      tag: '占位内容',
      readingTime: '—',
      image: 'paper',
      imageCaption: '占位插图',
      body: ['这是占位内容。运行 `node scripts/generate.mjs --force` 并配置 API_KEY 后，这里会变成当天真正的文章。'],
      explain: [{ line: '占位', note: '配置好 API Key 后重新生成即可。' }],
      words: [{ w: '占位', meaning: '—', use: '—' }],
      expressions: [{ s: '—', why: '—' }],
      techniques: [{ name: '—', desc: '—', example: '—' }],
      imitation: { prompt: '—', steps: ['—'] },
    },
    poem: {
      title: '（占位）' + topic.poem, author: '—', dynasty: '—', tag: '—',
      image: 'paper', imageCaption: '占位插图',
      body: ['占位'], notes: [{ line: '—', note: '—' }], translation: '—',
      appreciation: ['—'], recite: '—',
    },
    english: {
      title: 'Placeholder: ' + topic.english, level: 'IELTS 7.0', words: 0,
      body: ['Placeholder content. Configure API_KEY and re-run the generator.'],
      vocab: [{ w: 'placeholder', pos: 'n.', cn: '占位', ex: 'This is a placeholder.' }],
      collocations: [{ phrase: 'placeholder', cn: '占位', ex: 'This is a placeholder.' }],
      phrases: [{ p: '—', cn: '—', ex: '—' }],
      patterns: [{ s: '—', cn: '—', note: '—' }],
      grammar: [{ point: '—', explain: '—', example: '—' }],
      summary: '占位摘要。',
      questions: [{ q: 'Placeholder question?', options: ['A', 'B', 'C', 'D'], answer: 0, explain: '占位解析。' }],
      output: { prompt: '—', tasks: ['—'] },
    },
    listening: {
      title: '（占位）' + topic.listening, level: '—', source: '中国日报英语点津',
      url: 'https://language.chinadaily.com.cn/', note: '占位。',
    },
    ai: {
      term: '（占位）' + topic.ai, oneLiner: '占位。',
      explain: ['占位。', '占位。', '占位。'], analogy: '—', example: '—', takeaway: '—',
      quiz: { q: '占位？', options: ['A', 'B', 'C', 'D'], answer: 0, explain: '占位。' },
      next: '—',
    },
    checklist: [{ text: '读完今天的晨读文章', tip: '出声读一遍' }],
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

  // 插图只认内置场景，写错了退成素纸，不要让页面报错
  const ART = new Set(['lotus-moon', 'autumn-mountain', 'bamboo', 'snow-peak',
    'spring-river', 'rain-window', 'dunes', 'lamp', 'paper']);
  for (const k of ['chinese', 'poem']) {
    const sec = day[k];
    if (sec.image && !ART.has(sec.image)) {
      console.warn(`⚠ ${k}.image「${sec.image}」不在内置场景里，改用 paper`);
      sec.image = 'paper';
    }
  }

  if (!day.quote || !String(day.quote.text || '').trim()) {
    console.warn('⚠ 缺少 quote，页面顶部的每日一句会空着');
  }
  if (!Array.isArray(day.checklist) || !day.checklist.length) {
    console.warn('⚠ 缺少 checklist，页面会用默认的五项清单');
  }

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
