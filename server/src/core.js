'use strict';
// Regras do SAC no servidor: estado em memória, permissões, distribuição e comandos.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const now = () => Date.now();
const uid = () => crypto.randomBytes(6).toString('base64url') + now().toString(36).slice(-4);
const token = () => crypto.randomBytes(32).toString('base64url');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const ROLES = ['god', 'admin', 'supervisor', 'agent'];
const LANGS = ['pt', 'en', 'vi', 'ur', 'zh'];
const WLANGS = ['vi', 'ur', 'en', 'zh'];
const COLORS = ['mint', 'ink', 'lilac', 'peach', 'sky', 'sun', 'rose', 'stone'];
const DEFLINES = [{ id: '7987', name: '7987.com', color: 'mint' }, { id: '8557', name: '8557.com', color: 'ink' }];
const MAX_FILE = 10 * 1024 * 1024;
const fmtT = s => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} s`);

class Fail extends Error { constructor(key, params) { super(key); this.key = key; this.params = params; } }
const fail = (k, p) => { throw new Fail(k, p); };
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);

class Core {
  constructor(store) {
    this.store = store;
    this.users = new Map(); this.chats = new Map(); this.scripts = new Map(); this.lines = [];
    this.cfg = { timeout: 240, alert: 300, maxChats: 0 }; this.chatSeq = -1;
    this.presence = new Map(); // userId -> { sockets:Set, lastSeen, pause }
    this.dirty = { users: new Set(), chats: new Set(), lines: false, scripts: new Set(), delScripts: new Set(), settings: false };
    this.changedChats = new Set(); this.onChange = () => {};
    this.writing = Promise.resolve();
  }

  async init() {
    await this.store.init();
    const d = await this.store.loadAll();
    d.users.forEach(u => this.users.set(u.id, u));
    d.chats.forEach(c => this.chats.set(c.id, c));
    d.scripts.forEach(s => this.scripts.set(s.id, s));
    this.lines = d.lines.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    if (d.settings.cfg) this.cfg = { ...this.cfg, ...d.settings.cfg };
    this.chatSeq = d.settings.chatSeq ?? Math.max(-1, ...[...this.chats.values()].map(c => c.no));
    if (!this.lines.length) { this.lines = DEFLINES.map((l, i) => ({ ...l, pos: i })); this.dirty.lines = true; }
    if (!this.users.size) {
      const email = str(process.env.ADMIN_EMAIL || 'god@sac.local', 120).toLowerCase();
      let pass = process.env.ADMIN_PASSWORD;
      if (!pass) { pass = crypto.randomBytes(9).toString('base64url'); console.log(`[sac] Acesso total criado: ${email} / senha: ${pass}  (defina ADMIN_PASSWORD para escolher a senha)`); }
      else console.log(`[sac] Acesso total criado: ${email} (senha de ADMIN_PASSWORD)`);
      const god = { id: 'god', name: 'Acesso Total', email, pass: await bcrypt.hash(pass, 10), role: 'god', lines: this.lines.map(l => l.id), lang: 'pt', createdAt: now() };
      this.users.set(god.id, god); this.dirty.users.add(god.id);
    }
    this.dirty.settings = true;
    await this.flush();
  }

  // ---------- persistence ----------
  flush() {
    const d = this.dirty;
    const jobs = [];
    for (const id of d.users) { const u = this.users.get(id); jobs.push(u ? this.store.saveUser(u) : this.store.deleteUser(id)); }
    for (const id of d.chats) { const c = this.chats.get(id); if (c) jobs.push(this.store.saveChat(c)); }
    for (const id of d.scripts) { const s = this.scripts.get(id); if (s) jobs.push(this.store.saveScript(s)); }
    for (const id of d.delScripts) jobs.push(this.store.deleteScript(id));
    if (d.lines) { const ids = new Set(this.lines.map(l => l.id)); this.lines.forEach((l, i) => { l.pos = i; jobs.push(this.store.saveLine(l)); }); for (const id of d.removedLines || []) if (!ids.has(id)) jobs.push(this.store.deleteLine(id)); }
    if (d.settings) jobs.push(this.store.saveSetting('cfg', this.cfg), this.store.saveSetting('chatSeq', this.chatSeq));
    this.dirty = { users: new Set(), chats: new Set(), lines: false, scripts: new Set(), delScripts: new Set(), settings: false };
    this.writing = this.writing.then(() => Promise.all(jobs)).catch(e => console.error('[sac] erro ao salvar', e));
    return this.writing;
  }
  touchChat(c) { this.dirty.chats.add(c.id); this.changedChats.add(c.id); }
  touchUser(u) { this.dirty.users.add(u.id); }
  changed() { this.flush(); this.onChange(); }

  // ---------- helpers ----------
  U(id) { return this.users.get(id); }
  LN(id) { return this.lines.find(l => l.id === id); }
  lineIds() { return this.lines.map(l => l.id); }
  online(u) { const p = u && this.presence.get(u.id); return !!(p && !p.kicked && (p.sockets.size > 0 || now() - p.lastSeen < 20000)); }
  paused(u) { const p = u && this.presence.get(u.id); return !!(p && p.pause); }
  openOf(id) { let n = 0; for (const c of this.chats.values()) if (c.status === 'open' && c.agentId === id) n++; return n; }
  onAgents(line, ex) { return [...this.users.values()].filter(u => u.role === 'agent' && u.lines.includes(line) && u.id !== ex && this.online(u)); }
  freeAgents(line, ex) { return this.onAgents(line, ex).filter(u => !this.paused(u)); }
  pick(line, ex) { const m = this.cfg.maxChats; return this.freeAgents(line, ex).filter(u => !(m > 0 && this.openOf(u.id) >= m)).sort((a, b) => this.openOf(a.id) - this.openOf(b.id))[0]; }
  sys(c, k, p) { c.msgs.push({ id: uid(), from: 'system', k, p: p || {}, at: now() }); }
  assign(c, u, k, p) { c.agentId = u ? u.id : null; if (u) { c.assignedAt = now(); if (!c.handled.includes(u.id)) c.handled.push(u.id); } if (c.waiting) c.waiting = now(); this.sys(c, k, p); this.touchChat(c); }
  nextNo() { this.chatSeq += 1; this.dirty.settings = true; return this.chatSeq; }

  maintain() {
    let ch = false; const T = (this.cfg.timeout || 240) * 1000;
    for (const c of this.chats.values()) {
      if (c.status !== 'open') continue;
      if (c.agentId && !this.online(this.U(c.agentId))) {
        const u = this.U(c.agentId), n = this.pick(c.line, c.agentId), a = u ? u.name : '—';
        if (n) this.assign(c, n, '{a} ficou offline. Chat transferido para {b}.', { a, b: n.name });
        else this.assign(c, null, '{a} ficou offline. Chat voltou para a fila da linha {l}.', { a, l: c.line });
        ch = true; continue;
      }
      if (c.agentId && c.waiting && now() - c.waiting >= T) {
        const n = this.pick(c.line, c.agentId);
        if (n) { const u = this.U(c.agentId); this.assign(c, n, 'Sem resposta de {a} em {t}. Transferido automaticamente para {b}.', { a: u ? u.name : '—', t: fmtT(this.cfg.timeout), b: n.name }); c.transfers = (c.transfers || 0) + 1; ch = true; }
      }
      if (!c.agentId) { const n = this.pick(c.line); if (n) { this.assign(c, n, 'Atribuído a {b}.', { b: n.name }); ch = true; } }
    }
    return ch;
  }

  // ---------- permissions ----------
  isBoss(u) { return ['god', 'admin', 'supervisor'].includes(u.role); }
  isTop(u) { return ['god', 'admin'].includes(u.role); }
  canEdit(me, x) { return me.role === 'god' || (me.role === 'admin' && x.role !== 'god'); }
  canPass(me, x) { return this.canEdit(me, x) || (me.role === 'supervisor' && x.role === 'agent'); }
  canKick(me, x) { if (x.id === me.id || !this.online(x)) return false; return me.role === 'god' || (me.role === 'admin' && x.role !== 'god') || (me.role === 'supervisor' && x.role === 'agent'); }
  canAct(me, c) { if (c.status !== 'open') return false; if (me.role === 'agent') return c.agentId === me.id; return me.role !== 'supervisor' || me.lines.includes(c.line); }
  canReply(me, c) { return c.status === 'open' && (c.agentId === me.id || (this.isBoss(me) && this.canAct(me, c))); }
  visible(me, c) { if (me.role === 'agent') return c.agentId === me.id || c.handled.includes(me.id); if (me.role === 'supervisor') return me.lines.includes(c.line); return true; }

  // ---------- views ----------
  stateFor(me) {
    const isAgent = me.role === 'agent';
    const users = [...this.users.values()].map(u => {
      const o = { id: u.id, name: u.name, role: u.role, lines: u.lines, createdAt: u.createdAt };
      if (!isAgent || u.id === me.id) o.email = u.email;
      if (u.id === me.id) { o.lang = u.lang; o.muted = u.muted || []; o.read = u.read || {}; }
      return o;
    });
    const sessions = {};
    for (const u of this.users.values()) { const p = this.presence.get(u.id); sessions[u.id] = { on: this.online(u), pause: !!(p && p.pause), kick: false }; }
    const vis = [...this.chats.values()].filter(c => this.visible(me, c));
    const open = vis.filter(c => c.status === 'open');
    const closed = vis.filter(c => c.status !== 'open').sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0)).slice(0, 500);
    const strip = c => { const { ctok, ...rest } = c; return rest; };
    return { me: me.id, serverNow: now(), users, sessions, chats: [...open, ...closed].sort((a, b) => a.no - b.no).map(strip),
      scripts: [...this.scripts.values()].filter(s => s.owner === me.id), lines: this.lines.map(({ pos, ...l }) => l), cfg: this.cfg, chatSeq: this.chatSeq };
  }
  customerView(c, line) {
    const ln = c ? c.line : line;
    const base = { serverNow: now(), line: ln, lineName: this.LN(ln)?.name || ln, online: this.freeAgents(ln).length, exists: !!this.LN(ln) };
    if (!c) return { ...base, chat: null };
    const a = c.status === 'open' && c.agentId && this.U(c.agentId);
    return { ...base, chat: { id: c.id, no: c.no, status: c.status, closedBy: c.closedBy === 'customer' ? 'customer' : c.closedBy ? 'staff' : null, agent: a ? a.name : null, queue: c.status === 'open' && !c.agentId, lang: c.customer.lang,
      msgs: c.msgs.filter(m => m.from !== 'system').map(m => ({ id: m.id, from: m.from, text: m.text, file: m.file, at: m.at, by: m.from === 'agent' ? (this.U(m.by)?.name || '') : undefined })) } };
  }

  // ---------- auth ----------
  async login(email, pass) {
    const u = [...this.users.values()].find(x => x.email === str(email, 120).toLowerCase());
    if (!u || !(await bcrypt.compare(String(pass || ''), u.pass))) return null;
    return u;
  }

  // ---------- files ----------
  async saveFile(f) {
    if (!f) return undefined;
    const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(String(f.data || ''));
    if (!m) fail('Arquivo inválido.');
    const buf = Buffer.from(m[3], m[2] ? 'base64' : 'utf8');
    if (buf.length > MAX_FILE) fail('Arquivo acima de {n} MB.', { n: 10 });
    const id = crypto.randomBytes(16).toString('base64url');
    const type = str(f.type || m[1] || 'application/octet-stream', 100);
    const name = str(f.name || 'arquivo', 120);
    await this.store.saveFile({ id, name, type, size: buf.length, data: buf });
    return { id, name, type, size: buf.length, data: '/files/' + id };
  }

  // ---------- staff commands ----------
  async cmd(me, name, a = {}) {
    const fn = this['c_' + name];
    if (!fn) fail('Comando desconhecido.');
    const r = await fn.call(this, me, a);
    this.changed();
    return r;
  }
  chatFor(me, id) { const c = this.chats.get(id); if (!c || !this.visible(me, c)) fail('Chat não encontrado.'); return c; }

  c_setLang(me, a) { if (!LANGS.includes(a.lang)) fail('Idioma inválido.'); me.lang = a.lang; this.touchUser(me); }
  c_profile(me, a) { const n = str(a.name, 80); if (!n) fail('Preencha nome e e-mail válidos.'); me.name = n; this.touchUser(me); }
  async c_ownPass(me, a) {
    if (!(await bcrypt.compare(String(a.old || ''), me.pass))) fail('Senha atual incorreta.');
    if (String(a.pass || '').length < 6) fail('Mínimo 6 caracteres.');
    me.pass = await bcrypt.hash(String(a.pass), 10); this.touchUser(me);
  }
  c_pause(me) { const p = this.presenceOf(me.id); p.pause = !p.pause; this.maintain(); return { pause: p.pause }; }
  c_mute(me, a) { const c = this.chatFor(me, a.chatId); me.muted = me.muted || []; me.muted = me.muted.includes(c.id) ? me.muted.filter(x => x !== c.id) : [...me.muted, c.id]; this.touchUser(me); return { muted: me.muted.includes(c.id) }; }
  c_read(me, a) { const c = this.chats.get(a.chatId); if (!c || !this.visible(me, c)) return; me.read = me.read || {}; me.read[c.id] = now(); this.touchUser(me); }
  c_readAll(me) { me.read = me.read || {}; for (const c of this.chats.values()) if (this.visible(me, c)) me.read[c.id] = now(); this.touchUser(me); }

  async c_send(me, a) {
    const c = this.chatFor(me, a.chatId);
    if (!this.canReply(me, c)) fail('Somente leitura. Só o agente responsável responde a este cliente.');
    const text = str(a.text, 4000); const file = await this.saveFile(a.file);
    if (!text && !file) return;
    if (!c.agentId) { c.agentId = me.id; c.assignedAt = now(); this.sys(c, 'Assumido por {a}.', { a: me.name }); }
    if (!c.handled.includes(me.id)) c.handled.push(me.id);
    c.msgs.push({ id: uid(), from: 'agent', by: me.id, text, file, at: now() });
    c.waiting = null; c.custWait = null; this.touchChat(c);
  }
  c_take(me, a) {
    const c = this.chatFor(me, a.chatId);
    if (!this.isBoss(me) || !this.canAct(me, c)) fail('Sem permissão.');
    const old = c.agentId && this.U(c.agentId);
    c.agentId = me.id; c.assignedAt = now(); if (c.waiting) c.waiting = now(); if (!c.handled.includes(me.id)) c.handled.push(me.id);
    old ? this.sys(c, '{a} assumiu o chat de {b}.', { a: me.name, b: old.name }) : this.sys(c, 'Assumido por {a}.', { a: me.name });
    this.touchChat(c);
  }
  c_transfer(me, a) {
    const c = this.chatFor(me, a.chatId); if (!this.canAct(me, c)) fail('Sem permissão.');
    const to = this.U(a.to);
    if (!to || to.role !== 'agent' || !to.lines.includes(c.line) || !this.online(to) || this.paused(to)) fail('Esse agente ficou offline.');
    this.assign(c, to, 'Transferido por {a} para {b}.', { a: me.name, b: to.name });
  }
  c_close(me, a) {
    const c = this.chatFor(me, a.chatId); if (!this.canAct(me, c)) fail('Sem permissão.');
    const r = str(a.reason, 1000);
    if (me.role === 'agent' && r.length < 5) fail('Escreva a justificativa (mínimo 5 caracteres).');
    c.status = 'closed'; c.closedAt = now(); c.closedBy = me.id; c.closeReason = r; c.waiting = null; c.custWait = null;
    this.sys(c, 'Encerrado por {a}.', { a: me.name }); this.touchChat(c);
  }
  async c_kick(me, a) { const x = this.U(a.userId); if (!x || !this.canKick(me, x)) fail('Sem permissão.'); await this.store.deleteUserSessions(x.id); this.kick(x.id, 'kicked'); return { name: x.name }; }
  async c_setPass(me, a) {
    const x = this.U(a.userId); if (!x || !this.canPass(me, x)) fail('Sem permissão.');
    if (String(a.pass || '').length < 6) fail('Mínimo 6 caracteres.');
    x.pass = await bcrypt.hash(String(a.pass), 10); this.touchUser(x);
    if (x.id !== me.id) await this.store.deleteUserSessions(x.id), this.kick(x.id, 'password');
  }
  async c_userCreate(me, a) {
    if (!this.isTop(me)) fail('Sem permissão.');
    const name = str(a.name, 80), email = str(a.email, 120).toLowerCase(), role = a.role;
    const lines = (Array.isArray(a.lines) ? a.lines : []).filter(l => this.LN(l));
    if (!name || !email.includes('@')) fail('Preencha nome e e-mail válidos.');
    if (!['admin', 'supervisor', 'agent'].includes(role)) fail('Sem permissão.');
    if (!lines.length) fail('Escolha ao menos uma linha.');
    if (String(a.pass || '').length < 6) fail('Mínimo 6 caracteres.');
    if ([...this.users.values()].some(u => u.email === email)) fail('Esse e-mail já está em uso.');
    const u = { id: uid(), name, email, pass: await bcrypt.hash(String(a.pass), 10), role, lines, createdAt: now() };
    this.users.set(u.id, u); this.touchUser(u);
  }
  c_userEdit(me, a) {
    const x = this.U(a.userId); if (!x || !this.canEdit(me, x)) fail('Sem permissão.');
    const name = str(a.name, 80), email = str(a.email, 120).toLowerCase();
    const lines = (Array.isArray(a.lines) ? a.lines : []).filter(l => this.LN(l));
    if (!name || !email.includes('@')) fail('Preencha nome e e-mail válidos.');
    if (!lines.length) fail('Escolha ao menos uma linha.');
    if ([...this.users.values()].some(u => u.email === email && u.id !== x.id)) fail('Esse e-mail já está em uso.');
    x.name = name; x.email = email; x.lines = lines;
    if (x.role !== 'god' && ['admin', 'supervisor', 'agent'].includes(a.role)) x.role = a.role;
    this.touchUser(x); this.maintain();
  }
  async c_userDel(me, a) {
    const x = this.U(a.userId); if (!x || !this.canEdit(me, x) || x.id === me.id || x.role === 'god') fail('Sem permissão.');
    this.users.delete(x.id); this.dirty.users.add(x.id); this.kick(x.id, 'removed'); await this.store.deleteUserSessions(x.id); this.presence.delete(x.id); this.maintain();
  }
  c_lineCreate(me, a) {
    if (!this.isTop(me)) fail('Sem permissão.');
    const id = str(a.id, 20), name = str(a.name, 80), color = COLORS.includes(a.color) ? a.color : 'stone';
    if (!/^[A-Za-z0-9-]{2,20}$/.test(id)) fail('Use de 2 a 20 letras, números ou hífen.');
    if (this.lines.some(l => l.id.toLowerCase() === id.toLowerCase())) fail('Esse código já existe.');
    if (!name) fail('Preencha nome e e-mail válidos.');
    this.lines.push({ id, name, color }); this.dirty.lines = true;
    for (const u of this.users.values()) if ((u.role === 'god' || u.role === 'admin') && !u.lines.includes(id)) { u.lines.push(id); this.touchUser(u); }
  }
  c_lineEdit(me, a) { if (!this.isTop(me)) fail('Sem permissão.'); const l = this.LN(a.id); if (!l) fail('Linha não encontrada.'); const n = str(a.name, 80); if (n) l.name = n; if (COLORS.includes(a.color)) l.color = a.color; this.dirty.lines = true; }
  c_lineDel(me, a) {
    if (!this.isTop(me)) fail('Sem permissão.');
    if ([...this.chats.values()].some(c => c.status === 'open' && c.line === a.id)) fail('Feche os chats abertos da linha {l} antes de excluir.', { l: a.id });
    this.lines = this.lines.filter(l => l.id !== a.id); this.dirty.lines = true; this.dirty.removedLines = [...(this.dirty.removedLines || []), a.id];
    for (const u of this.users.values()) if (u.lines.includes(a.id)) { u.lines = u.lines.filter(x => x !== a.id); this.touchUser(u); }
  }
  c_cfg(me, a) {
    if (!this.isTop(me)) fail('Sem permissão.');
    const v = parseInt(a.value, 10);
    if (a.key === 'timeout') this.cfg.timeout = Math.max(10, Math.min(3600, v || 240));
    else if (a.key === 'alert') this.cfg.alert = Math.max(30, Math.min(7200, v || 300));
    else if (a.key === 'maxChats') this.cfg.maxChats = Math.max(0, Math.min(50, v || 0));
    else fail('Comando desconhecido.');
    this.dirty.settings = true; this.maintain(); return { value: this.cfg[a.key] };
  }
  c_scriptSave(me, a) {
    const title = str(a.title, 80), text = str(a.text, 4000); if (!title || !text) fail('Preencha título e texto.');
    let s = a.id && this.scripts.get(a.id);
    if (s && s.owner !== me.id) fail('Sem permissão.');
    if (!s) { s = { id: uid(), owner: me.id }; this.scripts.set(s.id, s); }
    s.title = title; s.text = text; this.dirty.scripts.add(s.id);
  }
  c_scriptDel(me, a) { const s = this.scripts.get(a.id); if (!s || s.owner !== me.id) return; this.scripts.delete(s.id); this.dirty.delScripts.add(s.id); }

  newChat(line, customer, firstMsg, source, file) {
    const c = { id: uid(), no: this.nextNo(), line, source, customer, status: 'open', agentId: null, handled: [], createdAt: now(), waiting: now(), custWait: now(), transfers: 0, msgs: [] };
    c.msgs.push({ id: uid(), from: 'customer', text: firstMsg, file, at: now() });
    this.sys(c, source === 'site' ? 'Cliente entrou pelo site, linha {l}.' : 'Cliente entrou pela linha {l}.', { l: line });
    this.chats.set(c.id, c); this.touchChat(c); this.maintain();
    return c;
  }
  c_simNew(me, a) {
    if (!this.LN(a.line)) fail('Linha não encontrada.');
    const name = str(a.name, 80), msg = str(a.msg, 4000); if (!name || !msg) fail('Preencha nome e e-mail válidos.');
    const c = this.newChat(a.line, { name, phone: str(a.phone, 40) }, msg, 'sim');
    const ag = c.agentId && this.U(c.agentId);
    return { id: c.id, agent: ag ? ag.name : null, line: c.line };
  }
  c_simMsg(me, a) {
    const c = this.chats.get(a.chatId); if (!c || c.status !== 'open') fail('Esse chat já foi encerrado.');
    const m = str(a.msg, 4000); if (!m) return;
    c.msgs.push({ id: uid(), from: 'customer', text: m, at: now() }); if (!c.waiting) c.waiting = now(); if (!c.custWait) c.custWait = now(); this.touchChat(c);
  }

  // ---------- customer (widget) ----------
  chatByToken(t) { if (!t) return null; const h = sha(t); for (const c of this.chats.values()) if (c.ctok === h) return c; return null; }
  async customerCmd(sess, name, a = {}) {
    let c = this.chatByToken(sess.token);
    if (name === 'start') {
      if (!this.LN(a.line)) fail('Linha não encontrada.');
      const nm = str(a.name, 80), msg = str(a.msg, 4000); if (!nm || !msg) fail('Preencha nome e e-mail válidos.');
      const tok = token();
      const p = a.player && typeof a.player === 'object' ? a.player : {};
      c = this.newChat(a.line, { name: nm, phone: '', pid: str(a.pid || p.id, 80), lang: WLANGS.includes(a.lang) ? a.lang : 'en' }, msg, 'site');
      c.ctok = sha(tok); this.touchChat(c); sess.token = tok; this.changed();
      return { token: tok };
    }
    if (!c) fail('Chat não encontrado.');
    if (name === 'send') {
      if (c.status !== 'open') fail('Esse chat já foi encerrado.');
      const text = str(a.text, 4000), file = await this.saveFile(a.file); if (!text && !file) return;
      c.msgs.push({ id: uid(), from: 'customer', text, file, at: now() }); if (!c.waiting) c.waiting = now(); if (!c.custWait) c.custWait = now();
    } else if (name === 'end') {
      if (c.status === 'open') { c.status = 'closed'; c.closedAt = now(); c.closedBy = 'customer'; c.closeReason = ''; c.waiting = null; c.custWait = null; this.sys(c, 'Encerrado pelo cliente.'); }
    } else if (name === 'lang') {
      if (WLANGS.includes(a.lang)) c.customer.lang = a.lang;
    } else fail('Comando desconhecido.');
    this.touchChat(c); this.maintain(); this.changed();
  }

  // ---------- presence ----------
  presenceOf(id) { let p = this.presence.get(id); if (!p) { p = { sockets: new Set(), lastSeen: 0, pause: false }; this.presence.set(id, p); } return p; }
  attach(id, ws) { const p = this.presenceOf(id); p.sockets.add(ws); p.lastSeen = now(); p.kicked = false; this.maintain(); this.changed(); }
  detach(id, ws) { const p = this.presence.get(id); if (!p) return; p.sockets.delete(ws); p.lastSeen = now(); this.onChange(); }
  logoutUser(id) { const p = this.presence.get(id); if (p) { p.lastSeen = 0; for (const ws of p.sockets) try { ws.close(4000, 'logout'); } catch (e) {} p.sockets.clear(); } this.maintain(); this.changed(); }
  kick(id, reason) {
    const p = this.presence.get(id); if (!p) return;
    p.kicked = true; p.lastSeen = 0;
    for (const ws of p.sockets) { try { ws.send(JSON.stringify({ t: 'bye', reason })); ws.close(4001, reason); } catch (e) {} }
    p.sockets.clear(); this.maintain();
  }
}

module.exports = { Core, Fail, sha, token, now };
