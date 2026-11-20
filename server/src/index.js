'use strict';
// Servidor HTTP + WebSocket do SAC.
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { createStore } = require('./store');
const { Core, Fail, sha, token, now } = require('./core');

const PORT = Number(process.env.PORT || 3000);
const PUB = path.join(__dirname, '..', 'public');
const SESSION_DAYS = 7;
const COOKIE = 'sac_s';

const store = createStore();
const core = new Core(store);
const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

// ---------- helpers ----------
const parseCookies = h => Object.fromEntries(String(h || '').split(';').map(p => p.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const isHttps = req => req.secure || req.headers['x-forwarded-proto'] === 'https';
function setCookie(req, res, val, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE}=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`);
}
async function userFromReq(req) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (!t) return null;
  const s = await store.getSession(sha(t));
  if (!s || s.expires < now()) return null;
  const u = core.U(s.userId);
  if (!u) return null;
  return { user: u, tokenHash: sha(t) };
}
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch (e) { return false; }
}
function security(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
}

// ---------- login rate limit ----------
const attempts = new Map();
function limited(key) { const a = attempts.get(key); return a && a.n >= 5 && now() - a.t < 15 * 60e3; }
function failAttempt(key) { const a = attempts.get(key); if (!a || now() - a.t > 15 * 60e3) attempts.set(key, { n: 1, t: now() }); else a.n++; }

// ---------- routes ----------
app.get('/healthz', (req, res) => res.json({ ok: true, store: store.kind }));

app.post('/api/login', express.json({ limit: '10kb' }), async (req, res) => {
  security(res);
  if (!sameOrigin(req)) return res.status(403).json({ ok: false });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const key = req.ip + '|' + email;
  if (limited(key)) return res.status(429).json({ ok: false, error: 'Muitas tentativas. Tente de novo em 15 minutos.' });
  const u = await core.login(email, req.body?.password);
  if (!u) { failAttempt(key); return res.status(401).json({ ok: false, error: 'E-mail ou senha incorretos.' }); }
  attempts.delete(key);
  const t = token();
  await store.saveSession(sha(t), u.id, now() + SESSION_DAYS * 864e5);
  setCookie(req, res, t, SESSION_DAYS * 86400);
  res.json({ ok: true });
});

app.post('/api/logout', async (req, res) => {
  security(res);
  if (!sameOrigin(req)) return res.status(403).json({ ok: false });
  const s = await userFromReq(req);
  if (s) { await store.deleteSession(s.tokenHash); core.logoutUser(s.user.id); }
  setCookie(req, res, '', 0);
  res.json({ ok: true });
});

app.get('/api/me', async (req, res) => {
  security(res);
  const s = await userFromReq(req);
  res.json(s ? { ok: true, id: s.user.id } : { ok: false });
});

app.get('/files/:id', async (req, res) => {
  const f = await store.getFile(String(req.params.id).slice(0, 64));
  if (!f) return res.status(404).end();
  security(res);
  const safe = /^(image\/(png|jpe?g|gif|webp)|application\/pdf|text\/plain)$/.test(f.type);
  res.setHeader('Content-Type', safe ? f.type : 'application/octet-stream');
  res.setHeader('Content-Disposition', `${safe ? 'inline' : 'attachment'}; filename="${encodeURIComponent(f.name)}"`);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.end(f.data);
});

const page = name => (req, res) => { security(res); res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(PUB, name)); };
app.get('/', page('app.html'));
app.get('/w', page('w.html'));
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(PUB, 'widget.js'));
});
app.get('/demo/:line', (req, res) => {
  const line = String(req.params.line).replace(/[^A-Za-z0-9-]/g, '').slice(0, 20);
  const l = core.LN(line);
  if (!l) return res.status(404).send('Linha não encontrada.');
  security(res);
  res.setHeader('Cache-Control', 'no-cache');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  res.type('html').send(fs.readFileSync(path.join(PUB, 'demo.html'), 'utf8').replaceAll('{{LINE}}', esc(l.id)).replaceAll('{{NAME}}', esc(l.name)));
});
app.use((req, res) => res.status(404).send('Não encontrado.'));

// ---------- websockets ----------
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024 });
const staff = new Set();     // { ws, userId }
const customers = new Set(); // { ws, token, line }

server.on('upgrade', async (req, sock, head) => {
  const url = new URL(req.url, 'http://x');
  if (!sameOrigin(req) || !['/ws', '/wsc'].includes(url.pathname)) { sock.destroy(); return; }
  if (url.pathname === '/ws') {
    const s = await userFromReq(req);
    if (!s) { sock.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); sock.destroy(); return; }
    wss.handleUpgrade(req, sock, head, ws => onStaff(ws, s.user.id));
  } else {
    wss.handleUpgrade(req, sock, head, ws => onCustomer(ws, url.searchParams.get('line') || '', url.searchParams.get('token') || ''));
  }
});

const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };

function onStaff(ws, userId) {
  const conn = { ws, userId };
  staff.add(conn); ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  core.attach(userId, ws);
  send(ws, { t: 'state', state: core.stateFor(core.U(userId)) });
  ws.on('message', async raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t !== 'cmd') return;
    const me = core.U(userId);
    if (!me) return ws.close(4001, 'removed');
    try { const data = await core.cmd(me, String(m.cmd), m.args || {}); send(ws, { t: 'res', id: m.id, ok: true, data }); }
    catch (e) { if (!(e instanceof Fail)) console.error('[sac] erro no comando', m.cmd, e); send(ws, { t: 'res', id: m.id, ok: false, error: e instanceof Fail ? e.key : 'Erro interno.', params: e.params }); }
  });
  ws.on('close', () => { staff.delete(conn); core.detach(userId, ws); });
}

function onCustomer(ws, line, tok) {
  const conn = { ws, token: tok, line, rate: [] };
  customers.add(conn); ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  send(ws, { t: 'cstate', state: core.customerView(core.chatByToken(tok), line) });
  ws.on('message', async raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t !== 'cmd') return;
    const t0 = now(); conn.rate = conn.rate.filter(x => t0 - x < 60e3); conn.rate.push(t0);
    if (conn.rate.length > 40) return send(ws, { t: 'res', id: m.id, ok: false, error: 'Muitas mensagens. Aguarde um pouco.' });
    try { const data = await core.customerCmd(conn, String(m.cmd), { ...(m.args || {}), line: conn.line }); send(ws, { t: 'res', id: m.id, ok: true, data }); }
    catch (e) { if (!(e instanceof Fail)) console.error('[sac] erro do cliente', e); send(ws, { t: 'res', id: m.id, ok: false, error: e instanceof Fail ? e.key : 'Erro interno.', params: e.params }); }
  });
  ws.on('close', () => customers.delete(conn));
}

let pending = null;
core.onChange = () => {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    for (const c of staff) { const u = core.U(c.userId); if (u) send(c.ws, { t: 'state', state: core.stateFor(u) }); }
    for (const c of customers) send(c.ws, { t: 'cstate', state: core.customerView(core.chatByToken(c.token), c.line) });
    core.changedChats.clear();
  }, 60);
};

let presenceSig = '';
setInterval(() => {
  if (core.maintain()) core.changed();
  const sig = [...core.users.values()].filter(u => core.online(u)).map(u => u.id).sort().join(',');
  if (sig !== presenceSig) { presenceSig = sig; core.onChange(); }
}, 1000);
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch (e) {} } }, 25000);
setInterval(() => { store.purgeSessions().catch(() => {}); }, 3600e3);

core.init().then(() => {
  server.listen(PORT, () => console.log(`[sac] no ar na porta ${PORT} (${store.kind})`));
}).catch(e => { console.error('[sac] falha ao iniciar', e); process.exit(1); });
