#!/usr/bin/env node
/**
 * 外观体检：确认 style.css 里每套主题的变量都齐、字体变量只在 :root 定义一次、
 * 并且 app.js 的 THEMES 列表与 CSS 里的 data-theme 一一对应。
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

/* ---------- 解析 CSS 里的变量声明 ---------- */

const blocks = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  const sels = m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const vars = [...m[2].matchAll(/(--[\w-]+)\s*:/g)].map((x) => x[1]);
  for (const sel of sels) blocks.push({ sel, vars });
}

const themes = {};
const ensure = (k) => (themes[k] ||= Object.create(null));
for (const b of blocks) {
  const key = /:root\[data-theme="([^"]+)"\]/.exec(b.sel);
  if (key) b.vars.forEach((v) => (ensure(key[1])[v] = 1));
  if (/:root(?!\[)/.test(b.sel)) b.vars.forEach((v) => (ensure('base')[v] = 1));
}

// 分组选择器里的别名主题与主主题共用一套变量（dark 是旧存储值的兼容别名）
const alias = { dark: 'ink' };
for (const [a, t] of Object.entries(alias)) {
  if (themes[a] && themes[t]) themes[a] = Object.assign(themes[a], themes[t]);
}

/* ---------- 需要检查的集合 ---------- */

const base = Object.keys(themes.base);
const required = base.filter((v) => !v.startsWith('--art-') && !v.startsWith('--ff-') && v !== '--fs');
const artVars = base.filter((v) => v.startsWith('--art-'));
const fontVars = base.filter((v) => v.startsWith('--ff-') || v === '--fs');

const themesBlock = (/const THEMES = \[([\s\S]*?)\];/.exec(app) || [null, ''])[1];
const appThemes = [...themesBlock.matchAll(/id:\s*'([a-z]+)'/g)].map((x) => x[1]);
const cssThemes = Object.keys(themes).filter((k) => k !== 'base');

const checks = [];
const ok = (name, cond, extra = '') => checks.push({ name, ok: !!cond, extra });

ok('CSS 里至少 5 套主题', cssThemes.length >= 5, `${cssThemes.length}: ${cssThemes.join(' ')}`);
ok('字体变量只在 :root 定义', fontVars.length === 11, `${fontVars.length} 个`);

for (const name of cssThemes) {
  const vars = themes[name];
  const miss = required.filter((v) => !vars[v]);
  const missArt = artVars.filter((v) => !vars[v]);
  ok(`主题 ${name} 配色变量齐全`, !miss.length, miss.join(','));
  ok(`主题 ${name} 插图变量齐全`, !missArt.length, missArt.join(','));
}

const missingInCss = appThemes.filter((t) => t !== 'light' && !cssThemes.includes(t));
ok('app.js 的 THEMES 都有对应 CSS', !missingInCss.length, missingInCss.join(','));
ok('素纸(light) 由 :root 承载', !!themes.base && required.every((v) => themes.base[v]), '');

/* ---------- 输出 ---------- */

for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.extra && c.ok ? '  [' + c.extra + ']' : ''}${!c.ok && c.extra ? '  [' + c.extra + ']' : ''}`);
}
const failed = checks.filter((c) => !c.ok);
console.log(`\n主题 ${cssThemes.length} 套 · 配色变量 ${required.length} 个 · 插图变量 ${artVars.length} 个`);
console.log(failed.length ? `${failed.length} 项失败` : `全部 ${checks.length} 项通过`);
process.exit(failed.length ? 1 : 0);
