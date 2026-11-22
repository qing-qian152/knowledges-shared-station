#!/usr/bin/env node
/* 本地静态预览服务器（只为了在浏览器里跑一遍真站点，不参与发布）
 *
 * 用法：node scripts/dev-server.mjs [端口]
 * 默认 http://127.0.0.1:8123
 *
 * 直接双击 index.html 也能用（file:// 下没有 Service Worker，只有这一处差别），
 * 这个服务器存在的意义是验证 PWA 安装、离线缓存和 ?d= 深链。
 *
 * 根目录按「本文件所在目录的上一级」定位，所以在任意工作目录下执行都可以。
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8123;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${ROOT} → http://127.0.0.1:${PORT}/`);
});
