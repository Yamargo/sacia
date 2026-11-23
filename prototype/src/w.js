/* ---------- customer chat window (runs inside the widget iframe) ---------- */
const $=s=>document.querySelector(s);
const LANGS=[['pt','Português','pt-BR'],['en','English','en-US'],['vi','Tiếng Việt','vi-VN'],['ur','Roman Urdu','en-GB'],['zh','中文','zh-CN']];
const WL=['vi','ur','en','zh'];
const D={};LANGS.slice(1).forEach(([k],i)=>{D[k]={};for(const r of ROWS)if(r[i+1])D[k][r[0]]=r[i+1]});
const P=new URLSearchParams(location.search);
const LINE=(P.get('line')||'').replace(/[^A-Za-z0-9-]/g,'');
const FIXED=WL.includes(P.get('lang'))?P.get('lang'):null;
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const W={lang:FIXED||(WL.includes(ls.get('sac_wlang'))?ls.get('sac_wlang'):null),picking:false,conf:false,pend:null,open:false,seen:-1,player:null,st:null,ws:null,seq:0,wait:new Map(),retry:0,skew:0,lastK:''};
const wl=()=>W.lang||'en';
const t=(k,p,L=wl())=>{let s=(L!=='pt'&&D[L]&&D[L][k])||k;if(p)for(const x in p)s=s.split('{'+x+'}').join(p[x]);return s};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hm=x=>new Date(x-W.skew).toLocaleTimeString(LANGS.find(l=>l[0]===wl())[2],{hour:'2-digit',minute:'2-digit'});
const TOK='sac_tok_'+LINE;
const I={globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',down:'<path d="M6 9l6 6 6-6"/>',clip:'<path d="M20 11.5 12.3 19a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3"/>',send:'<path d="M4 12l16-8-6 16-2.5-6.5z"/>',end:'<path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>'};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;
const PICKT={vi:'Chọn ngôn ngữ',ur:'Zaban chunen',en:'Choose your language',zh:'选择语言'};
const toParent=m=>{try{parent.postMessage({sac:1,...m},'*')}catch(e){}};
let tt;function toast(m){const x=$('#toast');x.textContent=m;x.hidden=false;clearTimeout(tt);tt=setTimeout(()=>x.hidden=true,3200)}

function build(){const k={n:$('#wName')?.value||W.player?.nome||'',p:$('#wPid')?.value||W.player?.id||'',f:$('#wFirst')?.value||'',x:$('#wTxt')?.value||''};
 document.documentElement.lang=LANGS.find(l=>l[0]===wl())[2];
 $('#app').innerHTML=`<div class="wh"><span class="av">S</span><div class="wt"><b>${t('Suporte')}</b><span id="wStatus"></span></div>
  ${FIXED?'':`<button class="wib" data-act="pick" aria-label="${t('Idioma')}" title="${t('Idioma')}">${ic('globe')}<em>${wl().toUpperCase()}</em></button>`}
  <button class="wib" id="wEndBtn" data-act="askEnd" aria-label="${t('Encerrar conversa')}" title="${t('Encerrar conversa')}" hidden>${ic('end')}</button>
  <button class="wib" data-act="close" aria-label="${t('Fechar')}">${ic('down')}</button></div>
 <div class="wconf" id="wConf" hidden><div><b>${t('Encerrar esta conversa?')}</b><p>${t('Você pode abrir uma nova conversa quando quiser.')}</p>
  <div class="wconfb"><button class="wgo ghost" data-act="noEnd">${t('Cancelar')}</button><button class="wgo bad" data-act="doEnd">${t('Encerrar')}</button></div></div></div>
 <div class="wlang" id="wLang" hidden><h3>${WL.map(x=>PICKT[x]).join(' · ')}</h3>
  ${WL.map(x=>{const L=LANGS.find(y=>y[0]===x);return `<button class="wlb ${x===W.lang?'on':''}" data-act="setLang" data-l="${x}" lang="${L[2]}"><b>${L[1]}</b><span>${t('Iniciar conversa',null,x)}</span></button>`}).join('')}</div>
 <form class="wstart" id="wStart"><p class="wlead">${t('Olá! Conte o que aconteceu e um atendente responde por aqui.')}</p>
  <label class="f">${t('Seu nome')}<input id="wName" required maxlength="80" autocomplete="name" enterkeyhint="next" value="${esc(k.n)}"></label>
  <label class="f">${t('ID do jogador')}<input id="wPid" maxlength="80" placeholder="${t('Opcional')}" autocomplete="off" enterkeyhint="next" value="${esc(k.p)}"></label>
  <label class="f">${t('Mensagem')}<textarea id="wFirst" rows="3" required maxlength="4000" enterkeyhint="send">${esc(k.f)}</textarea></label>
  <button class="wgo">${t('Iniciar conversa')}</button></form>
 <div class="wbody" id="wMsgs" hidden aria-live="polite"></div><div id="wAtt"></div>
 <div class="wf" id="wComp" hidden><label class="wib dark" aria-label="${t('Enviar imagem ou arquivo')}" title="${t('Enviar imagem ou arquivo')}">${ic('clip')}<input type="file" id="wFile" hidden></label>
  <textarea id="wTxt" rows="1" maxlength="4000" placeholder="${t('Escreva sua mensagem')}" enterkeyhint="send">${esc(k.x)}</textarea>
  <button class="wsend" data-act="send" aria-label="${t('Enviar')}">${ic('send')}</button></div>
 <div class="wend" id="wEnd" hidden><span id="wEndTxt"></span><button class="wgo" data-act="new">${t('Nova conversa')}</button></div>
 <div class="wnet" id="wNet" hidden>${t('Sem conexão com o servidor. Tentando reconectar…')}</div>`;
 W.lastK='';render()}

function render(){const s=W.st;if(!$('#wLang'))return;const c=s&&s.chat,pick=!W.lang||W.picking;
 $('#wLang').hidden=!pick;$('#wStart').hidden=pick||!!c;$('#wMsgs').hidden=pick||!c;$('#wComp').hidden=pick||!(c&&c.status==='open');$('#wEnd').hidden=pick||!(c&&c.status==='closed');$('#wAtt').hidden=pick;
 $('#wEndBtn').hidden=pick||!(c&&c.status==='open');if(!(c&&c.status==='open'))W.conf=false;$('#wConf').hidden=!W.conf;
 if(c&&c.status==='closed')$('#wEndTxt').textContent=c.closedBy==='customer'?t('Você encerrou a conversa.')+' '+t('Você pode abrir uma nova conversa quando quiser.'):t('Atendimento encerrado. Obrigado pelo contato!');
 const n=s?s.online:0;
 $('#wStatus').textContent=s&&!s.exists?t('Linha não encontrada.'):c&&c.status==='open'&&c.agent?t('Falando com {n}',{n:c.agent}):c&&c.status==='open'?t('Aguardando um atendente…'):n>1?t('{n} atendentes online',{n}):n===1?t('1 atendente online'):t('Deixe sua mensagem, respondemos em breve');
 const ag=c?c.msgs.filter(m=>m.from==='agent').length:0;
 if(W.seen<0||W.open)W.seen=ag;toParent({type:'unread',n:Math.max(0,ag-W.seen)});
 if(!c)return;const box=$('#wMsgs'),k=wl()+':'+c.id+':'+c.msgs.length+':'+c.status+':'+(c.agent||'');if(W.lastK===k)return;W.lastK=k;
 box.innerHTML=c.msgs.map(m=>`<div class="wm ${m.from==='customer'?'p':''}">${m.file?(m.file.type.startsWith('image/')?`<a href="${esc(m.file.data)}" target="_blank" rel="noopener"><img src="${esc(m.file.data)}" alt="${esc(m.file.name)}"></a>`:`<a class="wfile" href="${esc(m.file.data)}" target="_blank" rel="noopener">${ic('clip')}${esc(m.file.name)}</a>`):''}${m.text?esc(m.text):''}<small>${m.by?esc(m.by)+' · ':''}${hm(m.at)}</small></div>`).join('')
  +(c.status==='open'&&c.queue?`<div class="wsys">${t('Você está na fila. Um atendente vai falar com você em instantes.')}</div>`:'');
 box.scrollTop=box.scrollHeight}

function connect(){const tok=ls.get(TOK)||'';const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/wsc?line='+encodeURIComponent(LINE)+(tok?'&token='+encodeURIComponent(tok):''));W.ws=ws;
 ws.onopen=()=>{W.retry=0;const n=$('#wNet');if(n)n.hidden=true};
 ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
  if(m.t==='cstate'){W.st=m.state;W.skew=m.state.serverNow-Date.now();if(tok&&!m.state.chat)ls.set(TOK,null);render();return}
  if(m.t==='res'){const w=W.wait.get(m.id);if(!w)return;W.wait.delete(m.id);m.ok?w.res(m.data):w.rej({key:m.error,params:m.params})}};
 ws.onclose=ev=>{for(const w of W.wait.values())w.rej({key:'Sem conexão com o servidor. Tentando reconectar…'});W.wait.clear();if(ev.code===4900)return;const n=$('#wNet');if(n)n.hidden=false;setTimeout(connect,Math.min(10000,1000*2**W.retry++))}}
