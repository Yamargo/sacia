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
    g=await np(); await g.fill('#lEmail','god@sac.local'); await g.fill('#lPass','Sac@2026'); await g.click('#fLogin button'); await g.wait_for_timeout(300)
    await g.click('[data-v=usuarios]'); await g.fill('#nuName','Ana Lima');await g.fill('#nuEmail','ana@x.com');await g.fill('#nuPass','123456');await g.click('#fNewUser button');await g.wait_for_timeout(200)
    a=await np(); await a.fill('#lEmail','ana@x.com'); await a.fill('#lPass','123456'); await a.click('#fLogin button'); await a.wait_for_timeout(300)
    m=await np(U+'#site-7987'); await m.set_viewport_size({'width':390,'height':780})
    await m.click('.wb'); await m.click('[data-l=vi]'); await m.fill('#wName','Nguyen'); await m.fill('#wFirst','Xin chào'); await m.click('#wStart .wgo'); await m.wait_for_timeout(300)
    await a.bring_to_front(); await a.wait_for_timeout(1500); await a.click('.ci'); await a.fill('#txt','Hi!'); await a.press('#txt','Enter')
    await m.bring_to_front(); await m.wait_for_timeout(1600)
    await m.click('#wEndBtn'); await m.wait_for_timeout(200); await m.screenshot(path='/tmp/e1.png')
    await m.click('[data-act=wDoEnd]'); await m.wait_for_timeout(300); await m.screenshot(path='/tmp/e2.png')
    await a.bring_to_front(); await a.wait_for_timeout(1500); print('agent toast:',await a.text_content('#toast')); print('note:',await a.text_content('#compNote'))
    await m.bring_to_front(); await m.click('[data-act=wNew]'); await m.wait_for_timeout(200)
    print('fresh form:', await m.input_value('#wName')=='' , await m.is_visible('#wStart'))
    await m.screenshot(path='/tmp/e3.png')
    await m.fill('#wName','Nguyen'); await m.fill('#wFirst','Câu hỏi khác'); await m.click('#wStart .wgo'); await m.wait_for_timeout(300)
    await a.bring_to_front(); await a.wait_for_timeout(1500); print('agent open chats:',await a.evaluate("document.querySelectorAll('#chatList .ci').length"))
    print('errors',errs); await b.close()
asyncio.run(main())
