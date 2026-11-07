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
    "translation": ["段落1的中文翻译", "段落2的中文翻译", "段落3的中文翻译", "段落4的中文翻译", "段落5的中文翻译"],
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
    "title": "听力标题（自拟，如 清晨的咖啡馆 / A Lesson from a Broken Umbrella）",
    "level": "慢速美音",
    "words": 200,
    "topic": "一句话说明这段听的是什么（如 日常叙事 / 科普短文）",
    "lines": [
      { "en": "第一句英文。", "cn": "第一句的中文翻译。" },
      { "en": "第二句英文。", "cn": "第二句的中文翻译。" }
    ],
    "note": "一句话使用说明（怎么听、听几遍）"
  },
  "checklist": [
    { "text": "今天要做的一件事（一句话）", "tip": "怎么做的提示（可空字符串）" }
  ]
}

插图场景名只能从这个列表里选（按文章意境匹配，古诗文尤其要对得上意象）：
lotus-moon（荷塘月色）｜autumn-mountain（空山新雨）｜bamboo（竹林清影）｜snow-peak（雪岭）
｜snow-boat（江雪孤舟）｜spring-river（春江）｜rain-window（雨窗）｜dunes（大漠孤烟）
｜border（边塞烽烟）｜pastoral（田园）｜tower（登高）｜plum（寒梅）
｜autumn-river（秋江芦荻）｜pine-valley（松间清泉）｜lamp（灯下）｜paper（素纸）

