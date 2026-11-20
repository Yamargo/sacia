# SAC Multilinha

Central de atendimento (SAC) com várias linhas de empresas, perfis de acesso e um widget de chat para os sites dos clientes.

> **Estado atual: protótipo funcional.** Tudo roda no navegador e os dados ficam salvos nele (localStorage). Serve para validar telas e regras. Ainda não é um sistema em produção: falta o servidor (veja [Próximos passos](#próximos-passos)).

## Como abrir

Abra `prototype/index.html` no navegador. Não precisa instalar nada.

Acesso inicial:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Acesso total (God) | `god@sac.local` | `Sac@2026` |

Troque essa senha em **Configurações → Minha senha** no primeiro acesso.

Para simular várias pessoas ao mesmo tempo, abra o mesmo arquivo em outras abas **normais** do mesmo navegador (não anônimas). Cada aba guarda o seu próprio login.

Para abrir o site de demonstração de uma linha, acrescente `#site-<código da linha>` ao endereço, por exemplo `index.html#site-7987`.

## O que já funciona

**Acessos**

- **Acesso total (God):** faz tudo.
- **Admin:** faz tudo, menos alterar a senha ou o acesso do God.
- **Supervisor:** troca a senha dos agentes das suas linhas, vê quem está online, desconecta agentes, transfere chats e encerra sem justificativa.
- **Agente:** atende, transfere para outros agentes e encerra com justificativa escrita.
- **Todos os perfis:** respondem clientes, podem entrar em pausa e têm botão de sair.

**Linhas e distribuição**

- Linhas de empresas ilimitadas: código, nome e cor, em Configurações.
- Distribuição automática para os agentes online da linha, respeitando pausa e limite de chats por agente.
- Transferência automática para outro agente da mesma linha quando não há resposta em 4 minutos (configurável).
- Alerta sonoro para supervisores e God quando o cliente espera 5 minutos (configurável), na página **Alertas**.

**Atendimento**

- Pastas: Meus, Não atribuídos, Equipe, Silenciados e Todos.
- Abas: Todos, Não lidas e Aguardando resposta.
- Filtros por linha, status, agente, idioma e período.
- Busca por ID do chat, nome, telefone, ID do jogador ou texto. Use `#000123` para buscar só pelo ID.
- IDs de chat de 6 dígitos em ordem crescente, começando em `#000000`.
- Scripts prontos por agente, anexos, silenciar chat, contagem de não lidas e som de notificação.

**Idiomas**

- O sistema inteiro funciona em Português, English, Tiếng Việt, Roman Urdu e 中文.

**Interface do cliente (widget)**

- Pensada primeiro para celular, em tela cheia.
- O cliente escolhe entre vietnamita, Roman Urdu, inglês e chinês.
- O cliente envia anexos, encerra o chat e abre uma conversa nova do zero.

**Integração**

- Página **Integração**, para God e Admin, com o passo a passo e o código do widget para cada linha.

## Estrutura

```
prototype/
  index.html        ← arquivo final (gerado), é o que se abre no navegador
  src/
    app.js          ← SAC: login, perfis, atendimento, equipe, usuários, configurações, alertas, pastas
    tail.js         ← integração, site de demonstração, widget do cliente, sincronização, inicialização
    guide2.js       ← textos da página Integração (5 idiomas)
    guidefix.js     ← ajustes dos textos da Integração
    tr.txt          ← traduções da interface: português || inglês || vietnamita || roman urdu || chinês
    head.part       ← <head> e CSS base
    extra.css       ← CSS adicional
    build.py        ← junta tudo em prototype/index.html
  tests/            ← testes de ponta a ponta com Playwright
```

## Como alterar

1. Edite os arquivos em `prototype/src/`.
2. Para textos novos na interface, use `t('texto em português')` no código e acrescente uma linha em `tr.txt` com as 5 versões separadas por ` || `.
3. Gere o arquivo final:

   ```bash
   cd prototype/src
   python3 build.py   # avisa se faltar alguma tradução ("missing")
   ```

4. Rode os testes (precisa de `pip install playwright` e de um Chrome ou Chromium):

   ```bash
   cd prototype/tests
   for f in test_*.py; do python3 "$f"; done
   # para usar um Chrome específico: CHROME=/caminho/do/chrome python3 test_idiomas.py
   ```

## Limitações do protótipo

- Os dados ficam só no navegador. Pessoas em computadores diferentes não se enxergam.
- As senhas são verificadas no navegador. Isso não é seguro para produção.
- Os anexos têm limite de 1,5 MB.
- As traduções precisam de revisão por falantes nativos.

## Próximos passos

1. Servidor com banco de dados e chat em tempo real (WebSocket).
2. Autenticação segura no servidor: hash de senha, sessões, HTTPS, limite de tentativas e "esqueci minha senha".
3. `widget.js` real para instalar nos sites, pelo back office de cada plataforma.
4. Armazenamento de anexos num serviço de arquivos.
5. Funcionalidades opcionais: tradução automática das mensagens, relatórios, histórico do jogador, notas internas e motivos de contato.
