/* ---------- local mode: the chat window talks to the prototype SAC through this browser's storage ---------- */
/* t('Armazenamento cheio. Anexos grandes ocupam espaço.') t('Arquivo acima de 1,5 MB. Neste protótipo os anexos ficam no navegador.') */
const LK='sac_db_v1';
const lload=()=>{try{return JSON.parse(localStorage.getItem(LK))}catch(e){return null}};
const lsave=d=>{try{localStorage.setItem(LK,JSON.stringify(d));return true}catch(e){toast(t('Armazenamento cheio. Anexos grandes ocupam espaço.'));return false}};
const luid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
function lview(){const d=lload(),n=Date.now();if(!d)return {serverNow:n,line:LINE,lineName:LINE,online:0,exists:false,chat:null};
 const lines=d.lines||[{id:'7987'},{id:'8557'}],L=lines.find(l=>l.id===LINE);
 const online=d.users.filter(u=>u.role==='agent'&&u.lines.includes(LINE)&&(s=>s&&s.on&&!s.kick&&!s.pause&&n-s.lastSeen<20000)(d.sessions[u.id])).length;
 const base={serverNow:n,line:LINE,lineName:L?.name||LINE,online,exists:!!L};
 const id=ls.get(TOK),c=id&&d.chats.find(x=>x.id===id);if(!c)return {...base,chat:null};
 const U=i=>d.users.find(u=>u.id===i),a=c.status==='open'&&c.agentId&&U(c.agentId);
 return {...base,chat:{id:c.id,no:c.no,status:c.status,closedBy:c.closedBy==='customer'?'customer':c.closedBy?'staff':null,agent:a?a.name:null,queue:c.status==='open'&&!c.agentId,lang:c.customer.lang,
  msgs:c.msgs.filter(m=>m.from!=='system').map(m=>({id:m.id,from:m.from,text:m.text,file:m.file,at:m.at,by:m.from==='agent'?(U(m.by)?.name||''):undefined}))}}}
function lrefresh(){W.st=lview();render()}
connect=()=>{lrefresh();if(!W.poll){W.poll=setInterval(lrefresh,1500);addEventListener('storage',e=>{if(e.key===LK)lrefresh()})}};
cmd=async(name,a)=>{const d=lload();if(!d)throw {key:'Linha não encontrada.'};const n=Date.now();
 const sys=(c,k,p)=>c.msgs.push({id:luid(),from:'system',k,p:p||{},at:n});
 if(a&&a.file&&a.file.size>1.5*1024*1024)throw {key:'Arquivo acima de 1,5 MB. Neste protótipo os anexos ficam no navegador.'};
 if(name==='start'){if(!(d.lines||[]).some(l=>l.id===LINE))throw {key:'Linha não encontrada.'};
  const p=a.player||{};d.chatSeq=(d.chatSeq??-1)+1;
  const c={id:luid(),no:d.chatSeq,line:LINE,source:'site',customer:{name:String(a.name||'').trim().slice(0,80),phone:'',pid:String(a.pid||p.id||'').trim().slice(0,80),lang:a.lang},status:'open',agentId:null,handled:[],createdAt:n,waiting:n,custWait:n,transfers:0,msgs:[]};
  if(!c.customer.name||!String(a.msg||'').trim())throw {key:'Preencha nome e e-mail válidos.'};
  c.msgs.push({id:luid(),from:'customer',text:String(a.msg).trim().slice(0,4000),at:n});sys(c,'Cliente entrou pelo site, linha {l}.',{l:LINE});
  d.chats.push(c);if(!lsave(d))throw {key:'Erro interno.'};setTimeout(lrefresh);return {token:c.id}}
 const c=d.chats.find(x=>x.id===ls.get(TOK));if(!c)throw {key:'Chat não encontrado.'};
 if(name==='send'){if(c.status!=='open')throw {key:'Esse chat já foi encerrado.'};const text=String(a.text||'').trim().slice(0,4000);if(!text&&!a.file)return;
  c.msgs.push({id:luid(),from:'customer',text,file:a.file||undefined,at:n});if(!c.waiting)c.waiting=n;if(!c.custWait)c.custWait=n}
 else if(name==='end'){if(c.status==='open'){c.status='closed';c.closedAt=n;c.closedBy='customer';c.closeReason='';c.waiting=null;c.custWait=null;sys(c,'Encerrado pelo cliente.')}}
 else if(name==='lang'){c.customer.lang=a.lang}
 if(!lsave(d))throw {key:'Erro interno.'};setTimeout(lrefresh);return true};
