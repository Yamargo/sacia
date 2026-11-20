import asyncio, pathlib
from playwright.async_api import async_playwright
import os
U=pathlib.Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {})); errs=[]
    ctx=await b.new_context(viewport={'width':1300,'height':900}); g=await ctx.new_page(); g.on('pageerror',lambda e:errs.append(str(e)))
    await g.goto(U); await g.wait_for_timeout(300)
    await g.fill('#lEmail','god@sac.local'); await g.fill('#lPass','Sac@2026'); await g.click('#fLogin button'); await g.wait_for_timeout(300)
    await g.click('[data-v=integracao]'); await g.wait_for_timeout(300); await g.screenshot(path='/tmp/g1.png')
    await g.select_option('#genLine','8557'); await g.select_option('#genLang','vi'); await g.click('[data-act=genPos][data-v=esquerda]'); await g.check('#genId'); await g.wait_for_timeout(200)
    print(await g.inner_text('#genOut'))
    await g.evaluate("document.getElementById('g-gen').scrollIntoView()"); await g.screenshot(path='/tmp/g2.png')
    await g.click('[data-act=gJump][data-k=trouble]'); await g.wait_for_timeout(600); await g.click('.gfaq summary'); await g.screenshot(path='/tmp/g3.png')
    print('hash',await g.evaluate('location.hash'))
    for l in ['zh','ur']:
      await g.click('[data-v=config]'); await g.click(f'[data-l={l}]'); await g.click('[data-v=integracao]'); await g.wait_for_timeout(300)
      print(l, (await g.inner_text('#guide h1')))
    await g.screenshot(path='/tmp/g4.png')
    m=await b.new_context(viewport={'width':390,'height':800}); mp=await m.new_page(); mp.on('pageerror',lambda e:errs.append(str(e)))
    await mp.goto(U); await mp.wait_for_timeout(300); await mp.fill('#lEmail','god@sac.local'); await mp.fill('#lPass','Sac@2026'); await mp.click('#fLogin button'); await mp.wait_for_timeout(300)
    await mp.click('[data-v=integracao]'); await mp.wait_for_timeout(300); await mp.evaluate("document.getElementById('g-gen').scrollIntoView()"); await mp.screenshot(path='/tmp/g5.png')
    print('overflow',await mp.evaluate("document.documentElement.scrollWidth"))
    # admin sees, supervisor not
    print('errors',errs); await b.close()
asyncio.run(main())
