import asyncio
from playwright.async_api import async_playwright
import pathlib, os
U=pathlib.Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}))
    ctx=await b.new_context(viewport={'width':1300,'height':860}); errs=[]
    async def np(url=U):
      x=await ctx.new_page(); x.on('pageerror',lambda e:errs.append(str(e))); await x.goto(url); await x.wait_for_timeout(400); return x
    async def login(x,e,pw):
      await x.fill('#lEmail',e); await x.fill('#lPass',pw); await x.click('#fLogin button'); await x.wait_for_timeout(400)
    g=await np(); await g.screenshot(path='/tmp/i_login.png')
    await login(g,'god@sac.local','Sac@2026')
    await g.click('[data-v=usuarios]')
    for n,e,r in [('Ana Lima','ana@x.com','agent'),('Bruno','bruno@x.com','agent'),('Sara','sara@x.com','supervisor')]:
      await g.fill('#nuName',n);await g.fill('#nuEmail',e);await g.fill('#nuPass','123456');await g.select_option('#nuRole',r);await g.click('#fNewUser button');await g.wait_for_timeout(150)
    await g.click('[data-v=config]'); await g.fill('#cfgT','10'); await g.click('#fCfg button'); await g.wait_for_timeout(200)
    await g.click('[data-l=zh]'); await g.wait_for_timeout(300); await g.screenshot(path='/tmp/i_cfg_zh.png')
    a=await np(); await login(a,'ana@x.com','123456')
    s=await np(U+'#site-7987'); await s.click('.wb'); await s.click('[data-l=en]'); await s.fill('#wName','Lucas'); await s.fill('#wFirst','Oi'); await s.click('#wStart .wgo'); await s.wait_for_timeout(300)
    await a.bring_to_front(); await a.wait_for_timeout(1500); await a.click('.ci'); await a.fill('#txt','Olá!'); await a.press('#txt','Enter'); await a.wait_for_timeout(300)
    bb=await np(); await login(bb,'bruno@x.com','123456'); await bb.wait_for_timeout(500)
    await s.bring_to_front(); await s.fill('#wTxt','Ainda aí?'); await s.press('#wTxt','Enter')
    await bb.bring_to_front(); await bb.wait_for_timeout(12000)
    print('bruno chats', await bb.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await bb.click('[data-v=config]'); await bb.click('[data-l=vi]'); await bb.click('[data-v=atendimento]'); await bb.click('.ci'); await bb.wait_for_timeout(300)
    await bb.screenshot(path='/tmp/i_vi.png')
    # god zh view inbox
    await g.bring_to_front(); await g.click('[data-v=atendimento]'); await g.wait_for_timeout(300); await g.click('.ci'); await g.wait_for_timeout(300); await g.screenshot(path='/tmp/i_zh.png')
    await g.click('[data-v=integracao]'); await g.wait_for_timeout(300); await g.screenshot(path='/tmp/i_guide_zh.png')
    # site follows last chosen lang (vi by bruno)
    await s.bring_to_front(); await s.reload(); await s.wait_for_timeout(600); await s.click('.wb'); await s.wait_for_timeout(300); await s.screenshot(path='/tmp/i_site.png')
    # ur
    await g.click('[data-v=config]'); await g.click('[data-l=ur]'); await g.click('[data-v=equipe]'); await g.wait_for_timeout(300); await g.screenshot(path='/tmp/i_ur.png')
    # relogin keeps lang
    await g.click('[data-v=config]'); await g.click('[data-act=logout]'); await g.wait_for_timeout(300)
    await login(g,'god@sac.local','Sac@2026'); print('god lang after relogin', await g.evaluate("document.documentElement.lang"))
    print('errors',errs); await b.close()
asyncio.run(main())
