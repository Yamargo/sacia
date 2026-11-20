# Comandos da equipe contra o servidor: simulador, transferência, encerramento, scripts, linhas, configurações, pausa.
import asyncio, os
from playwright.async_api import async_playwright
URL=os.environ.get('SAC_URL','http://localhost:3900'); PW=os.environ.get('SAC_PASS','Teste@123')
CH={'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**CH); errs=[]
    async def ctx():
      c=await b.new_context(viewport={'width':1300,'height':860}); pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); return pg
    async def login(pg,e,pw):
      await pg.goto(URL); await pg.wait_for_selector('#lEmail'); await pg.fill('#lEmail',e); await pg.fill('#lPass',pw); await pg.click('#fLogin button'); await pg.wait_for_selector('#app:not([hidden])',timeout=8000)
    g=await ctx(); await login(g,'god@sac.local',PW)
    await g.click('[data-v=usuarios]')
    if not await g.locator('#usersBody',has_text='bruno@x.com').count():
      await g.fill('#nuName','Bruno');await g.fill('#nuEmail','bruno@x.com');await g.fill('#nuPass','123456');await g.click('#fNewUser button');await g.wait_for_timeout(400)
    await g.click('[data-v=config]'); await g.fill('#lnId','loja-azul'); await g.fill('#lnName','Loja Azul'); await g.click('#fLine button'); await g.wait_for_timeout(400)
    print('linha criada:', await g.locator('#linesBody tr',has_text='loja-azul').count())
    await g.fill('#cfgM','0'); await g.click('#fMax button'); await g.wait_for_timeout(300); print('toast:', await g.text_content('#toast'))
    a=await ctx(); await login(a,'ana@x.com','123456')
    bb=await ctx(); await login(bb,'bruno@x.com','123456')
    await g.click('[data-v=simulador]'); await g.click('[data-act=simFill]'); await g.select_option('#snLine','7987'); await g.click('#fSimNew .btn.pri'); await g.wait_for_timeout(600)
    print('sim:', await g.text_content('#toast'))
    who = a if 'Ana' in (await g.text_content('#toast')) else bb
    other = bb if who is a else a
    await who.wait_for_timeout(500); await who.click('[data-act=folder][data-f=mine]'); await who.click('.ci'); await who.click('[data-act=transfer]'); await who.wait_for_timeout(200)
    await who.click('[data-act=doTransfer]'); await other.wait_for_timeout(1000)
    await other.click('[data-act=folder][data-f=mine]'); print('transferido, outro agente tem:', await other.locator('#chatList .ci').count())
    await other.click('.ci'); await other.click('[data-act=scripts]'); await other.fill('#scT','Saudação'); await other.fill('#scX','Olá! Como posso ajudar?'); await other.click('[data-act=saveSc]'); await other.wait_for_timeout(400)
    await other.click('[data-act=useSc]'); await other.press('#txt','Enter'); await other.wait_for_timeout(400)
    await other.click('[data-act=close]'); await other.click('[data-act=doClose]'); print('sem justificativa:', await other.text_content('#rErr'))
    await other.fill('#reason','Resolvido com o cliente'); await other.click('[data-act=doClose]'); await other.wait_for_timeout(500)
    await other.click('[data-act=folder][data-f=all]'); await other.wait_for_timeout(200); await other.click('.ci'); print('nota:', await other.text_content('#compNote'))
    await other.click('#stBtn'); await other.wait_for_timeout(400); print('pausa:', await other.text_content('#toast'))
    await g.click('[data-v=equipe]'); await g.wait_for_timeout(500); print(await g.inner_text('#teamBody'))
    await g.click('[data-v=config]'); await g.click('[data-act=delLine][data-id="loja-azul"]'); await g.click('[data-act=doDelLine]'); await g.wait_for_timeout(300); print('linha excluída:', await g.locator('#linesBody tr',has_text='loja-azul').count()==0)
    await g.click('[data-l=zh]'); await g.wait_for_timeout(500); await g.reload(); await g.wait_for_selector('#app:not([hidden])'); print('idioma salvo:', await g.evaluate('document.documentElement.lang'))
    await g.click('[data-v=config]'); await g.click('[data-l=pt]'); await g.wait_for_timeout(300)
    print('errors',errs); await b.close()
asyncio.run(main())
