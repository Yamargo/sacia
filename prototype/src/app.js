let SKEW=0;const MAXF=NET?10*1024*1024:1.5*1024*1024;const siteHref=l=>NET?'/demo/'+encodeURIComponent(l):'#site-'+l;
const K='sac_db_v1',$=s=>document.querySelector(s),now=()=>Date.now()+SKEW;
const LANGS=[['pt','Português','pt-BR'],['en','English','en-US'],['vi','Tiếng Việt','vi-VN'],['ur','Roman Urdu','en-GB'],['zh','中文','zh-CN']];
const D={};LANGS.slice(1).forEach(([k],i)=>{D[k]={};for(const r of ROWS)if(r[i+1])D[k][r[0]]=r[i+1]});
let lang=(()=>{try{const v=localStorage.getItem('sac_lang');return LANGS.some(l=>l[0]===v)?v:'pt'}catch(e){return 'pt'}})();
const t=(k,p,L=lang)=>{let s=(L!=='pt'&&D[L]&&D[L][k])||k;if(p)for(const x in p)s=s.split('{'+x+'}').join(p[x]);return s};
const loc=()=>LANGS.find(l=>l[0]===lang)[2];
const RL={god:'Acesso total',admin:'Admin',supervisor:'Supervisor',agent:'Agente'};
const rl=r=>t(RL[r]);
const DEFLINES=[{id:'7987',name:'7987.com',color:'mint'},{id:'8557',name:'8557.com',color:'ink'}];
const COL={mint:['#b8f5d0','#0b3d24','#1f6b5a'],ink:['var(--ink)','var(--bg)','#26307a'],lilac:['#d9ccff','#2a1a66','#4b2a8a'],peach:['#ffd6b8','#5a2a0b','#7a2f26'],sky:['#c7e4ff','#0b2f5a','#1b4f8a'],sun:['#fff0a8','#4a3c00','#7a5a12'],rose:['#ffc9dc','#5a0b2a','#7a1f4a'],stone:['#e3e3df','#0b0b0c','#3a3b40']};
const LS=()=>(db&&db.lines)||DEFLINES;
const LINES=()=>LS().map(l=>l.id);
const LN=id=>LS().find(l=>l.id===id);
let mem=null,db=null,me=null,view='atendimento',tab=null,sel=null,pend=null,editSc=null,known=new Set();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hm=x=>new Date(x).toLocaleTimeString(loc(),{hour:'2-digit',minute:'2-digit'});
const dt=x=>new Date(x).toLocaleString(loc(),{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const uid=()=>Math.random().toString(36).slice(2,9)+now().toString(36).slice(-4);
const fmtT=s=>s>=60&&s%60===0?`${s/60} min`:`${s} s`;
const tagL=l=>{const x=LN(l),c=COL[x?.color]||COL.stone;return `<span class="tag" style="background:${c[0]};color:${c[1]}" title="${esc(x?.name||l)}">${esc(l)}</span>`};
const csub=c=>c.customer.phone||(c.customer.pid?t('ID do jogador: {id}',{id:c.customer.pid}):t('Via site'));
const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
let lsOK=true;
function load(){try{const s=localStorage.getItem(K);if(s)return JSON.parse(s)}catch(e){lsOK=false}return mem?JSON.parse(JSON.stringify(mem)):null}
function save(d){mem=d;try{localStorage.setItem(K,JSON.stringify(d))}catch(e){if(e&&e.name==='QuotaExceededError')toast(t('Armazenamento cheio. Anexos grandes ocupam espaço.'));else lsOK=false}}
let sidMem=null;
function getSid(){try{return sessionStorage.getItem('sac_uid')}catch(e){return sidMem}}
function setSid(v){sidMem=v;try{v?sessionStorage.setItem('sac_uid',v):sessionStorage.removeItem('sac_uid')}catch(e){}}
async function hash(p){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('sac|'+p));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of 'sac|'+p)h=((h*33)^c.charCodeAt(0))>>>0;return 'x'+h.toString(16)}}
const U=(d,id)=>d.users.find(u=>u.id===id);
const ME=()=>U(db,me);
function online(d,u){const s=u&&d.sessions[u.id];return !!(s&&s.on&&!s.kick&&now()-s.lastSeen<20000)}
const openOf=(d,id)=>d.chats.filter(c=>c.status==='open'&&c.agentId===id).length;
const onAgents=(d,line,ex)=>d.users.filter(u=>u.role==='agent'&&u.lines.includes(line)&&u.id!==ex&&online(d,u));
const pick=(d,line,ex)=>freeAgents(d,line,ex).filter(u=>!(d.cfg.maxChats>0&&openOf(d,u.id)>=d.cfg.maxChats)).sort((a,b)=>openOf(d,a.id)-openOf(d,b.id))[0];
function sys(c,k,p){c.msgs.push({id:uid(),from:'system',k,p:p||{},at:now()})}
const sysText=m=>m.k?t(m.k,m.p):m.text;
function assign(c,u,k,p){c.agentId=u?u.id:null;if(u){c.assignedAt=now();if(!c.handled.includes(u.id))c.handled.push(u.id)}if(c.waiting)c.waiting=now();sys(c,k,p)}
function maintain(d){let ch=false;const T=(d.cfg.timeout||240)*1000;
 for(const c of d.chats){if(c.status!=='open')continue;
  if(c.agentId&&!online(d,U(d,c.agentId))){const u=U(d,c.agentId),n=pick(d,c.line,c.agentId),a=u?u.name:'—';
   n?assign(c,n,'{a} ficou offline. Chat transferido para {b}.',{a,b:n.name}):assign(c,null,'{a} ficou offline. Chat voltou para a fila da linha {l}.',{a,l:c.line});ch=true;continue}
  if(c.agentId&&c.waiting&&now()-c.waiting>=T){const n=pick(d,c.line,c.agentId);if(n){const u=U(d,c.agentId);assign(c,n,'Sem resposta de {a} em {t}. Transferido automaticamente para {b}.',{a:u?u.name:'—',t:fmtT(d.cfg.timeout),b:n.name});c.transfers=(c.transfers||0)+1;ch=true}}
  if(!c.agentId){const n=pick(d,c.line);if(n){assign(c,n,'Atribuído a {b}.',{b:n.name});ch=true}}
 }return ch}
function nextNo(d){d.chatSeq=(d.chatSeq??-1)+1;return d.chatSeq}
function tx(fn){const d=load()||db;const r=fn(d);save(d);db=d;render();return r}

/* permissions */
const role=()=>ME()?.role;
const isBoss=()=>['god','admin','supervisor'].includes(role());
const isTop=()=>['god','admin'].includes(role());
function canEdit(x){const r=role();return r==='god'||(r==='admin'&&x.role!=='god')}
function canPass(x){const r=role();return canEdit(x)||(r==='supervisor'&&x.role==='agent')}
function canKick(x){if(x.id===me||!online(db,x))return false;const r=role();return r==='god'||(r==='admin'&&x.role!=='god')||(r==='supervisor'&&x.role==='agent')}
function canAct(c){if(c.status!=='open')return false;const u=ME();if(u.role==='agent')return c.agentId===me;return u.role!=='supervisor'||u.lines.includes(c.line)}
function canReply(c){return c.status==='open'&&(c.agentId===me||(isBoss()&&canAct(c)))}
function visible(c){const u=ME();if(u.role==='agent')return c.agentId===me||c.handled.includes(me);if(u.role==='supervisor')return u.lines.includes(c.line);return true}

/* ui helpers */
let tt;function toast(m){const x=$('#toast');x.textContent=m;x.hidden=false;clearTimeout(tt);tt=setTimeout(()=>x.hidden=true,3200)}
function modal(h){$('#modal').innerHTML=`<div class="mbox" role="dialog" aria-modal="true">${h}</div>`;$('#modal').hidden=false;const f=$('#modal input,#modal textarea,#modal select');f&&f.focus()}
const mclose=()=>{$('#modal').hidden=true;$('#modal').innerHTML=''};
function setLang(l,persist){lang=l;document.documentElement.lang=loc();try{localStorage.setItem('sac_lang',l)}catch(e){}
 if(persist&&me){const d=load()||db;const u=U(d,me);if(u){u.lang=l;save(d);db=d}}}

