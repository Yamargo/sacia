# Teste de ponta a ponta do servidor: SAC + widget real em três navegadores separados.
# Uso: SAC_URL=http://localhost:3900 SAC_PASS=Teste@123 python3 tests/e2e.py
import asyncio, os, base64, tempfile
from playwright.async_api import async_playwright
URL=os.environ.get('SAC_URL','http://localhost:3900'); PW=os.environ.get('SAC_PASS','Teste@123')
CH={'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}
PNG=os.path.join(tempfile.gettempdir(),'sac_comprovante.png')
open(PNG,'wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**CH); errs=[]
    async def ctx(w=1300,h=860):
      c=await b.new_context(viewport={'width':w,'height':h}); pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); return pg
    async def login(pg,e,pw):
      await pg.goto(URL); await pg.wait_for_selector('#lEmail'); await pg.fill('#lEmail',e); await pg.fill('#lPass',pw); await pg.click('#fLogin button'); await pg.wait_for_selector('#app:not([hidden])',timeout=8000)
    g=await ctx(); await login(g,'god@sac.local',PW); print('1 god entrou')
    await g.click('[data-v=usuarios]')
    for n,e,r,ls in [('Ana Lima','ana@x.com','agent',['7987']),('Sara','sara@x.com','supervisor',['7987','8557'])]:
      if await g.locator('#usersBody',has_text=e).count(): continue
      await g.fill('#nuName',n);await g.fill('#nuEmail',e);await g.fill('#nuPass','123456');await g.select_option('#nuRole',r)
      for l in ['7987','8557']:
        await (g.check if l in ls else g.uncheck)(f'[name=nuL][value="{l}"]')
      await g.click('#fNewUser button'); await g.wait_for_timeout(400)
    print('2 usuários:', await g.locator('#usersBody tr').count())
    a=await ctx(); await login(a,'ana@x.com','123456'); print('3 agente entrou')
    c=await ctx(390,780); await c.goto(URL+'/demo/7987'); await c.wait_for_selector('.sacw-b')
    await c.click('.sacw-b'); fr=c.frame_locator('.sacw-p iframe')
    await fr.locator('[data-l=vi]').click(); await fr.locator('#wName').fill('Nguyen'); await fr.locator('#wPid').fill('JG-1'); await fr.locator('#wFirst').fill('Tôi chưa nhận được tiền nạp')
    await fr.locator('#wStart .wgo').click(); await c.wait_for_timeout(800)
    await fr.locator('#wFile').set_input_files(PNG); await c.wait_for_timeout(300); await fr.locator('.wsend').click(); await c.wait_for_timeout(800)
    print('4 cliente status:', await fr.locator('#wStatus').inner_text())
    await a.wait_for_timeout(800); await a.click('.ci'); await a.wait_for_timeout(300)
    print('5 agente vê:', await a.locator('#msgs .m').count(),'mensagens; imagem:', await a.locator('#msgs img').count())
    await a.fill('#txt','Xin chào! Tôi đang kiểm tra.'); await a.press('#txt','Enter'); await a.wait_for_timeout(800)
    print('6 cliente recebeu:', await fr.locator('.wm:not(.p)').count(), '/', await fr.locator('#wStatus').inner_text())
    s=await ctx(); await login(s,'sara@x.com','123456'); await s.click('[data-v=equipe]'); await s.wait_for_timeout(500)
    await s.click('[data-act=kick]'); await a.wait_for_timeout(1500)
    print('7 agente desconectado:', await a.is_visible('#fLogin'), await a.locator('#lErr').inner_text())
    await c.wait_for_timeout(1500); print('8 cliente após kick:', await fr.locator('#wStatus').inner_text())
    await fr.locator('#wEndBtn').click(); await fr.locator('[data-act=doEnd]').click(); await c.wait_for_timeout(800)
    print('9 encerrou:', await fr.locator('#wEndTxt').inner_text())
    await fr.locator('[data-act=new]').click(); await c.wait_for_timeout(500); print('10 nova conversa form:', await fr.locator('#wStart').is_visible())
    await g.click('[data-v=atendimento]'); await g.click('[data-act=folder][data-f=all]'); await g.wait_for_timeout(400)
    print('11 god vê chats:', await g.evaluate("[...document.querySelectorAll('.cid')].map(e=>e.textContent).join(',')"))
    await g.click('[data-v=integracao]'); await g.wait_for_timeout(300); print('12 código gerado:', (await g.inner_text('#genOut')).split('\n')[1])
    print('errors',errs); await b.close()
asyncio.run(main())
