/* ---------- server mode: the SAC talks to the real server (only in the server build) ---------- */
/* server messages, listed so the build checks their translations:
 t('Sem permissão.') t('Comando desconhecido.') t('Chat não encontrado.') t('Idioma inválido.') t('Arquivo inválido.')
 t('Muitas tentativas. Tente de novo em 15 minutos.') t('Erro interno.') t('Linha não encontrada.') */
const NETC={ws:null,seq:0,wait:new Map(),first:true,retry:0,closing:false,next:[]};
const afterState=()=>new Promise(r=>{NETC.next.push(r);setTimeout(r,1500)});
load=()=>db;
save=()=>{};
tx=fn=>{console.warn('[sac] tx() não é usado no modo servidor')};
online=(d,u)=>{const s=u&&d.sessions[u.id];return !!(s&&s.on)};
function netBanner(on){const w=$('#warn');if(!w)return;w.hidden=on;if(!on)w.textContent=t('Sem conexão com o servidor. Tentando reconectar…')}
function cmd(name,args){return new Promise((res,rej)=>{const ws=NETC.ws;if(!ws||ws.readyState!==1){toast(t('Sem conexão com o servidor. Tentando reconectar…'));return rej(new Error('offline'))}
 const id=++NETC.seq;NETC.wait.set(id,{res,rej});ws.send(JSON.stringify({t:'cmd',id,cmd:name,args}))})}
async function run(name,args,okMsg){try{const r=await cmd(name,args);if(okMsg)toast(typeof okMsg==='function'?okMsg(r):okMsg);return r||true}catch(e){if(e&&e.key)toast(t(e.key,e.params));return null}}
function connect(){
 const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');NETC.ws=ws;NETC.closing=false;
 ws.onopen=()=>{NETC.retry=0;netBanner(true)};
 ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
  if(m.t==='state'){const s=m.state;SKEW=s.serverNow-Date.now();db=s;me=s.me;
   NETC.next.splice(0).forEach(f=>f());
   if(NETC.first){NETC.first=false;const u=ME();if(u&&u.lang&&u.lang!==lang)setLang(u.lang);known=new Set(db.chats.filter(c=>c.agentId===me&&c.status==='open').map(c=>c.id));enter()}else render();return}
  if(m.t==='res'){const w=NETC.wait.get(m.id);if(!w)return;NETC.wait.delete(m.id);m.ok?w.res(m.data):w.rej({key:m.error,params:m.params});return}
  if(m.t==='bye'){NETC.closing=true;const msg=m.reason==='kicked'?t('Você foi desconectado por um supervisor.'):m.reason==='password'?t('Sua senha foi alterada. Entre de novo.'):t('Seu acesso foi removido.');netLogoutLocal(msg)}};
 ws.onclose=ev=>{for(const w of NETC.wait.values())w.rej({key:'Sem conexão com o servidor. Tentando reconectar…'});NETC.wait.clear();
  if(NETC.closing||ev.code===4000||ev.code===4001)return;
  if(ev.code===1006&&!me&&NETC.first){showLogin();return}
  netBanner(false);const d=Math.min(10000,1000*2**NETC.retry++);setTimeout(async()=>{const r=await fetch('/api/me').then(x=>x.json()).catch(()=>null);if(r&&r.ok===false){netLogoutLocal(t('Sua sessão expirou. Entre de novo.'));return}connect()},d)}}
function netLogoutLocal(msg){NETC.closing=true;try{NETC.ws&&NETC.ws.close()}catch(e){}me=null;db=null;sel=null;pend=null;NETC.first=true;document.title='SAC';if(typeof AL!=='undefined'){AL.seen.clear();AL.ack.clear()}mclose();netBanner(true);showLogin(msg)}
logout=async msg=>{NETC.closing=true;await fetch('/api/logout',{method:'POST'}).catch(()=>{});netLogoutLocal(msg)};
A.logout=()=>logout();

/* login */
F.fLogin=async()=>{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#lEmail').value,password:$('#lPass').value})}).then(x=>x.json()).catch(()=>null);
 if(!r){$('#lErr').textContent=t('Sem conexão com o servidor. Tentando reconectar…');return}
 if(!r.ok){$('#lErr').textContent=t(r.error||'E-mail ou senha incorretos.');return}
 NETC.first=true;connect()};

/* language, profile, password, settings */
const _setLang=setLang;
setLang=(l,persist)=>{_setLang(l,false);if(persist&&me){const u=ME();if(u)u.lang=l;cmd('setLang',{lang:l}).catch(()=>{})}};
F.fProfile=()=>run('profile',{name:$('#pfName').value},t('Perfil salvo.'));
F.fOwnPass=async()=>{const n=$('#op1').value;if(n.length<6)return $('#oErr').textContent=t('Mínimo 6 caracteres.');if(n!==$('#op2').value)return $('#oErr').textContent=t('As senhas não conferem.');
 try{await cmd('ownPass',{old:$('#op').value,pass:n});$('#fOwnPass').reset();$('#oErr').textContent='';toast(t('Sua senha foi alterada.'))}catch(e){if(e&&e.key)$('#oErr').textContent=t(e.key,e.params)}};
F.fCfg=()=>run('cfg',{key:'timeout',value:$('#cfgT').value},r=>t('Tempo sem resposta: {t}.',{t:fmtT(r.value)}));
F.fAlert=()=>run('cfg',{key:'alert',value:$('#cfgA').value},r=>t('Alerta de demora: {t}.',{t:fmtT(r.value)}));
F.fMax=()=>run('cfg',{key:'maxChats',value:$('#cfgM').value},r=>r.value?t('Limite de chats: {n}.',{n:r.value}):t('Sem limite'));

