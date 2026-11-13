#!/usr/bin/env node
/* 每日一学 —— SEO 构建脚本
 *
 * 做三件事，全部只依赖本地文件、不需要网络：
 *   1. 从 data/days/index.js 生成 sitemap.xml
 *   2. 生成 robots.txt
 *   3. 把往期链接填进 index.html 的 <noscript> 兜底区（标记之间）
 *
 * 为什么需要它：站点是纯前端渲染，服务端 HTML 里没有任何正文，
 * 而历史日期只靠 <select> 切换、页面里没有指向别天的链接。
 * 补一份 sitemap + 一份静态链接，搜索引擎才能真正收录每一天。
 *
 * 用法：node scripts/build-seo.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_FILE = path.join(ROOT, 'data', 'days', 'index.js');
const HTML_FILE = path.join(ROOT, 'index.html');
const SITE = 'https://qing-qian152.github.io/knowledges-shared-station';

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

async function readEntries() {
  const text = await readFile(INDEX_FILE, 'utf8');
  const re = /\{\s*date:\s*"(\d{4}-\d{2}-\d{2})",\s*weekday:\s*"([^"]*)",\s*theme:\s*"([^"]*)",\s*modules:\s*(\d+)\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push({ date: m[1], weekday: m[2], theme: m[3], modules: Number(m[4]) });
  out.sort((a, b) => b.date.localeCompare(a.date));   // 新的在前
  return out;
}

function buildSitemap(entries) {
  const urls = entries.map((e) => {
    const url = `${SITE}/?d=${e.date}`;
    return [
      '  <url>',
      `    <loc>${esc(url)}</loc>`,
      `    <lastmod>${e.date}</lastmod>`,
      '    <changefreq>monthly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${SITE}/</loc>`,
    `    <lastmod>${entries[0]?.date || ''}</lastmod>`,
    '    <changefreq>daily</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function buildRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n');
}

function buildArchiveBlock(entries) {
  // 按月份分组，渲染成静态 <ul>，不依赖任何脚本
  const groups = new Map();
  entries.forEach((e) => {
    const k = e.date.slice(0, 7);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  });

  const parts = [];
  [...groups.keys()].forEach((key) => {
    const [y, m] = key.split('-').map(Number);
    const list = groups.get(key);
    parts.push(`<h3>${y} 年 ${m} 月 · ${list.length} 天</h3>`);
    parts.push('<ul>');
    list.forEach((e) => {
      const d = Number(e.date.slice(8, 10));
      const wd = e.weekday || WEEK[new Date(e.date + 'T00:00:00').getDay()];
      parts.push(
        `<li><a href="?d=${e.date}">${m}/${d} ${esc(wd)}${e.theme ? ' · ' + esc(e.theme) : ''}</a></li>`
      );
    });
    parts.push('</ul>');
  });
  return parts.join('\n');
}

async function updateHtml(entries) {
  const html = await readFile(HTML_FILE, 'utf8');
  const START = '<!--ARCHIVE:START-->';
  const END = '<!--ARCHIVE:END-->';
  const i = html.indexOf(START);
  const j = html.indexOf(END);
  if (i < 0 || j < 0) {
    console.warn('! index.html 里找不到归档标记，跳过 HTML 注入');
    return;
  }
  const next = html.slice(0, i + START.length) + '\n' + buildArchiveBlock(entries) + '\n' + html.slice(j);
  await writeFile(HTML_FILE, next, 'utf8');
}

async function main() {
  const entries = await readEntries();
  if (!entries.length) {
    console.error('没有读到任何日期条目，请检查 data/days/index.js');
    process.exit(1);
  }

  await writeFile(path.join(ROOT, 'sitemap.xml'), buildSitemap(entries), 'utf8');
  await writeFile(path.join(ROOT, 'robots.txt'), buildRobots(), 'utf8');
  await updateHtml(entries);

  console.log(`✓ sitemap.xml   ${entries.length + 1} 个 URL`);
  console.log(`✓ robots.txt    Sitemap 指向已写入`);
  console.log(`✓ index.html    往期兜底链接 ${entries.length} 条`);
  console.log(`  最新 ${entries[0].date} · 最早 ${entries[entries.length - 1].date}`);
}

main().catch((e) => {
  console.error('构建失败：', e.message);
  process.exit(1);
});
