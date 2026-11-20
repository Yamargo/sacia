/* generic integration texts (no fixed line numbers) */
{const G={
 pt:{intro:'Como um jogador de qualquer um dos seus sites chega até um agente aqui, e o que cada parte precisa fazer.',flow:['Jogador no site','Widget de chat','Servidor do SAC','Agente da linha'],
  s2:'É o balão de atendimento no canto da tela. Um pequeno código vai em cada site; o data-linha diz de qual linha o jogador veio. Use o código da linha cadastrada em Configurações → Linhas de empresas.',
  you:'Acesso ao back office de cada site, ou contato com a equipe técnica deles',ask:'Para continuar: veja se o painel administrativo de cada site tem um campo para colar código de chat ao vivo ou script personalizado.',
  ready:'Protótipo do SAC: logins, perfis, linhas ilimitadas, pastas, filtros e IDs de chat'},
 en:{intro:'How a player on any of your sites reaches an agent here, and what each party has to do.',flow:['Player on the site','Chat widget','Help desk server','Line agent'],
  s2:'This is the chat bubble in the corner of the screen. A small piece of code goes on each site; data-linha tells which line the player came from. Use the line code registered in Settings → Company lines.',
  you:'Back-office access to each site, or contact with their tech team',ask:'To continue: check whether each site’s admin panel has a field to paste live chat code or a custom script.',
  ready:'Help desk prototype: logins, roles, unlimited lines, folders, filters and chat IDs'},
 vi:{intro:'Cách người chơi trên bất kỳ trang nào của bạn liên hệ với nhân viên tại đây, và việc mỗi bên cần làm.',flow:['Người chơi trên trang web','Widget chat','Máy chủ CSKH','Nhân viên của line'],
  s2:'Đây là bong bóng chat ở góc màn hình. Một đoạn mã nhỏ được đặt vào mỗi trang; data-linha cho biết người chơi đến từ line nào. Dùng mã line đã đăng ký trong Cài đặt → Line của các công ty.',
  you:'Quyền vào back office của từng trang, hoặc liên hệ đội kỹ thuật của họ',ask:'Để tiếp tục: kiểm tra xem trang quản trị của từng trang có mục để dán mã live chat hoặc script tùy chỉnh không.',
  ready:'Bản thử CSKH: đăng nhập, phân quyền, không giới hạn line, thư mục, bộ lọc và ID chat'},
 ur:{intro:'Aap ki kisi bhi site par player yahan agent tak kaise pohanchta hai, aur har party ko kya karna hai.',flow:['Site par player','Chat widget','Help desk server','Line ka agent'],
  s2:'Yeh screen ke kone mein chat ka bubble hai. Har site par ek chhota sa code lagaya jata hai; data-linha batata hai ke player kis line se aaya. Settings → Companies ki lines mein darj line code istemal karen.',
  you:'Har site ke back office ka access, ya un ki tech team se rabta',ask:'Aage barhne ke liye: check karen ke har site ke admin panel mein live chat code ya custom script paste karne ka field hai ya nahin.',
  ready:'Help desk prototype: login, roles, be-hisab lines, folders, filters aur chat IDs'},
 zh:{intro:'玩家如何从您的任一网站联系到这里的客服，以及各方需要做什么。',flow:['网站上的玩家','聊天组件','客服服务器','线路客服'],
  s2:'即网页角落的聊天气泡。在每个网站中放入一小段代码；data-linha 表示玩家来自哪条线路。请使用在“设置 → 公司线路”中登记的线路代码。',
  you:'各网站的后台权限，或联系其技术团队',ask:'下一步：请确认各网站的管理后台是否有可粘贴在线客服代码或自定义脚本的字段。',
  ready:'客服系统原型：登录、权限、不限数量的线路、文件夹、筛选和会话 ID'}};
 for(const k in G){const g=GUIDE[k],x=G[k];g.intro=x.intro;g.flow=x.flow;g.steps[1][1]=x.s2;g.youL[1]=x.you;g.ask=x.ask;g.readyL[0]=x.ready}}