硬性要求：
1. 引言：一句压得住当日主题的名言，中文 18-36 字、英文不超过 20 词。**优先用出处可考的经典原文**（《论语》《老子》《庄子》《孟子》《史记》唐诗宋词等），并写清 source（如「论语·子路」）；现代名言只在你确定作者与出处时才用。拿不准就换一句，**宁可用一句家喻户晓的，也不要编造或张冠李戴**；作者必须真实存在，source 没把握写空字符串。
2. 语文：必须是**一篇完整的原创散文**，1300-1700 字，7-9 段，不许只给节选或片段。author 字段一律写「本站原创」——你可以借鉴任何名家的笔法，但**不要把原创文字署上真实作者的名字**（例如写成徐志摩、朱自清的作品），那是伪造，绝对禁止。title 自拟，要像一篇真文章的标题。首段要抓人，中段要有画面、细节和一次情绪或认知的转折，结尾要收得住，不要鸡汤式升华。讲解 4-5 条，要具体到字词、节奏、标点，不要说空话。好词 6-8 个，好句 3-4 句，写作手法 4-5 种，仿写任务要能当天写完。
3. 古诗文：与今日主题呼应的整首（词要整阕），注释 4-6 条，译文一段，赏析 3-4 段（讲结构、讲字眼、讲情感转折），背诵提示给结构线索。
4. 英文：你必须原创，480-600 词，5-6 段，**雅思 6.5-7.5 水平**：要有抽象概念、解释性从句、让步与对比，避免四六级模板腔和口语化表达。**translation 必须与 body 段数完全一致、逐段对应**，是给读者对照阅读用的中文翻译（准确、通顺，不要写成摘要）。生词 12-15 个（含例句），**地道搭配 8-10 个**（collocations，如 "pose a threat to"、"a growing body of evidence"这种真正能背下来用的），短语 6-8 个，句式 4-5 个，语法点 3-4 个（都要从本篇原文里举例）。摘要 120-160 字中文。阅读题 5-6 道单选，answer 用 0 起始的下标，解析用中文说清错项为什么错。输出任务要求读者真正动笔。
5. 听力：**自己写一篇英文听力短文**，180-260 词，拆成 6-10 句（每句一行，长度适合朗读，不要太长）。体裁自选：日常叙事、小科普、一段对话、一则观察都可以，但必须完整、有开头结尾、内容自洽有趣，用标准美式英语书写（美式拼写与用词，如 color、apartment、gotten）。每句都要给对应的中文翻译（cn 与 en 一一对应，数量必须相等）。note 写一句怎么用（例如"先盲听两遍抓大意，再看译文"）。**不要给任何外部链接**。
6. 清单：5-6 项，覆盖四个板块（晨读、古诗文、英文、听力），每项一句话、动词开头（读完/背下/做完/听），tip 给一句方法提示，不要空话。
7. 全部内容使用中文全角标点；字符串内部需要引号时用中文引号“”或「」，不要用 ASCII 双引号。
8. JSON 必须能被 JSON.parse 直接解析。`;
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
      translation: ['占位译文。'],
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
      title: 'Placeholder listening',
      level: '慢速美音', words: 30, topic: '占位',
      lines: [
        { en: 'This is a placeholder line read by the browser voice.', cn: '这是浏览器朗读的占位句子。' },
        { en: 'Configure API_KEY to get a real passage.', cn: '配置 API_KEY 即可得到真正的短文。' },
      ],
      note: '占位。',
    },
    checklist: [{ text: '读完今天的晨读文章', tip: '出声读一遍' }],
  };
}

/* 模型偶尔会在 JSON 后面多写一段话，或者被 max_tokens 截断。
   这里做三件事：去围栏 → 直接 parse → 失败则按花括号配平截出第一个完整对象。 */
function extractJson(text) {
  let s = String(text || '').trim();
  s = s.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
  if (!s) throw new Error('模型返回为空');

  try { return JSON.parse(s); } catch { /* 继续尝试截取 */ }

  const start = s.indexOf('{');
  if (start === -1) throw new Error('模型返回里找不到 JSON 对象');

  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }

  if (end > start) {
    const slice = s.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch (e) {
      throw new Error(`截出的 JSON 仍不合法：${e.message}\n开头：${slice.slice(0, 100)}\n结尾：${slice.slice(-100)}`);
    }
  }
  throw new Error(`JSON 没有闭合（疑似被 max_tokens 截断）。已收到 ${s.length} 字符，结尾：${s.slice(-80)}`);
}

async function callModel(prompt) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: '你是严谨的中文编辑与英语教师，只输出一个合法的 JSON 对象，不要输出任何解释、注释或 Markdown 围栏。' },
        {
          role: 'user',
          content: attempt === 1
            ? prompt
            : `${prompt}\n\n【重要】上一次你的输出不是完整合法的 JSON。这次请只输出一个 JSON 对象，所有字符串用双引号，不要有尾随内容。`,
        },
      ],
      temperature: attempt === 1 ? 0.85 : 0.3,
      max_tokens: 8192,
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
    const choice = data?.choices?.[0];
    const raw = choice?.message?.content || '';
    if (choice?.finish_reason === 'length') {
      console.log('⚠ 输出被 max_tokens 截断（finish_reason=length），将重试');
      lastErr = new Error('输出被截断');
      continue;
    }
    try {
      return extractJson(raw);
    } catch (e) {
      lastErr = e;
      console.log(`⚠ 第 ${attempt} 次解析失败：${e.message.split('\n')[0]}`);
    }
  }
  throw new Error(`两次都没拿到合法 JSON：${lastErr?.message}`);
}

function validate(day) {
  const need = ['chinese', 'poem', 'english', 'listening'];
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
  if (!Array.isArray(l.lines) || !l.lines.length) throw new Error('listening.lines 缺失（需要自创听力的逐句文本）');
  l.lines.forEach((ln, i) => {
    if (!ln || !String(ln.en || '').trim()) throw new Error(`listening.lines[${i}] 缺少英文 en`);
    if (!String(ln.cn || '').trim()) ln.cn = '';
  });

  // 译文段数对不上就补齐/截断，页面按段对齐，缺一段会错位
  const e2 = day.english;
  if (!Array.isArray(e2.translation)) e2.translation = [];
  if (e2.translation.length !== (e2.body || []).length) {
    console.warn(`⚠ english.translation 有 ${e2.translation.length} 段，正文有 ${(e2.body || []).length} 段，已按正文对齐`);
    e2.translation = (e2.body || []).map((_, i) => e2.translation[i] || '');
  }

  // 插图只认内置场景，写错了退成素纸，不要让页面报错
  const ART = new Set(['lotus-moon', 'autumn-mountain', 'bamboo', 'snow-peak', 'snow-boat',
    'spring-river', 'rain-window', 'dunes', 'border', 'pastoral', 'tower', 'plum',
    'autumn-river', 'pine-valley', 'lamp', 'paper']);
  for (const k of ['chinese', 'poem']) {
    const sec = day[k];
    if (sec.image && !ART.has(sec.image)) {
      console.warn(`⚠ ${k}.image「${sec.image}」不在内置场景里，改用 paper`);
      sec.image = 'paper';
    }
  }

  // 语文：篇幅与署名自检。模型偶尔会把原创文字署上名家名字，或者只给一小段，
  // 这两种都会让读者觉得"没读尽兴 / 被糊弄"，这里至少要留下痕迹。
  const cn = day.chinese || {};
  const cnChars = (Array.isArray(cn.body) ? cn.body : []).reduce((n, x) => n + String(x || '').length, 0);
  if (cnChars < 900) {
    console.warn(`⚠ 语文正文只有约 ${cnChars} 字，偏短（期望 1300-1700 字）`);
  }
  const famous = ['朱自清', '鲁迅', '郁达夫', '老舍', '傅雷', '胡适', '徐志摩', '梁实秋', '周作人', '冰心', '沈从文', '汪曾祺', '丰子恺', '林语堂', '钱钟书', '张爱玲'];
  if (famous.includes(String(cn.author || '').trim())) {
    console.warn(`⚠ 语文署名为「${cn.author}」：请确认是公版原文逐字复制，否则应改为「本站原创」（原创署名名家属于伪造）`);
  }

  if (!day.quote || !String(day.quote.text || '').trim()) {
    console.warn('⚠ 缺少 quote，页面顶部的每日一句会空着');
  }
  // 清单里常写「做完英文五道单选题」，但实际出了 6 道——按真实题数改掉，
  // 不然读者照清单做会以为漏了一题。
  const nQ = (day.english.questions || []).length;
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const fixCount = (txt) => String(txt).replace(/([一二三四五六七八九十]+)道(单选)?题/g, (m0, num, single) => {
    const v = CN.indexOf(num);
    return v > 0 && v !== nQ ? `${CN[nQ] || nQ}道${single || ''}题` : m0;
  });
  if (Array.isArray(day.checklist)) {
    day.checklist = day.checklist.map((it) => {
      if (typeof it === 'string') return fixCount(it);
      if (it && it.text) return { ...it, text: fixCount(it.text) };
      return it;
    });
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

  const item = { date: day.date, weekday: day.weekday || weekdayOf(day.date), theme: day.theme || '', modules: 4 };
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
    // 编号 = 目标日期之前已有的天数（不含自己），这样 --force 重跑同一天不会把编号顶掉
    const n0 = await countDaysBefore(DATE);
    const used = await recentFingerprints(DATE);
    topic = topics[n0 % topics.length];
    for (let i = 0; i < topics.length; i++) {
      const cand = topics[(n0 + i) % topics.length];
      if (!used.has(fingerprint(cand))) { topic = cand; break; }
    }
    if (used.has(fingerprint(topic))) {
      console.log('⚠ 30 个主题都和最近几天撞了，仍用轮转结果');
    }
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

async function dayFiles() {
  const { readdir } = await import('node:fs/promises');
  try {
    return (await readdir(DAYS_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.js$/.test(f)).sort();
  } catch { return []; }
}

/** 目标日期之前已有的天数（不含目标自己），用于算主题编号 */
async function countDaysBefore(date) {
  return (await dayFiles()).filter((f) => f.slice(0, 10) < date).length;
}

const poemTitleOf = (s) => {
  const m = /《([^》]+)》/.exec(s || '');
  return m ? m[1].trim() : '';
};
/** 一个主题的内容指纹：只看古文篇名（AI 板块已下线，不再参与判重） */
function fingerprint(t) {
  return poemTitleOf(t.poem);
}

/** 读目标日期前最近几天已生成的内容，收集它们的内容指纹 */
async function recentFingerprints(date, howMany = 4) {
  const recent = (await dayFiles()).filter((f) => f.slice(0, 10) < date).slice(-howMany);
  const used = new Set();
  for (const f of recent) {
    try {
      const txt = await readFile(path.join(DAYS_DIR, f), 'utf8');
      const poem = /"poem"\s*:\s*\{[\s\S]{0,400}?"title"\s*:\s*"([^"]*)"/.exec(txt)
        || /poem\s*:\s*\{[\s\S]{0,400}?title\s*:\s*"([^"]*)"/.exec(txt);
      used.add(poemTitleOf(poem ? poem[1] : ''));
    } catch { /* 读不到就跳过 */ }
  }
  return used;
}

main().catch((e) => {
  console.error('✗ ' + e.message);
  process.exit(1);
});