function cmd(name,args){return new Promise((res,rej)=>{if(!W.ws||W.ws.readyState!==1)return rej({key:'Sem conexão com o servidor. Tentando reconectar…'});const id=++W.seq;W.wait.set(id,{res,rej});W.ws.send(JSON.stringify({t:'cmd',id,cmd:name,args}))})}
async function run(name,args){try{return (await cmd(name,args))||true}catch(e){toast(t(e.key||'Erro interno.',e.params));return null}}
function grow(){const x=$('#wTxt');if(!x)return;x.style.height='auto';x.style.height=Math.min(x.scrollHeight,120)+'px'}
async function send(){const m=$('#wTxt').value.trim(),c=W.st&&W.st.chat;if((!m&&!W.pend)||!c||c.status!=='open')return;const file=W.pend;$('#wTxt').value='';W.pend=null;$('#wAtt').innerHTML='';grow();
 if(!(await run('send',{text:m,file}))&&m)$('#wTxt').value=m;$('#wTxt').focus()}

const A={
 close:()=>toParent({type:'close'}),
 pick:()=>{W.picking=!W.picking||!W.lang;render()},
 setLang:b=>{W.lang=b.dataset.l;W.picking=false;ls.set('sac_wlang',W.lang);if(W.st&&W.st.chat)run('lang',{lang:W.lang});build()},
 send,
 askEnd:()=>{W.conf=true;render()},noEnd:()=>{W.conf=false;render()},
 doEnd:async()=>{W.conf=false;await run('end',{});render()},
 new:()=>{ls.set(TOK,null);W.st={...W.st,chat:null};W.seen=-1;W.pend=null;['wName','wPid','wFirst','wTxt'].forEach(i=>{const x=$('#'+i);if(x)x.value=''});
  if(W.player){$('#wName').value=W.player.nome||'';$('#wPid').value=W.player.id||''}$('#wAtt').innerHTML='';try{W.ws.onclose=null;W.ws.close(4900)}catch(e){}connect();render()},
 rmAtt:()=>{W.pend=null;$('#wAtt').innerHTML=''}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&A[b.dataset.act]){e.preventDefault();A[b.dataset.act](b)}});
