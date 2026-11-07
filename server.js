/* =========================================================
   SHELL—727 留言后端（零依赖，Node 自带模块即可运行）
   ---------------------------------------------------------
   功能：
   1. 托管本目录的前端文件（index.html / styles.css / app.js / assets）
   2. POST /api/message      接收留言（昵称 ≤12 字，正文 ≤80 字，同 IP 每 60 秒最多 3 条）
   3. GET  /api/messages?key=密钥   查看全部留言（仅你自己，密钥用环境变量 ADMIN_KEY 设置）
   4. GET  /api/health       探活
   ---------------------------------------------------------
   运行：  node server.js
   常驻：  见《后端部署说明.md》的 systemd 段
   环境变量：PORT（默认 8787）、ADMIN_KEY（务必改成自己的）
   ========================================================= */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8787;
const ADMIN_KEY = process.env.ADMIN_KEY || 'CHANGE_ME';
const DATA_FILE = path.join(__dirname, 'messages.json');
const MAX_KEEP = 500;                       // 最多留存 500 条，超出丢最旧
const RATE_WINDOW = 60 * 1000;              // 限速窗口
const RATE_MAX = 3;                         // 窗口内同 IP 最多几条

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function readMessages() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeMessages(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list.slice(-MAX_KEEP), null, 2));
}

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {}));
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function serveStatic(res, pathname) {
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(__dirname, safe === '/' || safe === '\\' ? 'index.html' : safe);
  if (!file.startsWith(__dirname)) { send(res, 403, { ok: false }); return; }
  fs.readFile(file, (err, data) => {
    if (err) { send(res, 404, { ok: false, error: 'not found' }); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const rate = new Map();                     // ip -> [timestamps]

const server = http.createServer((req, res) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  /* ---- 留言接口 ---- */
  if (req.method === 'POST' && url.pathname === '/api/message') {
    const now = Date.now();
    const arr = (rate.get(ip) || []).filter(t => now - t < RATE_WINDOW);
    if (arr.length >= RATE_MAX) return send(res, 429, { ok: false, error: '说太快啦，休息一下。' });
    arr.push(now); rate.set(ip, arr);

    let body = '';
    let over = false;
    req.on('data', c => { body += c; if (body.length > 2048) { over = true; req.destroy(); } });
    req.on('end', () => {
      if (over) return;
      let data;
      try { data = JSON.parse(body); } catch { return send(res, 400, { ok: false, error: 'bad json' }); }
      const nick = String(data.nick || '').slice(0, 12).trim();
      const text = String(data.text || '').slice(0, 80).trim();
      if (!text) return send(res, 400, { ok: false, error: 'empty' });

      const list = readMessages();
      list.push({ nick: nick || '路人', text, time: new Date().toISOString(), ip });
      writeMessages(list);
      send(res, 200, { ok: true });
    });
    return;
  }

  /* ---- 查看留言（仅密钥持有者） ---- */
  if (req.method === 'GET' && url.pathname === '/api/messages') {
    if (url.searchParams.get('key') !== ADMIN_KEY) return send(res, 401, { ok: false, error: 'wrong key' });
    const list = readMessages().slice().reverse().map(m => ({ nick: m.nick, text: m.text, time: m.time }));
    return send(res, 200, { ok: true, count: list.length, list });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true, up: true });
  }

  /* ---- 托管前端 ---- */
  if (req.method === 'GET') return serveStatic(res, url.pathname);

  send(res, 405, { ok: false, error: 'method not allowed' });
});

server.listen(PORT, () => {
  console.log(`SHELL-727 留言服务已启动: http://0.0.0.0:${PORT}`);
  if (ADMIN_KEY === 'CHANGE_ME') console.warn('⚠ 请用环境变量设置你自己的 ADMIN_KEY！');
});
