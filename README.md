# SAC Multilinha

Central de atendimento (SAC) com várias linhas de empresas, perfis de acesso e um widget de chat para os sites dos clientes.

O repositório tem duas versões:

| | O que é | Onde os dados ficam |
| --- | --- | --- |
| **`server/`** | O sistema de verdade: servidor Node.js com banco Postgres, chat em tempo real, login seguro e o `widget.js` para os sites | No banco de dados |
| **`prototype/`** | O protótipo que roda só no navegador, bom para mostrar e testar telas | No navegador (localStorage) |

As duas usam a mesma interface. O código da interface fica em `prototype/src/` e o `build.py` gera os arquivos das duas.

## Colocar no ar no Railway

1. Entre em [railway.com](https://railway.com) com a conta do GitHub e assine o plano **Hobby**.
2. **New Project → Deploy from GitHub repo → `Yamargo/sacia`.** O Railway usa o `Dockerfile` e o `railway.json` daqui.
3. No mesmo projeto: **+ New → Database → PostgreSQL**.
4. No serviço `sacia`, abra a aba **Variables** e crie:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `ADMIN_EMAIL` | o e-mail do acesso total (por exemplo, `voce@suaempresa.com`) |
   | `ADMIN_PASSWORD` | uma senha forte para o primeiro acesso |

   `ADMIN_EMAIL` e `ADMIN_PASSWORD` só são usados na primeira vez, para criar o acesso total. Depois disso, a senha é trocada pelo próprio sistema, em **Configurações**.
5. Em **Settings → Networking → Generate Domain**. O endereço gerado, por exemplo `https://sacia-production.up.railway.app`, já é o SAC.
6. Opcional: em **Custom Domain**, coloque `sac.suaempresa.com` e crie o registro CNAME que o Railway mostrar.

Depois disso, cada envio para a branch `main` do GitHub vai para o ar sozinho.

### Endereços do servidor

| Endereço | Para que serve |
| --- | --- |
| `/` | O SAC (login da equipe) |
| `/widget.js` | O código que os sites carregam |
| `/demo/<linha>` | Site de demonstração com o widget real instalado, por exemplo `/demo/7987` |
| `/w` | A janela de chat do cliente (usada dentro do widget) |
| `/healthz` | Verificação de saúde (usada pelo Railway) |

### Instalar o widget num site

No SAC, entre como God ou Admin e abra **Integração**. O gerador monta o código já com o endereço certo do servidor:

```html
<script src="https://SEU-SAC/widget.js"
        data-linha="7987"
        data-idioma="auto"
        data-posicao="direita"
        async></script>
```

Cole antes de `</body>` em todas as páginas do site. A página **Integração** explica onde colar em cada tipo de site (back office, WordPress, Google Tag Manager, HTML/React) e lista os comandos em JavaScript: `SAC.open()`, `SAC.close()`, `SAC.identify()` e `SAC.setLanguage()`.

## Rodar no computador

```bash
cd server
npm install
DATABASE_URL=postgresql://usuario@localhost:5432/sac ADMIN_PASSWORD=UmaSenhaForte npm start
# abre em http://localhost:3000
```

Sem `DATABASE_URL`, o servidor guarda tudo em memória e perde os dados ao reiniciar. Use assim só para testar.

## O que já funciona

**Acessos**

- **Acesso total (God):** faz tudo.
- **Admin:** faz tudo, menos alterar a senha ou o acesso do God.
- **Supervisor:** troca a senha dos agentes das suas linhas, vê quem está online, desconecta agentes, transfere chats e encerra sem justificativa.
- **Agente:** atende, transfere para outros agentes e encerra com justificativa escrita.
- **Todos os perfis:** respondem clientes, podem entrar em pausa e têm botão de sair.

**Linhas e distribuição**

- Linhas de empresas ilimitadas: código, nome e cor, em Configurações.
- Distribuição automática para os agentes disponíveis da linha, respeitando pausa e limite de chats por agente.
- Transferência automática para outro agente da mesma linha quando não há resposta em 4 minutos (configurável).
- Alerta sonoro para supervisores e God quando o cliente espera 5 minutos (configurável), na página **Alertas**.

**Atendimento**

- Pastas: Meus, Não atribuídos, Equipe, Silenciados e Todos.
- Abas: Todos, Não lidas e Aguardando resposta.
- Filtros por linha, status, agente, idioma e período.
- Busca por ID do chat (`#000123`), nome, telefone, ID do jogador ou texto.
- IDs de chat de 6 dígitos em ordem crescente, começando em `#000000`.
- Scripts prontos por pessoa, anexos de até 10 MB, silenciar chat, não lidas e som de notificação.

**Idiomas**

- O sistema inteiro funciona em Português, English, Tiếng Việt, Roman Urdu e 中文.

**Widget do cliente**

- Pensado primeiro para celular, em tela cheia.
- O cliente escolhe entre vietnamita, Roman Urdu, inglês e chinês.
- O cliente envia anexos, encerra o chat e abre uma conversa nova do zero.

**Segurança no servidor**

- Senhas com bcrypt.
- Sessão em cookie `HttpOnly`, válida por 7 dias.
- Bloqueio por 15 minutos depois de 5 tentativas de login erradas.
- Todas as permissões são conferidas no servidor.
- Conexões em tempo real só aceitas do próprio domínio.
- Quem é desconectado por um supervisor, ou tem a senha trocada por outra pessoa, precisa entrar de novo.

## Estrutura

```
Dockerfile, railway.json     ← publicação no Railway
server/
  src/index.js               ← HTTP, login, WebSocket, arquivos, rotas
  src/core.js                ← regras: permissões, distribuição, transferências, comandos
  src/store.js               ← Postgres (ou memória, sem DATABASE_URL)
  public/                    ← arquivos gerados pelo build.py (não edite à mão)
  tests/e2e.py               ← teste completo: SAC + widget real em navegadores separados
  tests/e2e_staff.py         ← comandos da equipe: simulador, transferência, scripts, linhas, pausa
prototype/
  index.html                 ← protótipo gerado (roda só no navegador)
  src/                       ← código da interface (compartilhado)
    app.js, tail.js, guide*.js   ← telas do SAC
    net.js                   ← ligação com o servidor (só na versão do servidor)
    w.js, w.css              ← janela de chat do cliente
    widget.js, demo.html     ← código do site e página de demonstração
    tr.txt                   ← traduções: português || inglês || vietnamita || roman urdu || chinês
    build.py                 ← gera prototype/index.html e server/public/*
  tests/                     ← testes do protótipo
```

## Como alterar

1. Edite os arquivos em `prototype/src/` (interface) ou `server/src/` (servidor).
2. Para um texto novo na interface, use `t('texto em português')` e acrescente uma linha em `prototype/src/tr.txt` com as 5 versões separadas por ` || `.
3. Gere os arquivos finais com `cd prototype/src && python3 build.py`. O script avisa se faltar alguma tradução.
4. Teste:
   - protótipo: `cd prototype/tests && for f in test_*.py; do python3 "$f"; done`
   - servidor: suba o servidor e rode `SAC_URL=http://localhost:3000 SAC_PASS=SuaSenha python3 server/tests/e2e.py`

   Os testes precisam de `pip install playwright` e de um Chrome ou Chromium. Para apontar um Chrome específico, use `CHROME=/caminho`.

## Próximos passos

- Assinatura do jogador: o site manda o ID assinado pelo próprio servidor, para ninguém se passar por outro jogador.
- Relatórios por linha e por agente.
- Histórico do jogador entre conversas.
- Tradução automática das mensagens.
- Notas internas e motivos de contato.