/* ---------- shells ---------- */
const IC={
 chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2a5 5 0 0 1 5 5"/>',
 users:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3"/>',
 sim:'<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18h3"/>',
 plug:'<path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${IC[k]}</svg>`;
const langOpts=()=>LANGS.map(l=>`<option value="${l[0]}" ${l[0]===lang?'selected':''}>${l[1]}</option>`).join('');

function buildLogin(){const em=$('#lEmail')?.value||'';
 $('#login').innerHTML=`<div class="side"><div><div class="logo" style="margin-bottom:28px">SAC</div><h1>${t('Central de atendimento')}</h1><p style="color:#9b9ba3;max-width:420px">${t('Duas linhas, uma equipe. Entre com seu acesso para atender, supervisionar ou administrar.')}</p></div>
 <div class="board">${LS().slice(0,4).map(l=>`<div class="jack"><b>${esc(l.id)}</b><span>${esc(l.name)}</span><i></i></div>`).join('')}${LS().length>4?`<div class="mute" style="color:#9b9ba3">${t('+{n} linhas',{n:LS().length-4})}</div>`:''}</div></div>
 <form id="fLogin" autocomplete="on"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px"><h2 style="font-size:26px;margin:0">${t('Entrar')}</h2><label class="llang" title="${t('Idioma')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg><select id="lLang" aria-label="${t('Idioma')}">${langOpts()}</select></label></div>
 <label class="f">${t('E-mail')}<input id="lEmail" type="email" autocomplete="username" required value="${esc(em)}"></label>
 <label class="f">${t('Senha')}<input id="lPass" type="password" autocomplete="current-password" required></label>
 <div class="err" id="lErr"></div><button class="btn pri" style="width:100%;min-height:46px">${t('Entrar')}</button></form>`}

function buildApp(){const u=ME();const nb=(v,ic,l,extra='')=>`<button class="nb" data-act="nav" data-v="${v}" title="${l}" aria-label="${l}" id="nav-${v}">${svg(ic)}${extra}</button>`;
 $('#app').innerHTML=`<nav class="rail"><div class="logo">SAC</div>
 ${nb('atendimento','chat',t('Atendimento'),'<span class="cnt" id="cntOpen" hidden></span>')}${nb('equipe','team',t('Equipe online'))}${nb('usuarios','users',t('Usuários'))}${nb('simulador','sim',t('Simulador de cliente'))}${nb('alertas','bell',t('Alertas'),'<span class="cnt al" id="cntAl" hidden></span>')}${nb('integracao','plug',t('Integração'))}${nb('config','gear',t('Configurações'))}
 <button class="stb" id="stBtn" data-act="pauseToggle" hidden><i></i></button>
 <button class="meb" data-act="nav" data-v="config" id="meBtn" title="${t('Configurações')}" aria-label="${t('Configurações')}"></button>
 <button class="nb lgo" data-act="askLogout" title="${t('Sair')}" aria-label="${t('Sair')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg></button></nav>

 <section class="view" id="v-atendimento"><div class="work" id="work">
  <aside class="fold" id="fold"><div class="fh"><h2>${t('Chats')}</h2><button class="ib" data-act="foldToggle" aria-label="${t('Recolher painel de pastas')}" title="${t('Recolher painel de pastas')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 10l-2 2 2 2"/></svg></button></div><nav id="foldNav"></nav></aside>
  <aside class="list"><div class="lh"><div class="srow"><label class="sbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="q" type="search" placeholder="${t('ID do chat, nome, telefone…')}" aria-label="${t('Buscar chats')}"></label>
   <button class="ib fb" id="fBtn" data-act="filters" aria-label="${t('Filtros')}" title="${t('Filtros')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg><span class="fcnt" id="fCnt" hidden></span></button>
   <button class="ib fb" data-act="more" aria-label="${t('Mais opções')}" title="${t('Mais opções')}"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></div>
   <select id="foldSel" class="foldsel" aria-label="${t('Pasta')}"></select><div class="tabs" id="tabs"></div><div class="lhd" id="listHead" hidden></div></div><div id="chatList"></div><div id="fpop" class="fpop" hidden></div></aside>
  <main class="chat"><div class="ch" id="chatHead"></div><div id="msgs"></div>
   <div class="comp" id="comp"><div id="att"></div>
    <div class="tools"><button class="tb" data-act="scripts" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/></svg>${t('Script')}</button>
    <label class="tb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11.5 12.3 19a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/></svg>${t('Anexar')}<input type="file" id="file" hidden></label></div>
    <div class="crow"><textarea id="txt" rows="2" placeholder="${t('Escreva uma mensagem. Enter envia, Shift+Enter quebra linha.')}"></textarea><button class="btn pri" data-act="send" type="button">${t('Enviar')}</button></div>
    <div id="pop" hidden></div></div>
   <div class="note" id="compNote" hidden></div></main>
  <aside class="info" id="info"></aside></div></section>

 <section class="view pad" id="v-equipe" hidden><h1>${t('Equipe online')}</h1><p class="mute" style="margin:0">${t('Quem está conectado agora, por linha.')}</p><div class="stats" id="teamStats"></div>
  <div class="tw"><table class="stack"><thead><tr><th>${t('Nome')}</th><th>${t('Função')}</th><th>${t('Linhas')}</th><th>${t('Status')}</th><th style="text-align:right">${t('Chats abertos')}</th><th style="text-align:right">${t('Ações')}</th></tr></thead><tbody id="teamBody"></tbody></table></div></section>

 <section class="view pad" id="v-usuarios" hidden><h1>${t('Usuários')}</h1><p class="mute" style="margin:0" id="usersSub"></p>
  <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))">
   <form class="card" id="fNewUser"><h2>${t('Criar acesso')}</h2>
    <label class="f">${t('Nome')}<input id="nuName" required></label><label class="f">${t('E-mail')}<input id="nuEmail" type="email" required></label>
    <label class="f">${t('Senha provisória')}<input id="nuPass" type="text" minlength="6" required></label>
    <label class="f">${t('Função')}<select id="nuRole">${['admin','supervisor','agent'].map(r=>`<option value="${r}" ${r==='agent'?'selected':''}>${rl(r)}</option>`).join('')}</select></label>
    <div style="font-size:13px;color:var(--mute)">${t('Linhas')}</div><div class="chk" id="nuLines"></div>
    <button class="btn pri" style="width:100%">${t('Criar acesso')}</button></form>
   <div style="grid-column:span 2;min-width:min(100%,520px)"><div class="tw" style="margin-top:0"><table class="stack"><thead><tr><th>${t('Nome')}</th><th>${t('E-mail')}</th><th>${t('Função')}</th><th>${t('Linhas')}</th><th style="text-align:right">${t('Ações')}</th></tr></thead><tbody id="usersBody"></tbody></table></div></div>
  </div></section>

 <section class="view pad" id="v-simulador" hidden><h1>${t('Simulador de cliente')}</h1>
  <p class="mute" style="max-width:68ch;margin:0">${t('Enquanto nenhum canal real está ligado, use esta tela para fazer clientes chegarem nas linhas e responderem.')}</p>
  <div class="grid2">
   <div class="card" style="background:var(--mint);color:var(--mintInk);border-color:var(--mint)"><h2>${t('Site de jogos de demonstração')}</h2>
    <p style="margin:0 0 12px;font-size:14px">${t('Um site fictício com o balão de chat, como vai ficar no 7987.com e no 8557.com. Abra numa nova aba, escreva como jogador e responda aqui no SAC.')}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap" id="simSites"></div></div>
   <form class="card" id="fSimNew"><h2>${t('Novo cliente chega')}</h2>
    <label class="f">${t('Nome do cliente')}<input id="snName" required></label><label class="f">${t('Telefone')}<input id="snPhone" required></label>
    <label class="f">${t('Linha')}<select id="snLine"></select></label>
    <label class="f">${t('Primeira mensagem')}<textarea id="snMsg" rows="2" required></textarea></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="simFill">${t('Preencher exemplo')}</button><button class="btn pri" style="flex:1">${t('Abrir chat')}</button></div></form>
   <form class="card" id="fSimMsg"><h2>${t('Cliente responde')}</h2>
    <label class="f">${t('Conversa aberta')}<select id="smChat"></select></label><label class="f">${t('Mensagem do cliente')}<textarea id="smMsg" rows="3" required></textarea></label>
    <button class="btn pri" style="width:100%">${t('Enviar como cliente')}</button></form>
   <div class="card" ${NET?'hidden':''}><h2>${t('Testar vários usuários')}</h2>
    <p style="margin:0 0 8px;font-size:14px">${t('Cada aba deste navegador guarda um login próprio. Abra este mesmo link em outras abas (normais, não anônimas) e entre com o agente, o supervisor e o admin. Todos veem os mesmos dados ao vivo.')}</p>
    <p class="mute" style="margin:0;font-size:13px">${t('Os dados ficam só neste navegador. Para uso real com várias pessoas, o próximo passo é um servidor.')}</p></div>
  </div></section>

 <section class="view pad" id="v-integracao" hidden><div id="guide"></div></section>

 <section class="view pad" id="v-alertas" hidden><div class="hdr"><div><h1>${t('Alertas de chats')}</h1><p class="mute" style="margin:0" id="alSub"></p></div><div class="sndbar" id="alSound"></div></div>
  <p class="mute" style="font-size:13px;margin:10px 0 0">${t('O som toca quando surge um alerta e repete a cada minuto até você marcar Ciente.')}</p><div id="alList" class="allist"></div></section>

 <section class="view pad" id="v-config" hidden><h1>${t('Configurações')}</h1><p class="mute" style="margin:0">${t('Preferências da sua conta e do atendimento.')}</p>
  <div class="set">
   <div class="card"><h2>${t('Idioma')}</h2><p class="mute" style="margin:-4px 0 14px;font-size:14px">${t('Vale para todo o sistema, inclusive o site de demonstração, e fica salvo no seu acesso.')}</p>
    <div class="langs">${LANGS.map(l=>`<button class="lc ${l[0]===lang?'on':''}" data-act="setLang" data-l="${l[0]}" aria-pressed="${l[0]===lang}" lang="${l[2]}">${l[1]}</button>`).join('')}</div></div>
   <div class="card" id="linesCard" style="grid-column:1/-1"><h2>${t('Linhas de empresas')}</h2><p class="mute" style="margin:-4px 0 14px;font-size:14px">${t('Cada linha é uma empresa ou site. Os chats chegam pela linha e vão para os agentes dela.')}</p>
    <form id="fLine" class="lineform"><label class="f">${t('Código da linha')}<input id="lnId" required maxlength="20" placeholder="9123"></label><label class="f">${t('Nome da empresa ou site')}<input id="lnName" required placeholder="9123.com"></label>
     <div class="f">${t('Cor')}<div class="sw">${Object.keys(COL).map((c,i)=>`<label title="${c}"><input type="radio" name="lnC" value="${c}" ${i===2?'checked':''}><span style="background:${COL[c][0]}"></span></label>`).join('')}</div></div>
     <button class="btn pri">${t('Adicionar linha')}</button></form>
    <div class="tw"><table class="stack"><thead><tr><th>${t('Código')}</th><th>${t('Empresa')}</th><th style="text-align:right">${t('Agentes')}</th><th style="text-align:right">${t('Chats abertos')}</th><th style="text-align:right">${t('Ações')}</th></tr></thead><tbody id="linesBody"></tbody></table></div></div>
   <form class="card" id="fProfile"><h2>${t('Meu perfil')}</h2>
    <label class="f">${t('Nome')}<input id="pfName" required value="${esc(u.name)}"></label>
    <label class="f">${t('E-mail')}<input value="${esc(u.email)}" disabled></label>
    <p class="mute" style="font-size:14px;margin:0 0 12px">${rl(u.role)} · ${t('Linhas')}: ${u.lines.map(tagL).join(' ')}</p>
    <button class="btn pri">${t('Salvar perfil')}</button></form>
   <form class="card" id="fOwnPass"><h2>${t('Minha senha')}</h2>
    <label class="f">${t('Senha atual')}<input id="op" type="password" autocomplete="current-password" required></label>
    <label class="f">${t('Nova senha')}<input id="op1" type="password" autocomplete="new-password" minlength="6" required></label>
    <label class="f">${t('Repita a nova senha')}<input id="op2" type="password" autocomplete="new-password" required></label>
    <div class="err" id="oErr"></div><button class="btn pri">${t('Alterar senha')}</button></form>
   <div class="card"><h2>${t('Notificações')}</h2><p class="mute" style="margin:-4px 0 14px;font-size:14px">${t('Tocar som quando chega um chat novo ou uma mensagem nos seus chats.')}</p><div class="sndbar" id="nsBox"></div></div>
   <form class="card" id="fMax"><h2>${t('Limite de chats por agente')}</h2>
    <p class="mute" style="margin-top:-4px;font-size:14px">${t('Quantos chats abertos cada agente pode ter ao mesmo tempo. Novos chats esperam na fila quando todos estão no limite. 0 = sem limite.')}</p>
    <label class="f">${t('Chats abertos')}<input id="cfgM" type="number" min="0" max="50" required></label><button class="btn pri">${t('Salvar')}</button></form>
   <form class="card" id="fAlert"><h2>${t('Alerta de demora')}</h2>
    <p class="mute" style="margin-top:-4px;font-size:14px">${t('Avisa o supervisor quando um cliente espera resposta por esse tempo. Padrão: 300 s (5 min).')}</p>
    <label class="f">${t('Segundos')}<input id="cfgA" type="number" min="30" max="7200" required></label><button class="btn pri">${t('Salvar')}</button></form>
   <form class="card" id="fCfg"><h2>${t('Tempo sem resposta')}</h2>
    <p class="mute" style="margin-top:-4px;font-size:14px">${t('Depois desse tempo sem resposta, o chat vai para outro agente online da mesma linha. Padrão: 240 s (4 min). Para testar rápido, use 30.')}</p>
    <label class="f">${t('Segundos')}<input id="cfgT" type="number" min="10" max="3600" required></label><button class="btn pri">${t('Salvar')}</button></form>
   <div class="card"><h2>${t('Sessão')}</h2><p style="margin:0 0 14px">${t('Conectado como {n}.',{n:esc(u.name)})}</p><button class="btn bad" data-act="logout">${t('Sair')}</button></div>
  </div></section>`}

/* ---------- login / session ---------- */
function showLogin(msg){$('#app').hidden=true;$('#site').hidden=true;buildLogin();$('#login').hidden=false;$('#lErr').textContent=msg||''}
async function doLogin(){const em=$('#lEmail').value.trim().toLowerCase(),h=await hash($('#lPass').value);const d=load()||db;const u=d.users.find(x=>x.email===em);
 if(!u||u.pass!==h){$('#lErr').textContent=t('E-mail ou senha incorretos.');return}
 me=u.id;setSid(me);d.sessions[me]={on:true,lastSeen:now(),kick:false};
 if(u.lang)setLang(u.lang);else u.lang=lang;
 maintain(d);save(d);db=d;known=new Set(d.chats.filter(c=>c.agentId===me).map(c=>c.id));enter()}
function enter(){const u=ME();if(u.lang&&u.lang!==lang)setLang(u.lang);document.documentElement.lang=loc();$('#login').hidden=true;$('#site').hidden=true;IN.folder=u.role==='agent'?'mine':'team';IN.qtab='all';view='atendimento';sel=null;buildApp();$('#app').hidden=false;render()}
function logout(msg){document.title='SAC';if(typeof AL!=='undefined'){AL.seen.clear();AL.ack.clear()}const d=load();if(d&&me&&d.sessions[me]){d.sessions[me].on=false;d.sessions[me].kick=false;maintain(d);save(d);db=d}me=null;setSid(null);sel=null;pend=null;mclose();showLogin(msg)}

/* ---------- render ---------- */
function render(){if(!me)return;db=db||load();const u=ME();if(!u)return logout(t('Seu acesso foi removido.'));
 if(!NET){$('#warn').hidden=lsOK;$('#warn').textContent=t('Modo temporário: este navegador não permite salvar dados. Tudo some ao recarregar.')}
 $('#meBtn').textContent=ini(u.name);renderStatus();
 $('#nav-usuarios').hidden=!isBoss();$('#nav-integracao').hidden=!isTop();$('#nav-alertas').hidden=!isSup();
 if((view==='alertas'&&!isSup())||(view==='integracao'&&!isTop())||(view==='usuarios'&&!isBoss()))view='atendimento';
 document.querySelectorAll('.nb').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
 document.querySelectorAll('#app .view').forEach(v=>v.hidden=v.id!=='v-'+view);
 const mine=db.chats.filter(c=>c.status==='open'&&(u.role==='agent'?c.agentId===me:visible(c))).length;
 $('#cntOpen').hidden=!mine;$('#cntOpen').textContent=mine;
 for(const c of db.chats)if(c.status==='closed'&&c.closedBy==='customer'&&c.agentId===me&&known.has(c.id)){known.delete(c.id);toast(t('{n} encerrou o chat.',{n:c.customer.name}))}
 for(const c of db.chats)if(c.status==='open'&&c.agentId===me&&!known.has(c.id)){known.add(c.id);if(!mutedSet().has(c.id))toast(t('Novo chat: {n} (linha {l})',{n:c.customer.name,l:c.line}))}
 if(view==='atendimento'){renderList();renderChat();renderInfo()}
 if(view==='equipe')renderTeam();
 if(view==='usuarios')renderUsers();
 if(view==='simulador')renderSim();
 if(view==='integracao'){const k=lang+JSON.stringify(LS());if($('#guide').dataset.k!==k){$('#guide').dataset.k=k;renderGuide()}}
 if(view==='alertas')renderAlerts();
 if(view==='config'){renderNs();$('#fMax').hidden=!isTop();if(document.activeElement!==$('#cfgM'))$('#cfgM').value=db.cfg.maxChats||0;$('#fCfg').hidden=!isTop();$('#fAlert').hidden=!isTop();if(document.activeElement!==$('#cfgA'))$('#cfgA').value=db.cfg.alert||300;$('#linesCard').hidden=!isTop();if(isTop())renderLines();if(document.activeElement!==$('#cfgT'))$('#cfgT').value=db.cfg.timeout}}

const last=c=>c.msgs.filter(m=>m.from!=='system').slice(-1)[0]||c.msgs.slice(-1)[0]||{at:c.createdAt,text:''};
function waitPill(c){if(c.status!=='open')return '';if(!c.agentId)return `<span class="wait">${t('Na fila')}</span>`;if(!c.waiting)return '';
 const r=Math.max(0,(db.cfg.timeout*1000)-(now()-c.waiting)),s=Math.ceil(r/1000);return `<span class="wait ${s<=60?'hot':''}">${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}</span>`}
function renderChat(){const c=db.chats.find(x=>x.id===sel);$('#work').classList.toggle('mc',!!c);
 if(!c||!visible(c)){sel=null;$('#chatHead').innerHTML=`<div class="who"><b>${t('Nenhuma conversa aberta')}</b><span>${t('Escolha uma conversa na lista')}</span></div>`;$('#msgs').innerHTML=`<div class="empty" style="margin:auto">${t('Selecione uma conversa para ver as mensagens.')}</div>`;$('#msgs').dataset.k='';$('#comp').hidden=true;$('#compNote').hidden=true;return}
 const a=c.agentId&&U(db,c.agentId),act=canAct(c);
 $('#chatHead').innerHTML=`<button class="ib back" data-act="back" aria-label="${t('Voltar')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button><span class="av">${esc(ini(c.customer.name))}</span><div class="who"><b>${esc(c.customer.name)} ${tagL(c.line)} <button class="cidb" data-act="copyId" data-v="${cid(c)}" title="${t('Copiar ID')}">${cid(c)}</button></b><span>${esc(csub(c))}${c.customer.lang?' · '+esc(LANGS.find(l=>l[0]===c.customer.lang)?.[1]||''):''} · ${c.status==='closed'?t('Encerrado'):a?esc(t('Com {n}',{n:a.name})):t('Na fila')}</span></div>
 <div class="acts"><button class="ib infob" data-act="info" aria-label="${t('Detalhes do cliente')}" title="${t('Detalhes do cliente')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg></button><button class="ib" data-act="mute" aria-label="${mutedSet().has(c.id)?t('Reativar som do chat'):t('Silenciar chat')}" title="${mutedSet().has(c.id)?t('Reativar som do chat'):t('Silenciar chat')}" style="color:${mutedSet().has(c.id)?'var(--bad)':'inherit'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${mutedSet().has(c.id)?FI_.muted:IC.bell}</svg></button>${act&&isBoss()&&c.agentId!==me?`<button class="btn" data-act="take">${t('Assumir')}</button>`:''}${act?`<button class="btn" data-act="transfer">${t('Transferir')}</button><button class="btn bad" data-act="close">${t('Encerrar')}</button>`:''}</div>`;
 const box=$('#msgs'),atEnd=box.scrollHeight-box.scrollTop-box.clientHeight<80,k=lang+':'+c.id+':'+c.msgs.length;
 if(box.dataset.k!==k){const same=box.dataset.n===c.id;box.innerHTML=c.msgs.map(msgHtml).join('');box.dataset.k=k;if(atEnd||!same)box.scrollTop=box.scrollHeight;box.dataset.n=c.id}
 if(document.visibilityState!=='hidden'&&markRead(c))renderList();
 const can=canReply(c);$('#comp').hidden=!can;$('#compNote').hidden=can;
 if(!can){const cb=c.closedBy&&U(db,c.closedBy);$('#compNote').innerHTML=c.status==='closed'?(c.closedBy==='customer'?esc(t('Encerrado pelo cliente em {d}.',{d:dt(c.closedAt)})):esc(t('Encerrado por {n} em {d}.',{n:cb?cb.name:'—',d:dt(c.closedAt)})))+(c.closeReason?' '+esc(t('Justificativa: {r}',{r:c.closeReason})):''):t('Somente leitura. Só o agente responsável responde a este cliente.')}}
function fileHtml(f,cls){return f.type.startsWith('image/')?`<img src="${f.data}" alt="${esc(f.name)}">`:`<a class="${cls}" href="${f.data}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>${esc(f.name)} · ${(f.size/1024).toFixed(0)} KB</a>`}
function msgHtml(m){if(m.from==='system')return `<div class="sys">${esc(sysText(m))} · ${hm(m.at)}</div>`;
 const by=m.by&&U(db,m.by);return `<div class="m ${m.from==='agent'?'me':''}">${m.file?fileHtml(m.file,'fc'):''}${esc(m.text)}<small>${m.from==='agent'?esc(by?by.name:t('Agente'))+' · ':''}${hm(m.at)}</small></div>`}
function renderInfo(){const c=db.chats.find(x=>x.id===sel);$('#info').innerHTML=c?infoHtml(c):`<div class="empty">${t('Os dados do cliente aparecem aqui.')}</div>`}
function infoHtml(c){const a=c.agentId&&U(db,c.agentId),cb=c.closedBy&&U(db,c.closedBy);
 return `<span class="av big">${esc(ini(c.customer.name))}</span><h2 style="margin:0">${esc(c.customer.name)}</h2><div class="mute">${esc(csub(c))}</div>${c.source==='site'?`<div style="margin-top:6px"><span class="tag" style="background:var(--panel2);color:var(--ink)">${t('Veio pelo site')}</span></div>`:''}
 <dl><div><dt>${t('ID do chat')}</dt><dd>${cid(c)}</dd></div><div><dt>${t('Linha')}</dt><dd>${tagL(c.line)}</dd></div><div><dt>${t('Status')}</dt><dd>${c.status==='open'?t('Em atendimento'):t('Encerrado')}</dd></div><div><dt>${t('Agente')}</dt><dd>${a?esc(a.name):c.status==='open'?t('Na fila'):'—'}</dd></div>
 ${c.customer.lang?`<div><dt>${t('Idioma do cliente')}</dt><dd>${esc(LANGS.find(l=>l[0]===c.customer.lang)?.[1]||c.customer.lang)}</dd></div>`:''}<div><dt>${t('Aberto em')}</dt><dd>${dt(c.createdAt)}</dd></div><div><dt>${t('Transferências automáticas')}</dt><dd>${c.transfers||0}</dd></div><div><dt>${t('Atendido por')}</dt><dd>${c.handled.map(i=>esc(U(db,i)?.name||'—')).join(', ')||'—'}</dd></div>
 ${c.status==='closed'?`<div><dt>${t('Encerrado por')}</dt><dd>${c.closedBy==='customer'?t('Cliente'):esc(cb?.name||'—')} · ${dt(c.closedAt)}</dd></div>${c.closeReason?`<div><dt>${t('Justificativa')}</dt><dd>${esc(c.closeReason)}</dd></div>`:''}`:''}</dl>`}

function renderTeam(){const u=ME();let L=db.users;
 if(u.role==='agent')L=L.filter(x=>x.role==='agent');if(u.role==='supervisor')L=L.filter(x=>x.role==='agent'&&x.lines.some(l=>u.lines.includes(l)));
 L=[...L].sort((a,b)=>online(db,b)-online(db,a)||a.name.localeCompare(b.name));
 $('#teamStats').innerHTML=LINES().map((l,i)=>`<div class="stat ${i===0?'mint':''}"><b>${onAgents(db,l).length}</b><span>${t('agentes online na {l}',{l})}</span></div>`).join('')+`<div class="stat"><b>${db.chats.filter(c=>c.status==='open'&&!c.agentId).length}</b><span>${t('chats na fila')}</span></div>`;
 $('#teamBody').innerHTML=L.map(x=>{const on=online(db,x);return `<tr><td><b>${esc(x.name)}</b>${x.id===me?` <span class="mute">${t('(você)')}</span>`:''}</td><td>${rl(x.role)}</td><td>${x.lines.map(tagL).join(' ')}</td><td><span class="dot ${on?(paused(db,x)?'pz':'on'):''}"></span>${on?(paused(db,x)?t('Em pausa'):t('Online')):t('Offline')}</td><td class="n">${openOf(db,x.id)}</td>
 <td><div class="ta">${canKick(x)?`<button class="btn bad" data-act="kick" data-id="${x.id}">${t('Desconectar')}</button>`:''}${canPass(x)&&x.id!==me?`<button class="btn" data-act="pass" data-id="${x.id}">${t('Alterar senha')}</button>`:''}</div></td></tr>`}).join('')||`<tr><td colspan="6" class="empty">${t('Ninguém cadastrado ainda.')}</td></tr>`}

function renderUsers(){const u=ME(),full=isTop();
 $('#fNewUser').hidden=!full;$('#usersSub').textContent=full?(u.role==='god'?t('Você pode criar e alterar qualquer acesso.'):t('Você pode criar e alterar acessos, exceto o acesso total.')):t('Você pode alterar a senha dos agentes das suas linhas.');
 const nl=$('#nuLines'),was=new Set([...nl.querySelectorAll('input:checked')].map(x=>x.value)),fresh=!nl.dataset.k;nl.dataset.k='1';
 nl.innerHTML=LINES().map(l=>`<label><input type="checkbox" name="nuL" value="${esc(l)}" ${fresh||was.has(l)?'checked':''}> ${tagL(l)} ${esc(LN(l).name)}</label>`).join('')||`<span class="mute">${t('Crie uma linha em Configurações primeiro.')}</span>`;
 let L=db.users;if(!full)L=L.filter(x=>x.role==='agent'&&x.lines.some(l=>u.lines.includes(l)));
 const ord={god:0,admin:1,supervisor:2,agent:3};L=[...L].sort((a,b)=>ord[a.role]-ord[b.role]||a.name.localeCompare(b.name));
 $('#usersBody').innerHTML=L.map(x=>`<tr><td><b>${esc(x.name)}</b>${x.id===me?` <span class="mute">${t('(você)')}</span>`:''}</td><td>${esc(x.email)}</td><td>${rl(x.role)}</td><td>${x.lines.map(tagL).join(' ')}</td>
 <td><div class="ta">${canEdit(x)?`<button class="btn" data-act="edit" data-id="${x.id}">${t('Editar')}</button>`:''}${canPass(x)?`<button class="btn" data-act="pass" data-id="${x.id}">${t('Senha')}</button>`:''}${canEdit(x)&&x.id!==me&&x.role!=='god'?`<button class="btn bad" data-act="del" data-id="${x.id}">${t('Excluir')}</button>`:''}${!canPass(x)?`<span class="mute" style="font-size:13px">${t('Protegido')}</span>`:''}</div></td></tr>`).join('')}

function renderSim(){const sl=$('#snLine'),sv=sl.value;sl.innerHTML=LS().map(l=>`<option value="${esc(l.id)}">${esc(l.id)} · ${esc(l.name)}</option>`).join('');if(LINES().includes(sv))sl.value=sv;
 $('#simSites').innerHTML=LS().map(l=>`<a class="btn pri" href="${siteHref(l.id)}" target="_blank" rel="opener" style="text-decoration:none">${t('Abrir site {l}',{l:esc(l.id)})}</a>`).join('');
 const s=$('#smChat'),v=s.value,O=db.chats.filter(c=>c.status==='open');
 s.innerHTML=O.length?O.map(c=>`<option value="${c.id}">${esc(c.customer.name)} · ${c.line}</option>`).join(''):`<option value="">${t('Nenhum chat aberto')}</option>`;if(O.some(c=>c.id===v))s.value=v}

function renderLines(){$('#linesBody').innerHTML=LS().map(l=>`<tr><td>${tagL(l.id)}</td><td>${esc(l.name)}</td><td class="n">${db.users.filter(u=>u.role==='agent'&&u.lines.includes(l.id)).length}</td><td class="n">${db.chats.filter(c=>c.status==='open'&&c.line===l.id).length}</td>
 <td><div class="ta"><button class="btn" data-act="editLine" data-id="${esc(l.id)}">${t('Editar')}</button><button class="btn bad" data-act="delLine" data-id="${esc(l.id)}">${t('Excluir')}</button></div></td></tr>`).join('')||`<tr><td colspan="5" class="empty">${t('Nenhuma linha. Crie a primeira para começar a receber chats.')}</td></tr>`}
const swatches=(sel)=>`<div class="sw">${Object.keys(COL).map(c=>`<label title="${c}"><input type="radio" name="elC" value="${c}" ${c===sel?'checked':''}><span style="background:${COL[c][0]}"></span></label>`).join('')}</div>`;

/* scripts popover */
function renderPop(){const S=db.scripts.filter(s=>s.owner===me),e=editSc&&S.find(s=>s.id===editSc);
 $('#pop').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h2 style="margin:0;font-size:16px">${t('Meus scripts')}</h2><button class="ib" data-act="popClose" aria-label="${t('Fechar')}">${X}</button></div>
 ${S.map(s=>`<div class="sc"><button data-act="useSc" data-id="${s.id}"><b>${esc(s.title)}</b><span>${esc(s.text)}</span></button><button class="ib" data-act="editSc" data-id="${s.id}" aria-label="${t('Editar')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button><button class="ib" data-act="delSc" data-id="${s.id}" aria-label="${t('Excluir')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div>`).join('')||`<p class="mute" style="font-size:14px;margin:0 0 8px">${t('Nenhum script ainda. Crie respostas prontas para usar com um clique.')}</p>`}
 <div style="border-top:1px solid var(--line);margin-top:10px;padding-top:12px"><label class="f">${e?t('Editar script'):t('Novo script')}: ${t('título')}<input id="scT" value="${esc(e?.title||'')}"></label><label class="f">${t('Texto')}<textarea id="scX" rows="3">${esc(e?.text||'')}</textarea></label>
 <div class="mact" style="margin:0">${e?`<button class="btn" data-act="cancelSc">${t('Cancelar')}</button>`:''}<button class="btn pri" data-act="saveSc">${e?t('Salvar'):t('Criar script')}</button></div></div>`}

/* ---------- actions ---------- */
function send(){const c=db.chats.find(x=>x.id===sel),m=$('#txt').value.trim();if(!c||!canReply(c)||(!m&&!pend))return;const nm=ME().name;
 tx(d=>{const x=d.chats.find(y=>y.id===sel);if(!x||x.status!=='open')return;if(!x.agentId){x.agentId=me;x.assignedAt=now();sys(x,'Assumido por {a}.',{a:nm})}if(!x.handled.includes(me))x.handled.push(me);x.msgs.push({id:uid(),from:'agent',by:me,text:m,file:pend||undefined,at:now()});x.waiting=null;x.custWait=null});
 $('#txt').value='';pend=null;$('#att').innerHTML=''}

const A={
 nav:b=>{view=b.dataset.v;const p=$('#pop');if(p)p.hidden=true;render()},
 open:b=>{sel=b.dataset.id;pend=null;$('#att').innerHTML='';$('#pop').hidden=true;render()},
 back:()=>{sel=null;render()},
 send,
 take:()=>{const nm=ME().name;tx(d=>{const x=d.chats.find(y=>y.id===sel);if(!x||x.status!=='open')return;const old=x.agentId&&U(d,x.agentId);x.agentId=me;x.assignedAt=now();if(x.waiting)x.waiting=now();if(!x.handled.includes(me))x.handled.push(me);old?sys(x,'{a} assumiu o chat de {b}.',{a:nm,b:old.name}):sys(x,'Assumido por {a}.',{a:nm})});toast(t('Chat assumido.'))},
 scripts:()=>{const p=$('#pop');p.hidden=!p.hidden;if(!p.hidden){editSc=null;renderPop()}},
 popClose:()=>$('#pop').hidden=true,
 useSc:b=>{const s=db.scripts.find(x=>x.id===b.dataset.id);if(!s)return;const x=$('#txt');x.value=(x.value?x.value+'\n':'')+s.text;$('#pop').hidden=true;x.focus()},
 editSc:b=>{editSc=b.dataset.id;renderPop()},cancelSc:()=>{editSc=null;renderPop()},
 delSc:b=>{tx(d=>{d.scripts=d.scripts.filter(s=>!(s.id===b.dataset.id&&s.owner===me))});renderPop()},
 saveSc:()=>{const ti=$('#scT').value.trim(),te=$('#scX').value.trim();if(!ti||!te)return toast(t('Preencha título e texto.'));
  tx(d=>{const s=editSc&&d.scripts.find(x=>x.id===editSc&&x.owner===me);if(s){s.title=ti;s.text=te}else d.scripts.push({id:uid(),owner:me,title:ti,text:te})});editSc=null;renderPop();toast(t('Script salvo.'))},
 rmAtt:()=>{pend=null;$('#att').innerHTML=''},
 transfer:()=>{const c=db.chats.find(x=>x.id===sel);if(!c||!canAct(c))return;const L=freeAgents(db,c.line,c.agentId);
  modal(`<h2>${t('Transferir chat')}</h2><p class="mute" style="margin-top:0">${t('Agentes online na linha {l}.',{l:c.line})}</p>${L.map(u=>`<button class="pick" data-act="doTransfer" data-to="${u.id}"><span class="av">${esc(ini(u.name))}</span><span style="flex:1"><b>${esc(u.name)}</b><br><span class="mute" style="font-size:13px">${t('{n} chats abertos',{n:openOf(db,u.id)})}</span></span><span class="dot on"></span></button>`).join('')||`<p>${t('Nenhum outro agente online na linha {l} agora.',{l:c.line})}</p>`}<div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button></div>`)},
 doTransfer:b=>{const by=ME().name;let ok=true;tx(d=>{const c=d.chats.find(x=>x.id===sel),to=U(d,b.dataset.to);if(!c||!to||!online(d,to)||paused(d,to)){ok=false;return}assign(c,to,'Transferido por {a} para {b}.',{a:by,b:to.name})});mclose();if(!ok)return toast(t('Esse agente ficou offline.'));if(role()==='agent')sel=null;render();toast(t('Chat transferido.'))},
 close:()=>{const ag=role()==='agent';modal(`<h2>${t('Encerrar chat')}</h2>${ag?`<label class="f">${t('Justificativa (obrigatória)')}<textarea id="reason" rows="3"></textarea></label>`:`<p class="mute" style="margin-top:0">${t('Você pode encerrar sem justificativa.')}</p><label class="f">${t('Observação (opcional)')}<textarea id="reason" rows="2"></textarea></label>`}<div class="err" id="rErr"></div><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doClose">${t('Encerrar')}</button></div>`)},
 doClose:()=>{const r=$('#reason').value.trim();if(role()==='agent'&&r.length<5){$('#rErr').textContent=t('Escreva a justificativa (mínimo 5 caracteres).');return}
  const by=ME().name;tx(d=>{const c=d.chats.find(x=>x.id===sel);if(!c)return;c.status='closed';c.closedAt=now();c.closedBy=me;c.closeReason=r;c.waiting=null;c.custWait=null;sys(c,'Encerrado por {a}.',{a:by})});mclose();toast(t('Chat encerrado.'))},
 kick:b=>{const x=U(db,b.dataset.id);if(!x||!canKick(x))return;tx(d=>{const s=d.sessions[x.id];if(s){s.kick=true;s.on=false}maintain(d)});toast(t('{n} foi desconectado.',{n:x.name}))},
 pass:b=>{const x=U(db,b.dataset.id);if(!x||!canPass(x))return;modal(`<h2>${t('Nova senha')}</h2><p class="mute" style="margin-top:0">${esc(x.name)} · ${rl(x.role)}</p><label class="f">${t('Nova senha')}<input id="np1" type="text" minlength="6"></label><label class="f">${t('Repita a nova senha')}<input id="np2" type="text"></label><div class="err" id="pErr"></div><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doPass" data-id="${x.id}">${t('Salvar senha')}</button></div>`)},
 doPass:async b=>{const a=$('#np1').value,c=$('#np2').value;if(a.length<6)return $('#pErr').textContent=t('Mínimo 6 caracteres.');if(a!==c)return $('#pErr').textContent=t('As senhas não conferem.');
  const h=await hash(a);tx(d=>{const x=U(d,b.dataset.id);if(x&&canPass(x))x.pass=h});mclose();toast(t('Senha alterada.'))},
 edit:b=>{const x=U(db,b.dataset.id);if(!x||!canEdit(x))return;const lock=x.role==='god';
  modal(`<h2>${t('Editar acesso')}</h2><label class="f">${t('Nome')}<input id="eName" value="${esc(x.name)}"></label><label class="f">${t('E-mail')}<input id="eEmail" type="email" value="${esc(x.email)}"></label>
  <label class="f">${t('Função')}<select id="eRole" ${lock?'disabled':''}>${(lock?['god']:['admin','supervisor','agent']).map(r=>`<option value="${r}" ${r===x.role?'selected':''}>${rl(r)}</option>`).join('')}</select></label>
  <div class="chk">${LINES().map(l=>`<label><input type="checkbox" name="eL" value="${esc(l)}" ${x.lines.includes(l)?'checked':''}> ${tagL(l)} ${esc(LN(l).name)}</label>`).join('')}</div><div class="err" id="eErr"></div>
  <div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doEdit" data-id="${x.id}">${t('Salvar')}</button></div>`)},
 doEdit:b=>{const n=$('#eName').value.trim(),em=$('#eEmail').value.trim().toLowerCase(),r=$('#eRole').value,ls=[...document.querySelectorAll('[name=eL]:checked')].map(x=>x.value);
  if(!n||!em.includes('@'))return $('#eErr').textContent=t('Preencha nome e e-mail válidos.');if(!ls.length)return $('#eErr').textContent=t('Escolha ao menos uma linha.');
  if(db.users.some(u=>u.email===em&&u.id!==b.dataset.id))return $('#eErr').textContent=t('Esse e-mail já está em uso.');
  tx(d=>{const x=U(d,b.dataset.id);if(!x||!canEdit(x))return;x.name=n;x.email=em;x.lines=ls;if(x.role!=='god')x.role=r;maintain(d)});mclose();toast(t('Acesso atualizado.'))},
 del:b=>{const x=U(db,b.dataset.id);if(!x)return;modal(`<h2>${t('Excluir acesso?')}</h2><p>${esc(t('{n} ({e}) perde o acesso. Os chats abertos dele voltam para a fila.',{n:x.name,e:x.email}))}</p><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doDel" data-id="${x.id}" style="background:var(--bad);border-color:var(--bad)">${t('Excluir')}</button></div>`)},
 doDel:b=>{tx(d=>{const x=U(d,b.dataset.id);if(!x||!canEdit(x)||x.id===me||x.role==='god')return;d.users=d.users.filter(u=>u.id!==x.id);delete d.sessions[x.id];maintain(d)});mclose();toast(t('Acesso excluído.'))},
 setLang:b=>{setLang(b.dataset.l,true);const v=view,s=sel;buildApp();view=v;sel=s;render();toast(t('Idioma alterado.'))},
 logout:()=>logout(),
 mclose,
 simFill:()=>{const N=['Mariana Souza','Carlos Pereira','Ana Ribeiro','João Martins','Fernanda Lima','Nguyen Van An','Ahmed Raza','Li Wei'],M=['Olá, meu pedido ainda não chegou.','Boa tarde, preciso de ajuda com a minha fatura.','Oi! Quero trocar um produto.','Não consigo acessar minha conta.','Qual o prazo de entrega para o meu CEP?'],r=a=>a[Math.floor(Math.random()*a.length)];
  $('#snName').value=r(N);$('#snPhone').value='(11) 9'+String(Math.floor(1e7+Math.random()*9e7)).slice(0,4)+'-'+String(Math.floor(1e3+Math.random()*9e3));$('#snLine').value=r(LINES());$('#snMsg').value=t(r(M))}
};

/* ---------- forms (delegated) ---------- */
const F={
 fLogin:doLogin,
 fNewUser:async f=>{if(!isTop())return;const n=$('#nuName').value.trim(),em=$('#nuEmail').value.trim().toLowerCase(),p=$('#nuPass').value,r=$('#nuRole').value,ls=[...document.querySelectorAll('[name=nuL]:checked')].map(x=>x.value);
  if(!ls.length)return toast(t('Escolha ao menos uma linha.'));if(p.length<6)return toast(t('Mínimo 6 caracteres.'));if(db.users.some(u=>u.email===em))return toast(t('Esse e-mail já está em uso.'));
  const h=await hash(p);tx(d=>{d.users.push({id:uid(),name:n,email:em,pass:h,role:r,lines:ls,createdAt:now()})});f.reset();document.querySelectorAll('[name=nuL]').forEach(x=>x.checked=true);$('#nuRole').value='agent';toast(t('{r} criado: {e}',{r:rl(r),e:em}))},
 fSimNew:f=>{const id=uid();
  tx(d=>{const c={id,no:nextNo(d),line:$('#snLine').value,customer:{name:$('#snName').value.trim(),phone:$('#snPhone').value.trim()},status:'open',agentId:null,handled:[],createdAt:now(),waiting:now(),custWait:now(),transfers:0,msgs:[]};
   c.msgs.push({id:uid(),from:'customer',text:$('#snMsg').value.trim(),at:now()});sys(c,'Cliente entrou pela linha {l}.',{l:c.line});d.chats.push(c);maintain(d);
   const a=c.agentId&&U(d,c.agentId);toast(a?t('Chat aberto e atribuído a {n}.',{n:a.name}):t('Chat aberto. Sem agente disponível na linha {l}: ficou na fila.',{l:c.line}))});
  f.reset();$('#smChat').value=id},
 fSimMsg:()=>{const id=$('#smChat').value,m=$('#smMsg').value.trim();if(!id||!m)return;
  tx(d=>{const c=d.chats.find(x=>x.id===id);if(!c||c.status!=='open')return toast(t('Esse chat já foi encerrado.'));c.msgs.push({id:uid(),from:'customer',text:m,at:now()});if(!c.waiting)c.waiting=now();if(!c.custWait)c.custWait=now()});$('#smMsg').value='';toast(t('Mensagem do cliente enviada.'))},
 fCfg:()=>{if(!isTop())return;const v=Math.max(10,Math.min(3600,parseInt($('#cfgT').value)||240));tx(d=>{d.cfg.timeout=v});$('#cfgT').blur();toast(t('Tempo sem resposta: {t}.',{t:fmtT(v)}))},
 fProfile:()=>{const n=$('#pfName').value.trim();if(!n)return;tx(d=>{U(d,me).name=n});toast(t('Perfil salvo.'))},
 fOwnPass:async()=>{const u=ME(),o=await hash($('#op').value),n=$('#op1').value;if(o!==u.pass)return $('#oErr').textContent=t('Senha atual incorreta.');if(n.length<6)return $('#oErr').textContent=t('Mínimo 6 caracteres.');if(n!==$('#op2').value)return $('#oErr').textContent=t('As senhas não conferem.');
  const h=await hash(n);tx(d=>{U(d,me).pass=h});$('#fOwnPass').reset();$('#oErr').textContent='';toast(t('Sua senha foi alterada.'))},
 wStart:()=>wStart()
};
document.addEventListener('submit',e=>{const f=e.target;if(F[f.id]){e.preventDefault();F[f.id](f)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&A[b.dataset.act]){e.preventDefault();A[b.dataset.act](b);return}if(e.target.id==='modal')mclose()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){mclose();const p=$('#pop');if(p)p.hidden=true}
 if(e.key==='Enter'&&!e.shiftKey&&(e.target.id==='txt'||e.target.id==='wTxt')){e.preventDefault();e.target.id==='txt'?send():wSend()}});
