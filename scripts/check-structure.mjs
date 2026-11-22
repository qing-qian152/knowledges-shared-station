#!/usr/bin/env node
/**
 * 结构体检：这个仓库靠"多处清单手工对齐"运转，最容易腐坏的就是清单之间漂移。
 * 这个脚本把那些隐性约定变成显性断言，CI 里跑一次就知道有没有人漏改。
 *
 * 检查项
 *   1. 插图场景名：assets/art.js 的 SCENES ↔ scripts/daytool.py 的 ART 白名单
 *   2. 日期：data/days/*.js 文件 ↔ index.js 索引 ↔ sitemap.xml ↔ index.html 兜底链接
 *   3. 每个内容文件的 date 字段与文件名一致，weekday 与真实星期一致
 *   4. sw.js 的预缓存清单里每个路径真实存在
 *   5. index.html / manifest.json 引用的本地资源真实存在
 *   6. 文档与 workflow 里不再引用已删除的旧脚本
 *
 * 用法：node scripts/check-structure.mjs
 * 退出码：0 全部通过；1 有失败项
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const checks = [];
const ok = (name, cond, extra = '') => checks.push({ name, ok: !!cond, extra });

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* ---------- 1. 插图场景名 ---------- */

const art = read('assets/art.js');
const scenesBlock = (/const SCENES = \{([\s\S]*?)\n  \};/.exec(art) || [null, ''])[1];
const scenes = [...scenesBlock.matchAll(/^\s*'([a-z][a-z-]*)':\s*\{\s*label:/gm)].map((m) => m[1]);

const daytool = read('scripts/daytool.py');
const artBlock = (/^ART = \[([\s\S]*?)\]/m.exec(daytool) || [null, ''])[1];
const whitelist = [...artBlock.matchAll(/'([a-z][a-z-]*)'/g)].map((m) => m[1]);

ok('art.js 解析出场景', scenes.length > 0, `${scenes.length} 个`);
ok('daytool.py 解析出白名单', whitelist.length > 0, `${whitelist.length} 个`);

const notInArt = whitelist.filter((k) => !scenes.includes(k));
const notInWhite = scenes.filter((k) => !whitelist.includes(k));
ok('白名单里的场景 art.js 都有', !notInArt.length, notInArt.join(','));
// 反向不报错：art.js 可以有多余场景（别的站点复用），但要说出来免得以为是漏了
if (notInWhite.length) {
  console.log(`注意  art.js 有 ${notInWhite.length} 个场景不在白名单里（内容写不进去）：${notInWhite.join(', ')}`);
}

/* ---------- 2. 日期三方对齐 ---------- */

const dayFiles = fs.readdirSync(path.join(ROOT, 'data/days'))
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.js$/.test(f))
  .map((f) => f.replace(/\.js$/, ''))
  .sort();

const indexText = read('data/days/index.js');
const indexed = [...indexText.matchAll(/date:\s*"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort();

ok('有日期内容文件', dayFiles.length > 0, `${dayFiles.length} 天`);
ok('索引与文件一一对应', JSON.stringify(dayFiles) === JSON.stringify(indexed),
  `文件 ${dayFiles.length} · 索引 ${indexed.length}`);

const dupes = indexed.filter((d, i) => i && d === indexed[i - 1]);
ok('索引里没有重复日期', !dupes.length, dupes.join(','));

/* ---------- 3. 每个文件的 date / weekday 自洽 ---------- */

const badDate = [];
const badWeekday = [];
for (const d of dayFiles) {
  const src = read(`data/days/${d}.js`);
  // 内容文件是 JSON（键带引号），索引是手写 JS（键不带引号），两种都认
  const m = /^\s*"?date"?\s*:\s*"(\d{4}-\d{2}-\d{2})"/m.exec(src);
  if (!m || m[1] !== d) badDate.push(`${d} → ${m ? m[1] : '缺失'}`);
  const w = /^\s*"?weekday"?\s*:\s*"([^"]*)"/m.exec(src);
  const expect = WEEK[new Date(`${d}T00:00:00`).getDay()];
  if (w && w[1] !== expect) badWeekday.push(`${d} 写的是 ${w[1]}，应为 ${expect}`);
}
ok('文件名与内部 date 一致', !badDate.length, badDate.join('; '));
ok('weekday 与真实星期一致', !badWeekday.length, badWeekday.join('; '));

/* ---------- 4. sw.js 预缓存清单 ---------- */

