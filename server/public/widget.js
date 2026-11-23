/*! SAC widget — cole no site: <script src="https://SEU-SAC/widget.js" data-linha="CODIGO" async></script> */
(function () {
  'use strict';
  if (window.SAC && window.SAC.__loaded) return;
  var s = document.currentScript || document.querySelector('script[src*="widget.js"][data-linha]');
  if (!s) return;
  var FRAME_PAGE = 'w'; // the server serves the chat window at /w
  var base = new URL(s.src, location.href).origin;
  var line = s.getAttribute('data-linha') || '';
  var lang = s.getAttribute('data-idioma') || 'auto';
  var left = s.getAttribute('data-posicao') === 'esquerda';
  var api = window.SAC = window.SAC || {};
  var player = api.jogador || null;
  var queue = [];
  api.__loaded = true;

  var side = left ? 'left' : 'right';
  var css = '' +
    '.sacw-b{position:fixed;' + side + ':20px;bottom:20px;width:60px;height:60px;border-radius:50%;background:#b8f5d0;color:#0b3d24;border:0;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .15s}' +
    '.sacw-b:hover{transform:scale(1.05)}.sacw-b:focus-visible{outline:3px solid #0b0b0c;outline-offset:3px}.sacw-b svg{width:28px;height:28px}' +
    '.sacw-n{position:absolute;top:-2px;right:-2px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#d4382a;color:#fff;font:600 12px/22px system-ui,sans-serif;text-align:center;display:none}' +
    '.sacw-p{position:fixed;' + side + ':20px;bottom:92px;width:370px;height:560px;max-height:calc(100vh - 116px);border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45);z-index:2147483001;background:#fff;display:none}' +
    '.sacw-p iframe{width:100%;height:100%;border:0;display:block}' +
    '.sacw-open .sacw-p{display:block}' +
    '@media (max-width:600px){.sacw-p{left:0;right:0;top:0;bottom:0;width:100%;height:100%;max-height:none;border-radius:0}.sacw-open .sacw-b{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.sacw-b{transition:none}}';
  var st = document.createElement('style'); st.textContent = css;

  var root = document.createElement('div'); root.className = 'sacw';
  var btn = document.createElement('button'); btn.className = 'sacw-b'; btn.type = 'button'; btn.setAttribute('aria-label', 'Chat');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span class="sacw-n"></span>';
  var badge = btn.querySelector('.sacw-n');
  var panel = document.createElement('div'); panel.className = 'sacw-p'; panel.setAttribute('role', 'dialog');
  var frame = document.createElement('iframe');
  frame.title = 'Chat';
  frame.allow = 'clipboard-write';
  var page = new URL(s.getAttribute('data-frame') || FRAME_PAGE, s.src).href;
  frame.src = page + '?line=' + encodeURIComponent(line) + '&lang=' + encodeURIComponent(lang);
  panel.appendChild(frame); root.appendChild(btn); root.appendChild(panel);

  var opened = false, overflow = '';
  function post(m) { m.sac = 1; if (ready) frame.contentWindow.postMessage(m, base); else queue.push(m); }
  var ready = false;
  function isPhone() { return window.matchMedia('(max-width:600px)').matches; }
  function open() { opened = true; root.classList.add('sacw-open'); if (isPhone()) { overflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; } post({ type: 'open', v: true }); try { frame.focus(); } catch (e) {} }
  function close() { opened = false; root.classList.remove('sacw-open'); document.documentElement.style.overflow = overflow; post({ type: 'open', v: false }); btn.focus(); }
  btn.addEventListener('click', function () { opened ? close() : open(); });

  window.addEventListener('message', function (e) {
    if (e.origin !== base || e.source !== frame.contentWindow || !e.data || !e.data.sac) return;
    var m = e.data;
    if (m.type === 'ready') { ready = true; if (player) post({ type: 'player', player: player }); queue.splice(0).forEach(post); post({ type: 'open', v: opened }); }
    if (m.type === 'close') close();
    if (m.type === 'unread') { var n = Number(m.n) || 0; badge.textContent = n > 9 ? '9+' : String(n); badge.style.display = n && !opened ? 'block' : 'none'; }
  });

  api.open = open;
  api.close = close;
  api.identify = function (p) { if (p && typeof p === 'object') { player = { id: p.id, nome: p.nome || p.name }; post({ type: 'player', player: player }); } };
  api.setLanguage = function (l) { post({ type: 'lang', l: l }); };

  function mount() { document.head.appendChild(st); document.body.appendChild(root); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
