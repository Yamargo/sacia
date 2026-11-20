import asyncio
from playwright.async_api import async_playwright
import pathlib, os
U=pathlib.Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {})); errs=[]
    for w,h in [(1300,860),(390,800)]:
      ctx=await b.new_context(viewport={'width':w,'height':h}); g=await ctx.new_page(); g.on('pageerror',lambda e:errs.append(str(e)))
      await g.goto(U); await g.wait_for_timeout(300)
      await g.fill('#lEmail','god@sac.local'); await g.fill('#lPass','Sac@2026'); await g.click('#fLogin button'); await g.wait_for_timeout(300)
      await g.screenshot(path=f'/tmp/lo_{w}.png')
      await g.click('[data-act=askLogout]'); await g.click('#modal [data-act=logout]'); await g.wait_for_timeout(300)
      print(w,'login visible',await g.is_visible('#fLogin'),'overflow',await g.evaluate("document.documentElement.scrollWidth"))
      await ctx.close()
    print('errors',errs); await b.close()
asyncio.run(main())
