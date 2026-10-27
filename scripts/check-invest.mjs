// 数据体检：只读校验 data/invest.js 的形状，并核对「现价 / 涨跌幅 / 走势末点」三者一致
// 用法：node scripts/check-invest.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'data/invest.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox, { filename: 'data/invest.js' });

const I = sandbox.window.LEARN_INVEST || {};
const dates = Object.keys(I).sort();
const bad = [];
const isHttps = (u) => typeof u === 'string' && /^https:\/\/\S+$/.test(u);
const near = (a, b, eps) => Math.abs(a - b) <= eps;

if (!dates.length) bad.push('LEARN_INVEST 是空的');

dates.forEach((d) => {
  const e = I[d];
  const tag = (msg) => bad.push(`${d}: ${msg}`);

  if (!fs.existsSync(path.join(root, 'data/days', d + '.js'))) tag(`没有对应的 data/days/${d}.js`);
  if (!e.updated) tag('缺 updated');
  if (!e.asof) tag('缺 asof（数据截至何时）');
  if (!e.brief) tag('缺 brief（今天一眼）');
  if (!e.disclaimer) tag('缺 disclaimer（免责声明，投资内容必须写）');

  const k = e.knowledge;
  if (!k || !k.term || !k.plain || !k.example || !k.pitfall) tag('knowledge 不完整（term/plain/example/pitfall）');
  if (k?.quiz) {
    const q = k.quiz;
    if (!q.q || !Array.isArray(q.options) || q.options.length < 3) tag('knowledge.quiz 题面或选项不完整');
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options || []).length)) tag('knowledge.quiz.answer 越界');
    if (!q.explain) tag('knowledge.quiz 缺 explain');
  }

  // 指数：series 末点必须等于 last，且 pct 与「末点 / 前一点」算出来的一致
  const idx = e.indices || [];
  if (!idx.length) tag('indices 为空');
  idx.forEach((x, i) => {
    const name = `indices[${i}](${x.name || '?'})`;
    ['name', 'last', 'chg', 'pct', 'asof', 'source'].forEach((f) => {
      if (x[f] == null || x[f] === '') tag(`${name} 缺 ${f}`);
    });
    if (!isHttps(x.url)) tag(`${name} url 不是 https`);
    if (!Array.isArray(x.series) || x.series.length < 1) { tag(`${name} series 为空`); return; }
    x.series.forEach((p, j) => {
      if (!Array.isArray(p) || p.length !== 2 || !/^\d{4}-\d{2}-\d{2}$/.test(String(p[0])) || !isFinite(Number(p[1]))) {
        tag(`${name} series[${j}] 应为 ["YYYY-MM-DD", 数字]`);
      }
    });
    const lastPt = x.series[x.series.length - 1];
    if (lastPt && !near(Number(lastPt[1]), Number(x.last), 0.011)) {
      tag(`${name} last=${x.last} 与 series 末点 ${lastPt[1]} 不一致`);
    }
    if (x.series.length >= 2) {
      const prev = Number(x.series[x.series.length - 2][1]);
      const now = Number(x.series[x.series.length - 1][1]);
      const pct = ((now - prev) / prev) * 100;
      if (isFinite(pct) && !near(pct, Number(x.pct), 0.02)) {
        tag(`${name} pct=${x.pct}% 与末两点算出 ${pct.toFixed(3)}% 不一致`);
      }
      const chg = now - prev;
      if (isFinite(chg) && !near(chg, Number(x.chg), 0.02)) {
        tag(`${name} chg=${x.chg} 与末两点算出 ${chg.toFixed(3)} 不一致`);
      }
    }
  });

  // 消息：必须有来源、发布时间、原文链接
  const news = e.news || [];
  if (!news.length) tag('news 为空');
  news.forEach((n, i) => {
    ['time', 'title', 'source', 'gist'].forEach((f) => {
      if (!n[f]) tag(`news[${i}] 缺 ${f}`);
    });
    if (!isHttps(n.url)) tag(`news[${i}] url 不是 https`);
    if (n.time && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(n.time)) tag(`news[${i}] time 应为 "YYYY-MM-DD HH:mm"`);
  });
});

console.log('期数:', dates.length, '→', dates.join(', '));
console.log('每期:', dates.map((d) => `${d}: ${(I[d].indices || []).length} 个指数 / ${(I[d].news || []).length} 条消息`).join(' · '));
console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS 投资数据形状与数字自洽全部通过');
process.exit(bad.length ? 1 : 0);
