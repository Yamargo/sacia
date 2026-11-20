import asyncio
from playwright.async_api import async_playwright
import pathlib, os
U=pathlib.Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}))
    ctx=await b.new_context(viewport={'width':1400,'height':860}); errs=[]
    async def np(url=U):
      x=await ctx.new_page(); x.on('pageerror',lambda e:errs.append(str(e))); await x.goto(url); await x.wait_for_timeout(400); return x
    async def login(x,e,pw):
      await x.fill('#lEmail',e); await x.fill('#lPass',pw); await x.click('#fLogin button'); await x.wait_for_timeout(400)
    g=await np(); await login(g,'god@sac.local','Sac@2026')
    await g.click('[data-v=usuarios]'); await g.fill('#nuName','Ana Lima');await g.fill('#nuEmail','ana@x.com');await g.fill('#nuPass','123456');await g.click('#fNewUser button');await g.wait_for_timeout(150)
    a=await np(); await login(a,'ana@x.com','123456')
    await g.bring_to_front(); await g.click('[data-v=simulador]')
    for i in range(5):
      await g.click('[data-act=simFill]'); await g.click('#fSimNew .btn.pri'); await g.wait_for_timeout(150)
    await g.click('[data-v=atendimento]'); await g.wait_for_timeout(300)
    for f in ['mine','unassigned','team','muted','all']:
      await g.click(f'[data-act=folder][data-f={f}]'); await g.wait_for_timeout(100)
      print(f, await g.evaluate("document.querySelectorAll('#chatList .ci').length"))
    print('ids', await g.evaluate("[...document.querySelectorAll('.cid')].map(e=>e.textContent).join(',')"))
    await g.fill('#q','#000003'); await g.wait_for_timeout(200); print('search #000003 ->', await g.evaluate("[...document.querySelectorAll('.cid')].map(e=>e.textContent).join(',')"))
    await g.fill('#q','4'); await g.wait_for_timeout(200); print('search 4 ->', await g.evaluate("[...document.querySelectorAll('.cid')].map(e=>e.textContent).join(',')"))
    await g.fill('#q',''); await g.dispatch_event('#q','input')
    await g.click('[data-act=qtab][data-t=unread]'); await g.wait_for_timeout(200); print('unread', await g.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await g.click('.ci'); await g.wait_for_timeout(300); print('unread after open', await g.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await g.click('[data-act=qtab][data-t=pending]'); await g.wait_for_timeout(200)
    await g.click('[data-act=filters]'); await g.wait_for_timeout(200); await g.screenshot(path='/tmp/n_filters.png')
    await g.check('[name=ffL][value="7987"]'); await g.wait_for_timeout(200); print('filtered 7987', await g.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await g.click('[data-act=filtClear]'); await g.click('[data-act=more]'); await g.wait_for_timeout(200); await g.screenshot(path='/tmp/n_more.png')
    await g.click('[data-act=foldToggle]'); await g.wait_for_timeout(200); await g.screenshot(path='/tmp/n_coll.png')
    await g.click('[data-act=foldToggle]'); await g.click('[data-act=folder][data-f=team]'); await g.click('.ci'); await g.wait_for_timeout(200); await g.click('[data-act=mute]'); await g.wait_for_timeout(200)
    await g.click('[data-act=folder][data-f=muted]'); print('muted', await g.evaluate("document.querySelectorAll('#chatList .ci').length"))
    await g.click('[data-act=folder][data-f=all]'); await g.wait_for_timeout(200); await g.screenshot(path='/tmp/n_main.png')
    m=await np(); await m.set_viewport_size({'width':390,'height':800}); await m.wait_for_timeout(300); await m.screenshot(path='/tmp/n_mob.png')
    print('errors',errs); await b.close()
asyncio.run(main())