document.addEventListener('submit',async e=>{if(e.target.id!=='wStart')return;e.preventDefault();const btn=e.target.querySelector('.wgo');btn.disabled=true;
 const r=await run('start',{name:$('#wName').value,pid:$('#wPid').value,msg:$('#wFirst').value,lang:wl(),player:W.player});btn.disabled=false;
 if(r&&r.token){ls.set(TOK,r.token);$('#wFirst').value='';W.seen=0;setTimeout(()=>$('#wTxt')?.focus(),50)}});
document.addEventListener('keydown',e=>{if(e.target.id==='wTxt'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}if(e.key==='Escape')A.close()});
document.addEventListener('input',e=>{if(e.target.id==='wTxt')grow()});
document.addEventListener('change',e=>{if(e.target.id!=='wFile')return;const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>10*1024*1024)return toast(t('Arquivo acima de {n} MB.',{n:10}));
 const r=new FileReader();r.onload=()=>{W.pend={name:f.name,type:f.type||'application/octet-stream',size:f.size,data:r.result};
  $('#wAtt').innerHTML=`<div class="watt">${f.type.startsWith('image/')?`<img src="${r.result}" alt="">`:ic('clip')}<span>${esc(f.name)}</span><button class="wib dark" data-act="rmAtt" aria-label="${t('Remover anexo')}">${ic('x')}</button></div>`};r.readAsDataURL(f)});
addEventListener('message',e=>{const m=e.data;if(!m||!m.sac||e.source!==parent)return;
 if(m.type==='open'){W.open=!!m.v;if(W.open){render();const f=!$('#wStart').hidden?$('#wName'):!$('#wComp').hidden?$('#wTxt'):null;if(f&&innerWidth>600)f.focus()}}
 if(m.type==='player'&&m.player&&typeof m.player==='object'){W.player={id:String(m.player.id||'').slice(0,80),nome:String(m.player.nome||m.player.name||'').slice(0,80)};const n=$('#wName'),p=$('#wPid');if(n&&!n.value)n.value=W.player.nome;if(p&&!p.value)p.value=W.player.id}
 if(m.type==='lang'&&WL.includes(m.l)){A.setLang({dataset:{l:m.l}})}});
function start(){build();connect();toParent({type:'ready'})}
