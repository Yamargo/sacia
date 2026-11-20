'use strict';
// Persistência. Com DATABASE_URL usa Postgres; sem ela, guarda tudo em memória (só para testes).
const { Pool } = require('pg');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users    (id text PRIMARY KEY, data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS lines    (id text PRIMARY KEY, data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS chats    (id text PRIMARY KEY, no integer NOT NULL, status text NOT NULL, data jsonb NOT NULL, updated_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS scripts  (id text PRIMARY KEY, data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token text PRIMARY KEY, user_id text NOT NULL, expires bigint NOT NULL);
CREATE TABLE IF NOT EXISTS files    (id text PRIMARY KEY, name text NOT NULL, type text NOT NULL, size integer NOT NULL, data bytea NOT NULL, created bigint NOT NULL);
CREATE INDEX IF NOT EXISTS chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
`;

class PgStore {
  constructor(url) {
    const local = /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url);
    this.pool = new Pool({ connectionString: url, ssl: local || process.env.PGSSL === 'off' ? false : undefined, max: 5 });
    this.kind = 'postgres';
  }
  async init() { await this.pool.query(SCHEMA); }
  q(sql, args) { return this.pool.query(sql, args); }
  async loadAll() {
    const [u, l, c, s, st] = await Promise.all([
      this.q('SELECT data FROM users'), this.q('SELECT data FROM lines'),
      this.q('SELECT data FROM chats ORDER BY no'), this.q('SELECT data FROM scripts'),
      this.q('SELECT key, value FROM settings')]);
    const settings = {}; for (const r of st.rows) settings[r.key] = r.value;
    return { users: u.rows.map(r => r.data), lines: l.rows.map(r => r.data), chats: c.rows.map(r => r.data), scripts: s.rows.map(r => r.data), settings };
  }
  saveUser(u) { return this.q('INSERT INTO users(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2', [u.id, u]); }
  deleteUser(id) { return this.q('DELETE FROM users WHERE id=$1', [id]); }
  saveLine(l) { return this.q('INSERT INTO lines(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2', [l.id, l]); }
  deleteLine(id) { return this.q('DELETE FROM lines WHERE id=$1', [id]); }
  saveChat(c) { return this.q('INSERT INTO chats(id,no,status,data,updated_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET status=$3,data=$4,updated_at=$5', [c.id, c.no, c.status, c, Date.now()]); }
  saveScript(s) { return this.q('INSERT INTO scripts(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=$2', [s.id, s]); }
  deleteScript(id) { return this.q('DELETE FROM scripts WHERE id=$1', [id]); }
  saveSetting(k, v) { return this.q('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2', [k, JSON.stringify(v)]); }
  saveSession(token, userId, expires) { return this.q('INSERT INTO sessions(token,user_id,expires) VALUES($1,$2,$3)', [token, userId, expires]); }
  async getSession(token) { const r = await this.q('SELECT user_id, expires FROM sessions WHERE token=$1', [token]); return r.rows[0] ? { userId: r.rows[0].user_id, expires: Number(r.rows[0].expires) } : null; }
  touchSession(token, expires) { return this.q('UPDATE sessions SET expires=$2 WHERE token=$1', [token, expires]); }
  deleteSession(token) { return this.q('DELETE FROM sessions WHERE token=$1', [token]); }
  deleteUserSessions(userId) { return this.q('DELETE FROM sessions WHERE user_id=$1', [userId]); }
  purgeSessions() { return this.q('DELETE FROM sessions WHERE expires<$1', [Date.now()]); }
  saveFile(f) { return this.q('INSERT INTO files(id,name,type,size,data,created) VALUES($1,$2,$3,$4,$5,$6)', [f.id, f.name, f.type, f.size, f.data, Date.now()]); }
  async getFile(id) { const r = await this.q('SELECT name,type,size,data FROM files WHERE id=$1', [id]); return r.rows[0] || null; }
}

class MemoryStore {
  constructor() { this.kind = 'memory'; this.m = { users: new Map(), lines: new Map(), chats: new Map(), scripts: new Map(), settings: {}, sessions: new Map(), files: new Map() }; }
  async init() {}
  async loadAll() { const m = this.m; return { users: [...m.users.values()], lines: [...m.lines.values()], chats: [...m.chats.values()].sort((a, b) => a.no - b.no), scripts: [...m.scripts.values()], settings: { ...m.settings } }; }
  async saveUser(u) { this.m.users.set(u.id, JSON.parse(JSON.stringify(u))); }
  async deleteUser(id) { this.m.users.delete(id); }
  async saveLine(l) { this.m.lines.set(l.id, { ...l }); }
  async deleteLine(id) { this.m.lines.delete(id); }
  async saveChat(c) { this.m.chats.set(c.id, JSON.parse(JSON.stringify(c))); }
  async saveScript(s) { this.m.scripts.set(s.id, { ...s }); }
  async deleteScript(id) { this.m.scripts.delete(id); }
  async saveSetting(k, v) { this.m.settings[k] = v; }
  async saveSession(token, userId, expires) { this.m.sessions.set(token, { userId, expires }); }
  async getSession(token) { return this.m.sessions.get(token) || null; }
  async touchSession(token, expires) { const s = this.m.sessions.get(token); if (s) s.expires = expires; }
  async deleteSession(token) { this.m.sessions.delete(token); }
  async deleteUserSessions(userId) { for (const [k, s] of this.m.sessions) if (s.userId === userId) this.m.sessions.delete(k); }
  async purgeSessions() { const n = Date.now(); for (const [k, s] of this.m.sessions) if (s.expires < n) this.m.sessions.delete(k); }
  async saveFile(f) { this.m.files.set(f.id, { ...f }); }
  async getFile(id) { return this.m.files.get(id) || null; }
}

function createStore() {
  const url = process.env.DATABASE_URL;
  if (url) return new PgStore(url);
  console.warn('[sac] DATABASE_URL não definida: usando memória. Os dados somem ao reiniciar.');
  return new MemoryStore();
}

module.exports = { createStore };