document.addEventListener('input',e=>{if(e.target.id==='q')renderList()});
document.addEventListener('change',e=>{
 if(e.target.id==='lLang'){setLang(e.target.value);buildLogin();return}
 if(e.target.id==='file'){const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>MAXF)return toast(NET?t('Arquivo acima de {n} MB.',{n:10}):t('Arquivo acima de 1,5 MB. Neste protótipo os anexos ficam no navegador.'));
  const r=new FileReader();r.onload=()=>{pend={name:f.name,type:f.type||'application/octet-stream',size:f.size,data:r.result};$('#att').innerHTML=`<span class="chip">${esc(f.name)} · ${(f.size/1024).toFixed(0)} KB <button class="ib" style="width:26px;height:26px" data-act="rmAtt" aria-label="${t('Remover anexo')}">${X}</button></span>`;$('#txt').focus()};r.readAsDataURL(f)}});

/* line management (god/admin) */
Object.assign(A,{
 editLine:b=>{const l=LN(b.dataset.id);if(!l||!isTop())return;
  modal(`<h2>${t('Editar linha')} ${tagL(l.id)}</h2><label class="f">${t('Nome da empresa ou site')}<input id="elName" value="${esc(l.name)}"></label><div class="f">${t('Cor')}${swatches(l.color)}</div><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doEditLine" data-id="${esc(l.id)}">${t('Salvar')}</button></div>`)},
 doEditLine:b=>{const n=$('#elName').value.trim(),c=document.querySelector('[name=elC]:checked')?.value;if(!n||!isTop())return;
  tx(d=>{const l=d.lines.find(x=>x.id===b.dataset.id);if(l){l.name=n;if(c)l.color=c}});mclose();toast(t('Linha atualizada.'))},
 delLine:b=>{const id=b.dataset.id;if(!isTop())return;if(db.chats.some(c=>c.status==='open'&&c.line===id))return toast(t('Feche os chats abertos da linha {l} antes de excluir.',{l:id}));
  modal(`<h2>${t('Excluir linha {l}?',{l:esc(id)})}</h2><p>${t('Os agentes deixam de atender esta linha. Os chats encerrados continuam no histórico.')}</p><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="doDelLine" data-id="${esc(id)}" style="background:var(--bad);border-color:var(--bad)">${t('Excluir')}</button></div>`)},
 doDelLine:b=>{const id=b.dataset.id;if(!isTop())return;tx(d=>{if(d.chats.some(c=>c.status==='open'&&c.line===id))return;d.lines=d.lines.filter(l=>l.id!==id);d.users.forEach(u=>u.lines=u.lines.filter(x=>x!==id))});mclose();toast(t('Linha excluída.'))}
});
F.fLine=f=>{if(!isTop())return;const id=$('#lnId').value.trim(),n=$('#lnName').value.trim(),c=document.querySelector('[name=lnC]:checked')?.value||'stone';
 if(!/^[A-Za-z0-9-]{2,20}$/.test(id))return toast(t('Use de 2 a 20 letras, números ou hífen.'));
 if(LINES().some(x=>x.toLowerCase()===id.toLowerCase()))return toast(t('Esse código já existe.'));if(!n)return;
 tx(d=>{d.lines.push({id,name:n,color:c});d.users.forEach(u=>{if((u.role==='god'||u.role==='admin')&&!u.lines.includes(id))u.lines.push(id)})});
 f.reset();const r=document.querySelector('[name=lnC][value=lilac]');if(r)r.checked=true;toast(t('Linha {l} criada.',{l:id}))};

