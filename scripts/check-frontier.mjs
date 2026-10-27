// 数据体检：只读校验 data/frontier.js 的形状与日期对应关系
// 用法：node scripts/check-frontier.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'data/frontier.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox, { filename: 'data/frontier.js' });

const F = sandbox.window.LEARN_FRONTIER || {};
const dates = Object.keys(F).sort();
const bad = [];
const isHttps = (u) => typeof u === 'string' && /^https:\/\/\S+$/.test(u);

if (!dates.length) bad.push('LEARN_FRONTIER 是空的');

dates.forEach((d) => {
  const e = F[d];
  const tag = (msg) => bad.push(`${d}: ${msg}`);

  if (!fs.existsSync(path.join(root, 'data/days', d + '.js'))) tag(`没有对应的 data/days/${d}.js`);
  if (!e.updated) tag('缺 updated');
  if (!e.lead) tag('缺 lead（今天整体一句话）');
  if (!e.note) tag('缺 note');
  if (!Array.isArray(e.keywords) || e.keywords.length < 2 || e.keywords.length > 5) tag('keywords 需 2–5 个');

  // 每条前沿必须有「一句记住」与「发布时间」——这两项是本板块的核心要求
  if (!Array.isArray(e.items) || e.items.length < 3) tag('items 少于 3 条');
  (e.items || []).forEach((it, i) => {
    ['title', 'source', 'publishedAt', 'takeaway', 'why', 'meta'].forEach((k) => {
      if (!it[k]) tag(`items[${i}] 缺 ${k}`);
    });
    if (!isHttps(it.url)) tag(`items[${i}] url 不是 https`);
  });

  // GitHub 可动手项目：可以有，也可以没有；有则字段必须齐全
  (e.repos || []).forEach((r, i) => {
    ['name', 'lang', 'what', 'tryThis'].forEach((k) => {
      if (!r[k]) tag(`repos[${i}] 缺 ${k}`);
    });
    if (!isHttps(r.url)) tag(`repos[${i}] url 不是 https`);
    if (!(Number(r.stars) > 0)) tag(`repos[${i}] stars 必须是正数（抓到的真实星数）`);
    if (!(Number(r.minutes) > 0)) tag(`repos[${i}] minutes 必须是正数`);
  });

  const t = e.task;
  if (!t || !t.title || !Array.isArray(t.steps) || t.steps.length < 3) tag('task 不完整（title + ≥3 步）');
  if (!t?.done) tag('task 缺 done（做完的标准，否则又变成"看完就等于学了"）');
  if (!t?.output) tag('task 缺 output');
  if (t?.url && !isHttps(t.url)) tag('task.url 不是 https');

  if (!e.concept?.term || !e.concept?.line) tag('concept 不完整');
});

console.log('期数:', dates.length, '→', dates.join(', '));
console.log('每条前沿:', dates.map((d) => `${d}:${(F[d].items || []).length}条`).join(' '));
console.log('GitHub 项目:', dates.map((d) => `${d}:${(F[d].repos || []).length}个`).join(' '));
console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS 前沿数据形状全部通过');
process.exit(bad.length ? 1 : 0);
