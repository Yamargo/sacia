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
    async def newchat(g):
      await g.click('[data-v=simulador]'); await g.click('[data-act=simFill]'); await g.select_option('#snLine','7987'); await g.click('#fSimNew .btn.pri'); await g.wait_for_timeout(300)
    g=await np(); await login(g,'god@sac.local','Sac@2026')
    await g.click('[data-v=usuarios]')
    for n,e in [('Ana','ana@x.com'),('Bruno','bruno@x.com')]:
      await g.fill('#nuName',n);await g.fill('#nuEmail',e);await g.fill('#nuPass','123456');await g.click('#fNewUser button');await g.wait_for_timeout(150)
    await g.click('[data-v=config]'); await g.fill('#cfgM','1'); await g.click('#fMax button'); await g.wait_for_timeout(200)
    a=await np(); await login(a,'ana@x.com','123456')
    bb=await np(); await login(bb,'bruno@x.com','123456')
    await a.bring_to_front(); print('stBtn visible',await a.is_visible('#stBtn')); await a.click('#stBtn'); await a.wait_for_timeout(300); print('toast',await a.text_content('#toast'))
    await g.bring_to_front(); await newchat(g); print('chat1:',await g.text_content('#toast'))
    await newchat(g); print('chat2 (bruno at limit, ana paused):',await g.text_content('#toast'))
    await a.bring_to_front(); await a.click('#stBtn'); await a.wait_for_timeout(1500)
    print('ana title',await a.title())
    await g.bring_to_front(); await g.click('[data-v=equipe]'); await g.wait_for_timeout(300); print(await g.inner_text('#teamBody'))
    await g.click('[data-v=integracao]'); await g.wait_for_timeout(300); print(await g.inner_text('.flow'))
    await bb.bring_to_front(); await bb.click('[data-v=config]'); await bb.wait_for_timeout(200); await bb.screenshot(path='/tmp/s_cfg.png')
    print('errors',errs); await b.close()
asyncio.run(main())