/* ---------- supervisor alerts ---------- */
const AL={ac:null,seen:new Set(),ack:new Set(),lastBeep:0};
const isSup=()=>['supervisor','god'].includes(role());
const waitStart=c=>c.custWait??c.waiting;
const fmtDur=ms=>{const s=Math.max(0,Math.floor(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const soundPref=()=>{try{return localStorage.getItem('sac_sound')==='1'}catch(e){return false}};
function alertsOf(d){if(!me)return[];const u=U(d,me);if(!u||!['supervisor','god'].includes(u.role))return[];const T=(d.cfg.alert||300)*1000;
 return d.chats.filter(c=>c.status==='open'&&(u.role==='god'||u.lines.includes(c.line))&&waitStart(c)&&now()-waitStart(c)>=T).sort((a,b)=>waitStart(a)-waitStart(b))}
function audioOn(){try{if(!AL.ac)AL.ac=new (window.AudioContext||window.webkitAudioContext)();if(AL.ac.state==='suspended')AL.ac.resume();return true}catch(e){return false}}
function beep(times=3){if(!AL.ac||AL.ac.state!=='running')return;const ac=AL.ac;let t0=ac.currentTime+.02;
 for(let i=0;i<times;i++){for(const [f,dl] of [[880,0],[660,.16]]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;
  g.gain.setValueAtTime(0,t0+dl);g.gain.linearRampToValueAtTime(.35,t0+dl+.02);g.gain.exponentialRampToValueAtTime(.001,t0+dl+.15);o.connect(g).connect(ac.destination);o.start(t0+dl);o.stop(t0+dl+.16)}t0+=.45}}
document.addEventListener('pointerdown',()=>{if(soundPref()&&isSup()&&(!AL.ac||AL.ac.state!=='running')){audioOn();setTimeout(renderAlerts,50)}},true);
function alertTick(d){if(!me||!isSup())return 0;const L=alertsOf(d),ids=new Set(L.map(c=>c.id));
 const Mu=mutedSet(),fresh=L.filter(c=>!AL.seen.has(c.id)&&!Mu.has(c.id));for(const c of L)if(Mu.has(c.id))AL.seen.add(c.id);for(const c of fresh)AL.seen.add(c.id);
 for(const id of [...AL.seen])if(!ids.has(id)){AL.seen.delete(id);AL.ack.delete(id)}
 const on=soundPref();
 if(fresh.length){if(on)beep(3);AL.lastBeep=now();const c=fresh[0];toast(t('Alerta: {n} esperando há {t}.',{n:c.customer.name,t:fmtDur(now()-waitStart(c))}))}
 else if(on&&L.some(c=>!AL.ack.has(c.id)&&!Mu.has(c.id))&&now()-AL.lastBeep>=60000){beep(2);AL.lastBeep=now()}
 const n=L.filter(c=>!AL.ack.has(c.id)&&!Mu.has(c.id)).length;
 const b=$('#cntAl');if(b){b.hidden=!L.length;b.textContent=L.length}return n}
function renderAlerts(){if(view!=='alertas'||!$('#alList'))return;const L=alertsOf(db),on=soundPref(),live=AL.ac&&AL.ac.state==='running';
 $('#alSub').textContent=t('Clientes esperando resposta há mais de {t}.',{t:fmtT(db.cfg.alert||300)});
 $('#alSound').innerHTML=on?`<span class="snd on">${t('Som ativado')}</span>${live?'':`<span class="mute" style="font-size:13px">${t('Clique em qualquer lugar para reativar o som.')}</span>`}<button class="btn" data-act="sndTest">${t('Testar som')}</button><button class="btn" data-act="sndToggle">${t('Desativar som')}</button>`
  :`<span class="snd">${t('Som desativado')}</span><button class="btn pri" data-act="sndToggle">${t('Ativar som')}</button>`;
 $('#alList').innerHTML=L.length?L.map(c=>{const a=c.agentId&&U(db,c.agentId),lm=c.msgs.filter(m=>m.from==='customer').slice(-1)[0],ack=AL.ack.has(c.id);
  return `<div class="alc ${ack?'ack':''}"><div class="alt"><b>${fmtDur(now()-waitStart(c))}</b><span>${t('Esperando')}</span></div>
  <div class="alm"><div class="r1"><b>${esc(c.customer.name)}</b> ${tagL(c.line)}</div><div class="mute" style="font-size:14px">${a?esc(t('Com {n}',{n:a.name})):t('Na fila')}</div>
  ${lm?`<div class="alq">${lm.file?esc(t('Anexo: {f}',{f:lm.file.name})):esc(lm.text)}</div>`:''}</div>
  <div class="ta"><button class="btn pri" data-act="alOpen" data-id="${c.id}">${t('Abrir conversa')}</button>${ack?`<span class="mute" style="font-size:13px">${t('Silenciado')}</span>`:`<button class="btn" data-act="alAck" data-id="${c.id}">${t('Ciente')}</button>`}</div></div>`}).join('')
  :`<div class="alok">${svg('bell')}<b>${t('Nenhum alerta agora. Tudo em dia.')}</b></div>`}
Object.assign(A,{
 sndToggle:()=>{const on=!soundPref();try{localStorage.setItem('sac_sound',on?'1':'0')}catch(e){}if(on){audioOn();setTimeout(()=>beep(1),80);toast(t('Som ativado'))}renderAlerts()},
 sndTest:()=>{audioOn();setTimeout(()=>beep(2),80)},
 alAck:b=>{AL.ack.add(b.dataset.id);alertTick(db);renderAlerts()},
 alOpen:b=>{sel=b.dataset.id;view='atendimento';IN.folder='all';IN.qtab='all';render()}
});
F.fAlert=()=>{if(!isTop())return;const v=Math.max(30,Math.min(7200,parseInt($('#cfgA').value)||300));tx(d=>{d.cfg.alert=v});$('#cfgA').blur();toast(t('Alerta de demora: {t}.',{t:fmtT(v)}))};

/* ---------- inbox: folders, quick tabs, filters, search, chat IDs ---------- */
const cid=c=>'#'+String(c.no??0).padStart(6,'0');
const FI_={mine:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',unassigned:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01"/>',
 team:IC.team,muted:'<path d="M6 8a6 6 0 0 1 9.3-5M18 8c0 7 3 9 3 9H9M3 3l18 18M10.3 21a1.94 1.94 0 0 0 3.4 0M6 8c0 3.3-.9 5.5-1.8 7"/>',all:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'};
const IN={folder:null,qtab:'all',sort:'recent',pop:null,filt:{lines:[],status:'any',agent:'',lang:'',period:'any'},
 fc:(()=>{try{return localStorage.getItem('sac_fold')==='1'}catch(e){return false}})()};
const myU=()=>ME()||{};
const mutedSet=()=>new Set(myU().muted||[]);
const readAt=c=>(myU().read||{})[c.id]||0;
const unread=c=>c.msgs.filter(m=>m.from==='customer'&&m.at>readAt(c)).length;
const pending=c=>c.status==='open'&&!!waitStart(c);
function foldersDef(){return role()==='agent'?[['mine','Meus'],['muted','Silenciados'],['all','Todos']]:[['mine','Meus'],['unassigned','Não atribuídos'],['team','Equipe'],['muted','Silenciados'],['all','Todos']]}
function inFolder(c,f){const M=mutedSet();return f==='mine'?c.status==='open'&&c.agentId===me:f==='unassigned'?c.status==='open'&&!c.agentId:f==='team'?c.status==='open'&&!!c.agentId&&c.agentId!==me:f==='muted'?M.has(c.id):true}
function passFilters(c){const F=IN.filt;
 if(F.lines.length&&!F.lines.includes(c.line))return false;
 if(F.status!=='any'&&c.status!==F.status)return false;
 if(F.agent&&!(c.agentId===F.agent||c.handled.includes(F.agent)))return false;
 if(F.lang&&c.customer.lang!==F.lang)return false;
 if(F.period==='today'&&new Date(c.createdAt).toDateString()!==new Date().toDateString())return false;
 if(F.period==='7d'&&now()-c.createdAt>7*864e5)return false;return true}
const filtCount=()=>{const F=IN.filt;return (F.lines.length?1:0)+(F.status!=='any'?1:0)+(F.agent?1:0)+(F.lang?1:0)+(F.period!=='any'?1:0)};
function matchQ(c,q){if(!q)return true;const d=q.replace(/^#/,'');
 if(q[0]==='#')return /^\d+$/.test(d)&&String(c.no??'').padStart(6,'0').includes(d);
 if(/^\d+$/.test(d)&&(String(c.no??'').padStart(6,'0').includes(d)||String(c.no)===String(Number(d))))return true;
 const s=q.toLowerCase();return c.customer.name.toLowerCase().includes(s)||(c.customer.phone||'').toLowerCase().includes(s)||(c.customer.pid||'').toLowerCase().includes(s)||c.msgs.some(m=>m.text&&m.from!=='system'&&m.text.toLowerCase().includes(s))}
function sortL(L){const k=IN.sort;return L.sort(k==='oldest'?(a,b)=>last(a).at-last(b).at:k==='wait'?(a,b)=>(waitStart(a)||1e15)-(waitStart(b)||1e15):(a,b)=>last(b).at-last(a).at)}
function listFor(f,qt,q){return db.chats.filter(c=>visible(c)&&(q?true:inFolder(c,f))&&passFilters(c)&&(qt==='unread'?unread(c)>0:qt==='pending'?pending(c):true)&&matchQ(c,q))}
function renderList(){const FD=foldersDef();if(!FD.some(x=>x[0]===IN.folder))IN.folder=FD[0][0];
 const q=$('#q').value.trim();
 $('#work').classList.toggle('fcol',IN.fc);
 $('#foldNav').innerHTML=FD.map(([k,l])=>{const n=db.chats.filter(c=>visible(c)&&inFolder(c,k)&&(k==='all'||k==='muted'?false:true)).length,u=db.chats.filter(c=>visible(c)&&inFolder(c,k)&&unread(c)>0).length;
  return `<button class="fi ${k===IN.folder&&!q?'on':''}" data-act="folder" data-f="${k}" title="${t(l)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FI_[k]}</svg><span class="fl">${t(l)}</span>${u?`<span class="fu">${u}</span>`:n?`<span class="fn">${n}</span>`:''}</button>`}).join('');
 const fs=$('#foldSel');fs.innerHTML=FD.map(([k,l])=>`<option value="${k}" ${k===IN.folder?'selected':''}>${t(l)}</option>`).join('');
 $('#tabs').innerHTML=[['all','Todos'],['unread','Não lidas'],['pending','Aguardando resposta']].map(([k,l])=>`<button data-act="qtab" data-t="${k}" class="${k===IN.qtab?'on':''}">${t(l)}<span>${listFor(IN.folder,k,q).length}</span></button>`).join('');
 const fc=filtCount();$('#fCnt').hidden=!fc;$('#fCnt').textContent=fc;$('#fBtn').classList.toggle('act',!!fc);
 const L=sortL(listFor(IN.folder,IN.qtab,q)),M=mutedSet();
 $('#listHead').innerHTML=q?`${t('Resultados da busca')} · ${L.length}`:'';$('#listHead').hidden=!q;
 $('#chatList').innerHTML=L.length?L.map(c=>{const m=last(c),a=c.agentId&&U(db,c.agentId),u=unread(c);
  return `<button class="ci ${c.id===sel?'on':''} ${u?'un':''}" data-act="open" data-id="${c.id}"><span class="av">${esc(ini(c.customer.name))}</span><span class="cm"><span class="r1"><b>${esc(c.customer.name)}</b><time>${hm(m.at)}</time></span><span class="r2">${m.file?esc(t('Anexo: {f}',{f:m.file.name})):m.from==='system'?esc(sysText(m)):esc(m.text)}${u?`<span class="ub">${u}</span>`:''}</span><span class="r3"><span class="cid">${cid(c)}</span>${tagL(c.line)}${c.status==='closed'?`<span class="wait">${t('Encerrado')}</span>`:''}${isBoss()&&a?esc(a.name):''}${M.has(c.id)?`<svg class="mi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${FI_.muted}</svg>`:''}${waitPill(c)}</span></span></button>`}).join('')
  :`<div class="empty">${q?t('Nenhum chat encontrado para “{q}”.',{q:esc(q)}):IN.qtab==='unread'?t('Nenhuma mensagem não lida.'):IN.qtab==='pending'?t('Nenhum cliente aguardando resposta.'):IN.folder==='mine'?t('Nenhum chat com você agora. Novos clientes chegam aqui automaticamente.'):IN.folder==='unassigned'?t('Fila vazia.'):IN.folder==='muted'?t('Nenhum chat silenciado.'):t('Nada por aqui.')}</div>`;
 if(IN.pop)renderPop2()}
function renderPop2(){const p=$('#fpop');if(!IN.pop){p.hidden=true;return}p.hidden=false;
 if(IN.pop==='more'){p.innerHTML=`<button class="mi2" data-act="readAll">${t('Marcar todas como lidas')}</button><div class="msep">${t('Ordenar')}</div>
  ${[['recent','Mais recentes'],['oldest','Mais antigas'],['wait','Maior espera']].map(([k,l])=>`<button class="mi2 ${IN.sort===k?'on':''}" data-act="sortBy" data-k="${k}">${t(l)}</button>`).join('')}
  <div class="msep"></div><button class="mi2" data-act="foldToggle">${IN.fc?t('Mostrar painel de pastas'):t('Recolher painel de pastas')}</button>`;return}
 const F=IN.filt,boss=isBoss(),ags=db.users;
 p.innerHTML=`<div class="fhd"><b>${t('Filtros')}</b><button class="btn" data-act="filtClear" style="min-height:32px;padding:4px 10px;font-size:13px">${t('Limpar filtros')}</button></div>
 <div class="fgrp"><span>${t('Linhas')}</span><div class="chk">${LINES().map(l=>`<label><input type="checkbox" name="ffL" value="${esc(l)}" ${F.lines.includes(l)?'checked':''}> ${tagL(l)}</label>`).join('')}</div></div>
 <label class="f">${t('Status')}<select id="ffS"><option value="any">${t('Todos')}</option><option value="open" ${F.status==='open'?'selected':''}>${t('Em aberto')}</option><option value="closed" ${F.status==='closed'?'selected':''}>${t('Encerrados')}</option></select></label>
 ${boss?`<label class="f">${t('Agente')}<select id="ffA"><option value="">${t('Todos')}</option>${ags.map(u=>`<option value="${u.id}" ${F.agent===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></label>`:''}
 <label class="f">${t('Idioma do cliente')}<select id="ffG"><option value="">${t('Todos')}</option>${WL.map(k=>`<option value="${k}" ${F.lang===k?'selected':''}>${LANGS.find(l=>l[0]===k)[1]}</option>`).join('')}</select></label>
 <label class="f">${t('Período')}<select id="ffP"><option value="any">${t('Todos')}</option><option value="today" ${F.period==='today'?'selected':''}>${t('Hoje')}</option><option value="7d" ${F.period==='7d'?'selected':''}>${t('Últimos 7 dias')}</option></select></label>`}
function markRead(c){if(!c||unread(c)===0)return false;const d=load()||db,u=U(d,me);if(!u)return;u.read=u.read||{};u.read[c.id]=now();save(d);db=d;return true}
Object.assign(A,{
 folder:b=>{IN.folder=b.dataset.f;IN.qtab='all';const q=$('#q');if(q.value){q.value=''}renderList()},
 qtab:b=>{IN.qtab=b.dataset.t;renderList()},
 filters:()=>{IN.pop=IN.pop==='filters'?null:'filters';renderPop2()},
 more:()=>{IN.pop=IN.pop==='more'?null:'more';renderPop2()},
 filtClear:()=>{IN.filt={lines:[],status:'any',agent:'',lang:'',period:'any'};renderList()},
 sortBy:b=>{IN.sort=b.dataset.k;IN.pop=null;renderPop2();renderList()},
 foldToggle:()=>{IN.fc=!IN.fc;try{localStorage.setItem('sac_fold',IN.fc?'1':'0')}catch(e){}IN.pop=null;renderPop2();renderList()},
 readAll:()=>{const d=load()||db,u=U(d,me);u.read=u.read||{};for(const c of d.chats)if(visible(c))u.read[c.id]=now();save(d);db=d;IN.pop=null;renderPop2();renderList();toast(t('Todas marcadas como lidas.'))},
 mute:()=>{const id=sel;tx(d=>{const u=U(d,me);u.muted=u.muted||[];u.muted=u.muted.includes(id)?u.muted.filter(x=>x!==id):[...u.muted,id]});toast(mutedSet().has(id)?t('Chat silenciado.'):t('Som do chat reativado.'))},
 copyId:b=>{const v=b.dataset.v;try{navigator.clipboard.writeText(v).then(()=>toast(t('ID copiado: {v}',{v})),()=>toast(v))}catch(e){toast(v)}}
});
document.addEventListener('change',e=>{const id=e.target.id;
 if(id==='foldSel'){IN.folder=e.target.value;IN.qtab='all';renderList();return}
 if(e.target.name==='ffL'){IN.filt.lines=[...document.querySelectorAll('[name=ffL]:checked')].map(x=>x.value);renderList()}
 if(id==='ffS'){IN.filt.status=e.target.value;renderList()}if(id==='ffA'){IN.filt.agent=e.target.value;renderList()}
 if(id==='ffG'){IN.filt.lang=e.target.value;renderList()}if(id==='ffP'){IN.filt.period=e.target.value;renderList()}});
document.addEventListener('click',e=>{if(IN.pop&&!e.target.closest('#fpop')&&!e.target.closest('[data-act=filters]')&&!e.target.closest('[data-act=more]')){IN.pop=null;renderPop2()}},true);


A.info=()=>{const c=db.chats.find(x=>x.id===sel);if(c)modal(`<div class="info" style="display:block;border:0;padding:0">${infoHtml(c)}</div><div class="mact"><button class="btn" data-act="mclose">${t('Fechar')}</button></div>`)};

/* ---------- agent availability, chat limit, notifications ---------- */
const paused=(d,u)=>!!(u&&d.sessions[u.id]&&d.sessions[u.id].pause);
const freeAgents=(d,line,ex)=>onAgents(d,line,ex).filter(u=>!paused(d,u));
const NT={cnt:{},init:false};
const nsoundPref=()=>{try{return localStorage.getItem('sac_nsound')!=='0'}catch(e){return true}};
function notifyTick(d){if(!me)return 0;const u=U(d,me);if(!u)return 0;const M=new Set(u.muted||[]);let ring=false,um=0;
 for(const c of d.chats){if(c.status!=='open'||c.agentId!==me)continue;const n=c.msgs.filter(m=>m.from==='customer').length,prev=NT.cnt[c.id];
  const looking=sel===c.id&&view==='atendimento'&&document.visibilityState==='visible'&&document.hasFocus();
  if(NT.init&&!M.has(c.id)&&!looking&&(prev===undefined||n>prev)){ring=true;if(prev!==undefined)toast(t('Nova mensagem de {n}',{n:c.customer.name}))}
  NT.cnt[c.id]=n;if(!M.has(c.id))um+=unread(c)}
 NT.init=true;if(ring&&nsoundPref())beep(1);return um}
function renderStatus(){const b=$('#stBtn');if(!b)return;const u=ME();b.hidden=!u;if(b.hidden)return;const p=paused(db,u);
 b.classList.toggle('pz',p);b.title=p?t('Em pausa'):t('Disponível');b.setAttribute('aria-label',t('Alterar status')+': '+b.title)}
Object.assign(A,{
 pauseToggle:()=>{let p;tx(d=>{const s=d.sessions[me];if(s){s.pause=!s.pause;p=s.pause}maintain(d)});toast(p?t('Você está em pausa: não recebe chats novos.'):t('Você está disponível para novos chats.'))},
 nsToggle:()=>{const on=!nsoundPref();try{localStorage.setItem('sac_nsound',on?'1':'0')}catch(e){}if(on){audioOn();setTimeout(()=>beep(1),80)}renderNs()},
 nsTest:()=>{audioOn();setTimeout(()=>beep(1),80)}
});
function renderNs(){const b=$('#nsBox');if(!b)return;const on=nsoundPref();
 b.innerHTML=on?`<span class="snd on">${t('Som ativado')}</span><button class="btn" data-act="nsTest" type="button">${t('Testar som')}</button><button class="btn" data-act="nsToggle" type="button">${t('Desativar som')}</button>`
 :`<span class="snd">${t('Som desativado')}</span><button class="btn pri" data-act="nsToggle" type="button">${t('Ativar som')}</button>`}
F.fMax=()=>{if(!isTop())return;const v=Math.max(0,Math.min(50,parseInt($('#cfgM').value)||0));tx(d=>{d.cfg.maxChats=v;maintain(d)});$('#cfgM').blur();toast(v?t('Limite de chats: {n}.',{n:v}):t('Sem limite'))};
document.addEventListener('pointerdown',()=>{if(me&&nsoundPref()&&(!AL.ac||AL.ac.state!=='running'))audioOn()},true);

A.askLogout=()=>modal(`<h2>${t('Sair do SAC?')}</h2><p class="mute">${t('Seus chats abertos ficam com você por alguns segundos e depois vão para outro agente disponível.')}</p><div class="mact"><button class="btn" data-act="mclose">${t('Cancelar')}</button><button class="btn pri" data-act="logout">${t('Sair')}</button></div>`);
