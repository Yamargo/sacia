import asyncio
from playwright.async_api import async_playwright
import pathlib, os
U=pathlib.Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}))
    ctx=await b.new_context(viewport={'width':1300,'height':900}); errs=[]
    async def np(url=U):
      x=await ctx.new_page(); x.on('pageerror',lambda e:errs.append(str(e))); await x.goto(url); await x.wait_for_timeout(400); return x
    async def login(x,e,pw):
      await x.fill('#lEmail',e); await x.fill('#lPass',pw); await x.click('#fLogin button'); await x.wait_for_timeout(400)
    g=await np(); await login(g,'god@sac.local','Sac@2026')
    await g.click('[data-v=config]')
    await g.fill('#lnId','9123'); await g.fill('#lnName','9123.com'); await g.click('#fLine button'); await g.wait_for_timeout(200)
    await g.fill('#lnId','9123'); await g.fill('#lnName','dup'); await g.click('#fLine button'); print('dup toast:',await g.text_content('#toast'))
    await g.fill('#lnId','loja-azul'); await g.fill('#lnName','Loja Azul'); await g.click('[name=lnC][value=sky]+span'); await g.click('#fLine button'); await g.wait_for_timeout(200)
    await g.screenshot(path='/tmp/l_cfg.png')
    await g.click('[data-v=usuarios]'); await g.wait_for_timeout(200)
    await g.fill('#nuName','Caio');await g.fill('#nuEmail','caio@x.com');await g.fill('#nuPass','123456')
    for l in ['7987','8557','loja-azul']: await g.uncheck(f'[name=nuL][value="{l}"]')
    await g.click('#fNewUser button'); await g.wait_for_timeout(200)
    await g.screenshot(path='/tmp/l_users.png')
    a=await np(); await login(a,'caio@x.com','123456')
    s=await np(U+'#site-9123'); await s.click('.wb'); await s.click('[data-l=en]'); await s.fill('#wName','Rita'); await s.fill('#wFirst','Oi'); await s.click('#wStart .wgo'); await s.wait_for_timeout(300)
    await s.screenshot(path='/tmp/l_site.png')
    await a.bring_to_front(); await a.wait_for_timeout(1500); print('caio chats',await a.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await g.bring_to_front(); await g.click('[data-v=config]'); await g.wait_for_timeout(200)
    await g.click('[data-act=delLine][data-id="9123"]'); print('del blocked:',await g.text_content('#toast'))
    await g.click('[data-act=delLine][data-id="loja-azul"]'); await g.click('[data-act=doDelLine]'); await g.wait_for_timeout(200)
    print('lines rows',await g.evaluate("document.querySelectorAll('#linesBody tr').length"))
    await g.click('[data-v=integracao]'); await g.wait_for_timeout(300); print(await g.inner_text('pre.code'))
    await g.click('[data-v=equipe]'); await g.wait_for_timeout(200); print(await g.inner_text('#teamStats'))
    m=await b.new_context(viewport={'width':390,'height':844}); mp=await m.new_page(); mp.on('pageerror',lambda e:errs.append(str(e)))
    await mp.goto(U); await mp.wait_for_timeout(300); await login(mp,'god@sac.local','Sac@2026'); await mp.click('[data-v=config]'); await mp.wait_for_timeout(200)
    await mp.evaluate("document.querySelector('#linesCard').scrollIntoView()"); await mp.screenshot(path='/tmp/l_mob.png')
    print('overflow',await mp.evaluate("document.documentElement.scrollWidth"))
    print('errors',errs); await b.close()
asyncio.run(main())
