/* ---------- integration guide (god/admin) ---------- */
const FI=['<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',IC.chat,'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>','<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/>'];
/* ---------- demo game site + customer widget (mobile first) ---------- */
const WL=['vi','ur','en','zh'];
const wDetect=()=>{try{const v=localStorage.getItem('sac_wlang');if(WL.includes(v))return v}catch(e){}return null};
const W={line:null,mem:{},seen:0,open:false,lang:wDetect(),pend:null,picking:false};
const wl=()=>W.lang||'en';
const wt=(k,p)=>t(k,p,wl());
const wloc=()=>LANGS.find(l=>l[0]===wl())[2];
const whm=x=>new Date(x).toLocaleTimeString(wloc(),{hour:'2-digit',minute:'2-digit'});
const siteLine=()=>{const m=location.hash.match(/^#site-([A-Za-z0-9-]{2,20})$/);return m?m[1]:null};
function wGet(){try{return sessionStorage.getItem('sac_w_'+W.line)}catch(e){return W.mem[W.line]}}
function wSet(v){W.mem[W.line]=v;try{v?sessionStorage.setItem('sac_w_'+W.line,v):sessionStorage.removeItem('sac_w_'+W.line)}catch(e){}}
const TILES=[['Corrida Turbo','Corrida','#3dd6c4','#1b6f8a','<path d="M4 15h16l-2-5H6zM7 18a1.5 1.5 0 1 0 0-3M17 18a1.5 1.5 0 1 0 0-3" stroke="#fff" stroke-width="2" fill="none"/>'],['Reino das Cartas','Cartas','#ffb35c','#a3402a','<rect x="5" y="4" width="10" height="14" rx="2" stroke="#fff" stroke-width="2" fill="none"/><rect x="9" y="7" width="10" height="14" rx="2" stroke="#fff" stroke-width="2" fill="#ffffff22"/>'],['Pesca Profunda','Arcade','#5c9dff','#2a2fa3','<path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0zM17 12l4-3v6z" stroke="#fff" stroke-width="2" fill="none"/>'],['Torre de Blocos','Puzzle','#c77dff','#4b2a8a','<path d="M6 18h12M8 18v-5h8v5M10 13V8h4v5" stroke="#fff" stroke-width="2" fill="none"/>'],['Liga dos Pênaltis','Esportes','#7be08a','#1f6b45','<circle cx="12" cy="12" r="7" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 8l3 2-1 4h-4l-1-4z" fill="#fff"/>'],['Estrela Cadente','Arcade','#ff7aa8','#8a2a55','<path d="M12 3l2.5 6 6.5.5-5 4 1.5 6.5L12 16l-5.5 4 1.5-6.5-5-4 6.5-.5z" stroke="#fff" stroke-width="2" fill="none"/>'],['Xadrez Relâmpago','Tabuleiro','#e8e8e8','#45464d','<path d="M8 20h8M9 17h6l-1-6h-4zM10 11l-1-3 3-4 3 4-1 3" stroke="#fff" stroke-width="2" fill="none"/>'],['Missão Lunar','Aventura','#ffd25c','#8a5b1a','<circle cx="12" cy="12" r="6" stroke="#fff" stroke-width="2" fill="none"/><circle cx="10" cy="10" r="1.5" fill="#fff"/><circle cx="14" cy="14" r="1" fill="#fff"/>']];
const WI={globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
 down:'<path d="M6 9l6 6 6-6"/>',clip:'<path d="M20 11.5 12.3 19a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/>',send:'<path d="M4 12l16-8-6 16-2.5-6.5z"/>',end:'<path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'};
const wsvg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${WI[k]}</svg>`;
const PICKT={vi:'Chọn ngôn ngữ',ur:'Zaban chunen',en:'Choose your language',zh:'选择语言'};

function buildSite(){const l=W.line,L=LN(l),hc=(COL[L?.color]||COL.stone)[2];
 const keep={n:$('#wName')?.value||'',p:$('#wPid')?.value||'',f:$('#wFirst')?.value||'',x:$('#wTxt')?.value||''};
 document.documentElement.lang=wloc();
 $('#site').className='';
 $('#site').innerHTML=`<div class="simbar">${wt('Simulação: site de jogos fictício na linha {l}. O chat chega no SAC em tempo real.',{l:`<b>${esc(l)}</b>`})} <a href="#" data-act="backSac">${wt('Voltar ao SAC')}</a></div>
 <header class="sh"><div class="brand"><i style="background:linear-gradient(135deg,${hc},#3dd6c4)"></i>${esc(L?L.name:l)}</div><nav><b>${wt('Início')}</b><span>${wt('Jogos')}</span><span>${wt('Torneios')}</span><span>${wt('Ranking')}</span><span>${wt('Minha conta')}</span></nav><div class="pl"><span>JD</span>jogador_demo</div></header>
 <section class="hero" style="background:linear-gradient(120deg,${hc},#11163a 65%)"><span class="orb" style="width:260px;height:260px;right:-40px;top:-60px;background:#ffffff18"></span><span class="orb" style="width:140px;height:140px;right:180px;bottom:-50px;background:#ffffff10"></span><h2>${wt('Torneio de fim de semana')}</h2><p>${wt('Site de demonstração. Clique no balão no canto da tela para falar com o suporte.')}</p></section>
 <div class="sect">${wt('Jogos em destaque')}</div>
 <div class="tiles">${TILES.map(x=>`<div class="tile" style="background:linear-gradient(160deg,${x[2]},${x[3]})"><svg viewBox="0 0 24 24">${x[4]}</svg>${wt(x[0])}<small>${wt(x[1])}</small></div>`).join('')}</div>
 <button class="wb" data-act="wToggle" aria-label="${wt('Abrir suporte')}" ${W.open?'hidden':''}>${svg('chat')}<span class="cnt" id="wCnt" hidden></span></button>
 <div class="wp" id="wp" ${W.open?'':'hidden'} role="dialog" aria-modal="true" aria-label="${wt('Suporte')}">
  <div class="wh"><span class="av" style="background:var(--mint);color:var(--mintInk)">S</span><div class="wt"><b>${wt('Suporte')}</b><span id="wStatus"></span></div>
   <button class="wib" data-act="wPick" aria-label="${wt('Idioma')}" title="${wt('Idioma')}">${wsvg('globe')}<em>${wl().toUpperCase()}</em></button>
   <button class="wib" id="wEndBtn" data-act="wAskEnd" aria-label="${wt('Encerrar conversa')}" title="${wt('Encerrar conversa')}" hidden>${wsvg('end')}</button>
   <button class="wib" data-act="wToggle" aria-label="${wt('Fechar')}">${wsvg('down')}</button></div>
  <div class="wconf" id="wConf" hidden><div><b>${wt('Encerrar esta conversa?')}</b><p>${wt('Você pode abrir uma nova conversa quando quiser.')}</p>
   <div class="wconfb"><button class="wgo ghost" data-act="wNoEnd">${wt('Cancelar')}</button><button class="wgo bad" data-act="wDoEnd">${wt('Encerrar')}</button></div></div></div>
  <div class="wlang" id="wLang" hidden><h3 lang="mul">${WL.map(k=>PICKT[k]).join(' · ')}</h3>
   ${WL.map(k=>{const x=LANGS.find(y=>y[0]===k);return `<button class="wlb ${k===W.lang?'on':''}" data-act="wSetLang" data-l="${k}" lang="${x[2]}"><b>${x[1]}</b><span>${t('Iniciar conversa',null,k)}</span></button>`}).join('')}</div>
  <form class="wstart" id="wStart"><p class="wlead">${wt('Olá! Conte o que aconteceu e um atendente responde por aqui.')}</p>
   <label class="f">${wt('Seu nome')}<input id="wName" required autocomplete="name" enterkeyhint="next" value="${esc(keep.n)}"></label>
   <label class="f">${wt('ID do jogador')}<input id="wPid" placeholder="${wt('Opcional')}" autocomplete="off" enterkeyhint="next" value="${esc(keep.p)}"></label>
   <label class="f">${wt('Mensagem')}<textarea id="wFirst" rows="3" required enterkeyhint="send">${esc(keep.f)}</textarea></label>
   <button class="wgo">${wt('Iniciar conversa')}</button></form>
  <div class="wbody" id="wMsgs" hidden aria-live="polite"></div>
  <div id="wAtt"></div>
  <div class="wf" id="wComp" hidden><label class="wib dark" aria-label="${wt('Enviar imagem ou arquivo')}" title="${wt('Enviar imagem ou arquivo')}">${wsvg('clip')}<input type="file" id="wFile" hidden></label>
   <textarea id="wTxt" rows="1" placeholder="${wt('Escreva sua mensagem')}" enterkeyhint="send">${esc(keep.x)}</textarea>
   <button class="wsend" data-act="wSend" aria-label="${wt('Enviar')}">${wsvg('send')}</button></div>
  <div class="wend" id="wEnd" hidden><span id="wEndTxt"></span><button class="wgo" data-act="wNew">${wt('Nova conversa')}</button></div>
 </div>`;wLock()}
function wLock(){document.body.classList.toggle('wlock',W.open&&innerWidth<=600)}
function openSite(l){if(!LN(l)){$('#login').hidden=true;$('#app').hidden=true;$('#site').hidden=false;$('#site').innerHTML=`<div class="empty" style="padding:80px 20px;color:#fff">${wt('Linha não encontrada.')} <a href="#" data-act="backSac" style="color:var(--mint)">${wt('Voltar ao SAC')}</a></div>`;W.line=null;return}
 W.line=l;$('#login').hidden=true;$('#app').hidden=true;document.title=(LN(l)?.name||l)+' demo';buildSite();$('#site').hidden=false;const c=curW();W.seen=c?c.msgs.filter(m=>m.from==='agent').length:0;renderW()}
function closeSite(){W.line=null;W.open=false;wLock();$('#site').hidden=true;document.title='SAC';document.documentElement.lang=loc();const s=getSid(),d=load();if(d)db=d;if(s&&db&&U(db,s)){me=s;enter()}else showLogin()}
function curW(){const id=wGet(),d=load()||db;return id&&d?d.chats.find(x=>x.id===id):null}
function renderW(){if(!W.line||!$('#wp'))return;const d=load()||db;db=d;const c=curW(),n=freeAgents(d,W.line).length,pick=!W.lang||W.picking;
 $('#wLang').hidden=!pick;$('#wStart').hidden=pick||!!c;$('#wMsgs').hidden=pick||!c;$('#wComp').hidden=pick||!(c&&c.status==='open');$('#wEnd').hidden=pick||!(c&&c.status==='closed');$('#wAtt').hidden=pick;
 $('#wEndBtn').hidden=pick||!(c&&c.status==='open');if(!(c&&c.status==='open'))W.conf=false;$('#wConf').hidden=!W.conf;
 if(c&&c.status==='closed')$('#wEndTxt').textContent=c.closedBy==='customer'?wt('Você encerrou a conversa.')+' '+wt('Você pode abrir uma nova conversa quando quiser.'):wt('Atendimento encerrado. Obrigado pelo contato!');
 const a=c&&c.status==='open'&&c.agentId&&U(d,c.agentId);
 $('#wStatus').textContent=a?wt('Falando com {n}',{n:a.name}):c&&c.status==='open'?wt('Aguardando um atendente…'):n>1?wt('{n} atendentes online',{n}):n===1?wt('1 atendente online'):wt('Deixe sua mensagem, respondemos em breve');
 const ag=c?c.msgs.filter(m=>m.from==='agent').length:0;
 if(W.open)W.seen=ag;$('#wCnt').hidden=W.open||ag<=W.seen;$('#wCnt').textContent=ag-W.seen;
 if(!c)return;const box=$('#wMsgs'),k=wl()+':'+c.id+':'+c.msgs.length+':'+(c.agentId||'');if(box.dataset.k===k)return;box.dataset.k=k;
 box.innerHTML=c.msgs.filter(m=>m.from!=='system').map(m=>{const by=m.from==='agent'&&U(d,m.by);
  return `<div class="wm ${m.from==='customer'?'p':''}">${m.file?(m.file.type.startsWith('image/')?`<img src="${m.file.data}" alt="${esc(m.file.name)}">`:`<div class="wfile">${wsvg('clip')}${esc(m.file.name)}</div>`):''}${m.text?esc(m.text):''}<small>${by?esc(by.name)+' · ':''}${whm(m.at)}</small></div>`}).join('')
  +(c.status==='open'&&!c.agentId?`<div class="wsys">${wt('Você está na fila. Um atendente vai falar com você em instantes.')}</div>`:'');
 box.scrollTop=box.scrollHeight}
function wGrow(){const x=$('#wTxt');if(!x)return;x.style.height='auto';x.style.height=Math.min(x.scrollHeight,120)+'px'}
function wSend(){const m=$('#wTxt').value.trim(),c=curW();if((!m&&!W.pend)||!c||c.status!=='open')return;const d=load()||db;const x=d.chats.find(y=>y.id===c.id);
 x.msgs.push({id:uid(),from:'customer',text:m,file:W.pend||undefined,at:now()});if(!x.waiting)x.waiting=now();if(!x.custWait)x.custWait=now();maintain(d);save(d);db=d;$('#wTxt').value='';W.pend=null;$('#wAtt').innerHTML='';wGrow();renderW();$('#wTxt').focus()}
function wStart(){const d=load()||db,id=uid();
 const c={id,no:nextNo(d),line:W.line,source:'site',customer:{name:$('#wName').value.trim(),phone:'',pid:$('#wPid').value.trim(),lang:wl()},status:'open',agentId:null,handled:[],createdAt:now(),waiting:now(),custWait:now(),transfers:0,msgs:[]};
 c.msgs.push({id:uid(),from:'customer',text:$('#wFirst').value.trim(),at:now()});sys(c,'Cliente entrou pelo site, linha {l}.',{l:c.line});d.chats.push(c);maintain(d);save(d);db=d;wSet(id);$('#wFirst').value='';renderW();$('#wTxt').focus()}
Object.assign(A,{
 wToggle:()=>{W.open=!W.open;$('#wp').hidden=!W.open;document.querySelector('.wb').hidden=W.open;wLock();renderW();if(W.open&&innerWidth>600){const f=!$('#wStart').hidden?$('#wName'):!$('#wComp').hidden?$('#wTxt'):null;f&&f.focus()}},
 wSend,
 wNew:()=>{wSet(null);W.seen=0;W.pend=null;W.conf=false;$('#wMsgs').dataset.k='';$('#wMsgs').innerHTML='';['wName','wPid','wFirst','wTxt'].forEach(i=>{const x=$('#'+i);if(x)x.value=''});$('#wAtt').innerHTML='';renderW();if(innerWidth>600)$('#wName').focus()},
 wAskEnd:()=>{W.conf=true;renderW()},
 wNoEnd:()=>{W.conf=false;renderW()},
 wDoEnd:()=>{const c=curW();W.conf=false;if(c){const d=load()||db,x=d.chats.find(y=>y.id===c.id);if(x&&x.status==='open'){x.status='closed';x.closedAt=now();x.closedBy='customer';x.closeReason='';x.waiting=null;x.custWait=null;sys(x,'Encerrado pelo cliente.');save(d);db=d}}W.pend=null;$('#wAtt').innerHTML='';renderW()},
 wPick:()=>{W.picking=!W.picking||!W.lang;renderW()},
 wSetLang:b=>{W.lang=b.dataset.l;W.picking=false;try{localStorage.setItem('sac_wlang',W.lang)}catch(e){}
  const c=curW();if(c){const d=load()||db,x=d.chats.find(y=>y.id===c.id);if(x){x.customer.lang=W.lang;save(d);db=d}}
  const box=$('#wMsgs');buildSite();if(box)$('#wMsgs').dataset.k='';renderW()},
 wRmAtt:()=>{W.pend=null;$('#wAtt').innerHTML=''},
 backSac:()=>{history.replaceState(null,'',location.pathname+location.search);closeSite()}
});
F.wStart=()=>wStart();
document.addEventListener('input',e=>{if(e.target.id==='wTxt')wGrow()});
document.addEventListener('change',e=>{if(e.target.id!=='wFile')return;const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>1.5*1024*1024)return toast(wt('Arquivo acima de 1,5 MB. Neste protótipo os anexos ficam no navegador.'));
 const r=new FileReader();r.onload=()=>{W.pend={name:f.name,type:f.type||'application/octet-stream',size:f.size,data:r.result};
  $('#wAtt').innerHTML=`<div class="watt">${f.type.startsWith('image/')?`<img src="${r.result}" alt="">`:wsvg('clip')}<span>${esc(f.name)}</span><button class="wib dark" data-act="wRmAtt" aria-label="${wt('Remover anexo')}">${X}</button></div>`};r.readAsDataURL(f)});
addEventListener('hashchange',()=>{const l=siteLine();if(l)openSite(l);else if(W.line)closeSite()});
addEventListener('resize',()=>{if(W.line)wLock()});
if(window.visualViewport){const vv=()=>{document.documentElement.style.setProperty('--wvh',visualViewport.height+'px');const b=$('#wMsgs');if(b&&W.open)b.scrollTop=b.scrollHeight};visualViewport.addEventListener('resize',vv);vv()}

/* ---------- live sync ---------- */
addEventListener('storage',e=>{
 if(e.key===K){db=load();if(W.line)renderW();else render()}});
setInterval(()=>{if(NET||!me||W.line)return;const d=load();if(!d)return;const u=U(d,me),s=d.sessions[me];
 if(!u){db=d;return logout(t('Seu acesso foi removido.'))}
 if(s&&s.kick){s.kick=false;s.on=false;save(d);me=null;setSid(null);sel=null;mclose();return showLogin(t('Você foi desconectado por um supervisor.'))}
 d.sessions[me]={...(d.sessions[me]||{}),on:true,lastSeen:now(),kick:false};maintain(d);save(d);db=d;render()},5000);
setInterval(()=>{if(W.line){renderW();return}if(!me)return;const d=load();if(!d)return;if(!NET&&maintain(d))save(d);db=d;const _n=alertTick(d)+notifyTick(d);document.title=_n?`(${_n}) SAC`:'SAC';if(view==='atendimento')renderList();if(view==='alertas')renderAlerts()},1000);

if(!NET)(async()=>{db=load();if(!db){db={v:1,users:[{id:'god',name:'Acesso Total',email:'god@sac.local',pass:await hash('Sac@2026'),role:'god',lines:DEFLINES.map(l=>l.id),createdAt:now()}],sessions:{},chats:[],scripts:[],chatSeq:-1,cfg:{timeout:240,alert:300},lines:DEFLINES.map(l=>({...l}))};save(db)}
 if(!db.lines){db.lines=DEFLINES.map(l=>({...l}));save(db)}
 if(!db.cfg.alert){db.cfg.alert=300;save(db)}
 if(db.chatSeq===undefined){[...db.chats].sort((x,y)=>x.createdAt-y.createdAt).forEach((c,i)=>c.no=i);db.chatSeq=db.chats.length-1;save(db)}
 document.documentElement.lang=loc();
 const sl=siteLine();if(sl)return openSite(sl);
 const s=getSid();if(s&&U(db,s)){me=s;const d=load()||db;d.sessions[me]={...(d.sessions[me]||{}),on:true,lastSeen:now(),kick:false};save(d);db=d;known=new Set(d.chats.filter(c=>c.agentId===me).map(c=>c.id));enter()}else showLogin()})();
const stackObs=new MutationObserver(()=>{for(const c of document.querySelectorAll('.stack td:not([data-l])')){let i=0,p=c;while(p=p.previousElementSibling)i+=p.colSpan;c.dataset.l=c.closest('table').rows[0].cells[i]?.textContent||''}});
stackObs.observe(document.body,{childList:true,subtree:true});
