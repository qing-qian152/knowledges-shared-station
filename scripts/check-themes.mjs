#!/usr/bin/env node
/**
 * 外观体检：确认 style.css 里每套主题的配色变量都齐、字体/字号变量只在 :root 定义一次、
 * 并且 app.js 的 THEMES 列表与 CSS 里的 data-theme 一一对应。
 *
 * 判定规则不写死数字，而是按「变量的值长什么样」分类：
 *   值是颜色（#hex / rgb() / hsl() …）→ 配色变量，每套主题都必须重定义
 *   值是别的（字体栈、px、box-shadow）→ 结构变量，只该在 :root 出现一次
 * 这样以后加一套主题或加一款字体，不用回来改这个脚本。
 *
 * 用法：node scripts/check-themes.mjs
 * 退出码：0 全部通过；1 有问题
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'assets/style.css'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8');

/* ---------- 解析 CSS：选择器 → 变量名 → 值 ---------- */

const blocks = [];
const blockRe = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = blockRe.exec(css))) {
  const sels = m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const decls = [...m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]);
  for (const sel of sels) blocks.push({ sel, decls });
}

const themes = {};                                  // { 主题名: { 变量名: 值 } }
const bucket = (k) => (themes[k] ||= Object.create(null));

for (const b of blocks) {
  if (!/:root/.test(b.sel)) continue;
  const named = /:root\[data-theme="([^"]+)"\]/.exec(b.sel);
  const target = named ? named[1] : (/:root(?!\[)/.test(b.sel) ? 'base' : null);
  if (!target) continue;
  for (const [name, value] of b.decls) bucket(target)[name] = value;
}

// 分组选择器里的别名主题与主主题共用一套变量（dark 是旧存储值的兼容别名）
const alias = { dark: 'ink' };
for (const [a, t] of Object.entries(alias)) {
  if (themes[a] && themes[t]) themes[a] = Object.assign(themes[a], themes[t]);
}

/* ---------- 按值的形态给变量分类 ---------- */

const isColor = (v) => /^#[0-9a-fA-F]{3,8}$/.test(v) || /^(rgb|hsl|oklch|color-mix|color)\(/.test(v);
const isFontish = (k) => k.startsWith('--ff-') || k === '--fs';
const isArt = (k) => k.startsWith('--art-');

const base = themes.base || {};
const colorVars = Object.keys(base).filter((k) => isColor(base[k]) && !isArt(k));
const fontVars = Object.keys(base).filter(isFontish);
const structVars = Object.keys(base).filter((k) => !isColor(base[k]) && !isFontish(k) && !isArt(k));
const artVars = Object.keys(base).filter(isArt);

const themesBlock = (/const THEMES = \[([\s\S]*?)\];/.exec(app) || [null, ''])[1];
const appThemes = [...themesBlock.matchAll(/id:\s*'([a-z]+)'/g)].map((x) => x[1]);
const cssThemes = Object.keys(themes).filter((k) => k !== 'base');

/* ---------- 断言 ---------- */

const checks = [];
const ok = (name, cond, extra = '') => checks.push({ name, ok: !!cond, extra });

ok('CSS 里至少 5 套主题', cssThemes.length >= 5, `${cssThemes.length}: ${cssThemes.join(' ')}`);
ok(':root 里能识别出配色变量', colorVars.length >= 10, `${colorVars.length} 个`);

// 字体/字号属于结构变量：只该在 :root 出现，散到主题块里就会让"换主题"顺手改掉字体
const fontLeak = [];
for (const name of cssThemes) {
  for (const k of Object.keys(themes[name])) if (isFontish(k)) fontLeak.push(`${name}:${k}`);
}
ok('字体/字号变量只在 :root 定义', !fontLeak.length,
  fontLeak.length ? fontLeak.join(',') : `${fontVars.length} 个字体/字号变量`);

for (const name of cssThemes) {
  const vars = themes[name];
  const missColor = colorVars.filter((v) => !vars[v]);
  const missArt = artVars.filter((v) => !vars[v]);
  ok(`主题 ${name} 配色变量齐全`, !missColor.length, missColor.join(','));
  ok(`主题 ${name} 插图变量齐全`, !missArt.length, missArt.join(','));
}

const missingInCss = appThemes.filter((t) => t !== 'light' && !cssThemes.includes(t));
ok('app.js 的 THEMES 都有对应 CSS', !missingInCss.length, missingInCss.join(','));
ok('素纸(light) 由 :root 承载', !!themes.base && colorVars.every((v) => themes.base[v]), '');

/* ---------- 输出 ---------- */

for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.extra ? '  [' + c.extra + ']' : ''}`);
}
console.log(`\n主题 ${cssThemes.length} 套 · 配色变量 ${colorVars.length} 个 · 插图变量 ${artVars.length} 个`
  + ` · 字体/字号 ${fontVars.length} 个 · 其它结构变量 ${structVars.length} 个`);
const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `✗ ${failed.length} 项失败` : `✓ 全部 ${checks.length} 项通过`);
process.exit(failed.length ? 1 : 0);