/* users and lines */
F.fNewUser=async f=>{const r=$('#nuRole').value,em=$('#nuEmail').value.trim().toLowerCase();
 const ok=await run('userCreate',{name:$('#nuName').value,email:em,pass:$('#nuPass').value,role:r,lines:[...document.querySelectorAll('[name=nuL]:checked')].map(x=>x.value)},t('{r} criado: {e}',{r:rl(r),e:em}));
 if(ok){f.reset();document.querySelectorAll('[name=nuL]').forEach(x=>x.checked=true);$('#nuRole').value='agent'}};
A.doEdit=async b=>{const ok=await run('userEdit',{userId:b.dataset.id,name:$('#eName').value,email:$('#eEmail').value,role:$('#eRole').value,lines:[...document.querySelectorAll('[name=eL]:checked')].map(x=>x.value)},t('Acesso atualizado.'));if(ok)mclose()};
A.doDel=async b=>{if(await run('userDel',{userId:b.dataset.id},t('Acesso excluído.')))mclose()};
A.doPass=async b=>{const a=$('#np1').value,c=$('#np2').value;if(a.length<6)return $('#pErr').textContent=t('Mínimo 6 caracteres.');if(a!==c)return $('#pErr').textContent=t('As senhas não conferem.');
 if(await run('setPass',{userId:b.dataset.id,pass:a},t('Senha alterada.')))mclose()};
A.kick=async b=>{await run('kick',{userId:b.dataset.id},r=>t('{n} foi desconectado.',{n:r.name}))};
F.fLine=async f=>{const id=$('#lnId').value.trim();const ok=await run('lineCreate',{id,name:$('#lnName').value,color:document.querySelector('[name=lnC]:checked')?.value},t('Linha {l} criada.',{l:id}));if(ok)f.reset()};
A.doEditLine=async b=>{if(await run('lineEdit',{id:b.dataset.id,name:$('#elName').value,color:document.querySelector('[name=elC]:checked')?.value},t('Linha atualizada.')))mclose()};
A.doDelLine=async b=>{if(await run('lineDel',{id:b.dataset.id},t('Linha excluída.')))mclose()};

/* chats */
send=async()=>{const c=db.chats.find(x=>x.id===sel),m=$('#txt').value.trim();if(!c||!canReply(c)||(!m&&!pend))return;
 const file=pend;$('#txt').value='';pend=null;$('#att').innerHTML='';
 const ok=await run('send',{chatId:c.id,text:m,file});if(!ok){$('#txt').value=m}};
A.send=send;
A.take=()=>run('take',{chatId:sel},t('Chat assumido.'));
A.doTransfer=async b=>{const ok=await run('transfer',{chatId:sel,to:b.dataset.to},t('Chat transferido.'));mclose();if(ok&&role()==='agent'){sel=null;render()}};
A.doClose=async()=>{const r=$('#reason').value.trim();if(role()==='agent'&&r.length<5){$('#rErr').textContent=t('Escreva a justificativa (mínimo 5 caracteres).');return}
 if(await run('close',{chatId:sel,reason:r},t('Chat encerrado.')))mclose()};
A.pauseToggle=()=>run('pause',{},r=>r.pause?t('Você está em pausa: não recebe chats novos.'):t('Você está disponível para novos chats.'));
A.mute=()=>run('mute',{chatId:sel},r=>r.muted?t('Chat silenciado.'):t('Som do chat reativado.'));
markRead=c=>{if(!c||unread(c)===0)return false;const u=ME();if(u){u.read=u.read||{};u.read[c.id]=now()}cmd('read',{chatId:c.id}).catch(()=>{});return true};
A.readAll=()=>{const u=ME();if(u){u.read=u.read||{};for(const c of db.chats)u.read[c.id]=now()}IN.pop=null;renderPop2();renderList();run('readAll',{},t('Todas marcadas como lidas.'))};
A.saveSc=async()=>{const ti=$('#scT').value.trim(),te=$('#scX').value.trim();if(!ti||!te)return toast(t('Preencha título e texto.'));
 const w=afterState();if(await run('scriptSave',{id:editSc,title:ti,text:te},t('Script salvo.'))){await w;editSc=null;renderPop()}};
A.delSc=async b=>{const w=afterState();await run('scriptDel',{id:b.dataset.id});await w;renderPop()};

/* simulator */
F.fSimNew=async f=>{const r=await run('simNew',{name:$('#snName').value,phone:$('#snPhone').value,line:$('#snLine').value,msg:$('#snMsg').value});
 if(r){toast(r.agent?t('Chat aberto e atribuído a {n}.',{n:r.agent}):t('Chat aberto. Sem agente disponível na linha {l}: ficou na fila.',{l:r.line}));f.reset()}};
F.fSimMsg=async()=>{const id=$('#smChat').value,m=$('#smMsg').value.trim();if(!id||!m)return;if(await run('simMsg',{chatId:id,msg:m},t('Mensagem do cliente enviada.')))$('#smMsg').value=''};

/* start */
(async()=>{document.documentElement.lang=loc();const r=await fetch('/api/me').then(x=>x.json()).catch(()=>null);if(r&&r.ok)connect();else showLogin()})();