const sw = read('sw.js');
const shellBlock = (/const SHELL = \[([\s\S]*?)\];/.exec(sw) || [null, ''])[1];
const shellPaths = [...shellBlock.matchAll(/'\.\/([^']*)'/g)]
  .map((m) => m[1])
  .filter((p) => p && p !== '');
const missingShell = shellPaths.filter((p) => !exists(p));
ok('sw.js 预缓存文件都存在', !missingShell.length, missingShell.join(','));
ok('sw.js 有 VERSION', /const VERSION = '[^']+'/.test(sw), (/'([^']+)'/.exec(sw) || [])[1] || '');

/* ---------- 5. index.html / manifest 引用的本地资源 ---------- */

const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="([^"#?]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:|data:|mailto:|\/\/)/.test(u))
  .filter((u) => !u.startsWith('?'));
const missingRefs = [...new Set(refs)].filter((p) => !exists(p));
ok('index.html 引用的本地资源都存在', !missingRefs.length, missingRefs.join(','));

const manifest = JSON.parse(read('manifest.json'));
const iconMissing = manifest.icons.map((i) => i.src).filter((p) => !exists(p));
ok('manifest 图标都存在', !iconMissing.length, iconMissing.join(','));
ok('manifest start_url 指向 index.html', manifest.start_url === './index.html', manifest.start_url);

/* ---------- 6. sitemap / 兜底链接与索引同步 ---------- */

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>/g)].length;
ok('sitemap URL 数 = 日期数 + 首页', locs === indexed.length + 1, `${locs} 个`);

const archiveBlock = (html.split('<!--ARCHIVE:START-->')[1] || '').split('<!--ARCHIVE:END-->')[0];
const archived = [...archiveBlock.matchAll(/\?d=(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]).sort();
ok('index.html 兜底链接与索引一致', JSON.stringify(archived) === JSON.stringify(indexed),
  `兜底 ${archived.length} · 索引 ${indexed.length}`);

/* ---------- 7. 文档里不再引用已删除的脚本 ---------- */

const docs = ['README.md', 'AGENTS.md', 'LICENSE'].filter(exists);
const stale = [];
for (const f of docs) {
  const t = read(f);
  if (/\bbuild-seo\.mjs\b/.test(t)) stale.push(`${f} 仍提到 build-seo.mjs`);
  if (/(^|[\s`(])serve\.mjs/.test(t)) stale.push(`${f} 仍提到已移动的 serve.mjs`);
}
ok('文档没有指向已删除/已移动的脚本', !stale.length, stale.join('; '));

/* ---------- 8. 已移除的「调 API 自动生成」链路不能复活 ---------- */

// 2026-11-22 删掉了 generate.mjs + topics.json + daily.yml + 相关 Secret。
// 这条断言是护栏：以后谁再把手动的接口生成加回来，CI 立刻红。
const TEXT_EXT = /\.(md|js|mjs|py|yml|yaml|html|css|json|txt)$/;
const SKIP_DIR = /^(\.git|parts|__pycache__|node_modules)$/;
const FORBID = [
  [/\bgenerate\.mjs\b/, 'generate.mjs'],
  [/\btopics\.json\b/, 'topics.json'],
  [/\bdaily\.yml\b/, 'daily.yml'],
  [/DEEPSEEK/i, 'DEEPSEEK'],
  [/\bAPI_KEY\b/, 'API_KEY'],
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP_DIR.test(e.name)) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (rel === 'assets/fonts') continue;
      walk(rel, out);
    } else if (TEXT_EXT.test(e.name)) {
      out.push(rel);
    }
  }
  return out;
}

const revived = [];
for (const rel of walk('')) {
  if (rel === 'scripts/check-structure.mjs') continue;   // 护栏自己当然写着这些名字
  const text = read(rel);
  for (const [re, label] of FORBID) {
    if (re.test(text)) revived.push(`${rel} 出现 ${label}`);
  }
}
ok('没有残留「调 API 自动生成」的痕迹', !revived.length,
  revived.slice(0, 5).join('; ') + (revived.length > 5 ? ` 等 ${revived.length} 处` : ''));

/* ---------- 输出 ---------- */

console.log('');
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.extra ? '  [' + c.extra + ']' : ''}`);
}
const failed = checks.filter((c) => !c.ok);
console.log(`\n内容 ${dayFiles.length} 天 · 插图场景 ${scenes.length} 个（白名单 ${whitelist.length} 个）`);
console.log(failed.length ? `✗ ${failed.length}/${checks.length} 项失败` : `✓ 全部 ${checks.length} 项通过`);
process.exit(failed.length ? 1 : 0);
