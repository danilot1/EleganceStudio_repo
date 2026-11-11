# DEPLOY — publicar o EleganceStudio no Firebase

Guia da fase 6. Ele cobre **o que publicar** (regras + índice + aplicativo), **o que só o dono do projeto
pode fazer** (criar o projeto, virar a primeira gestão) e **o que precisa ser comprovado** no
ambiente publicado, porque uma publicação que "subiu sem erro" não prova que o sistema funciona.

Nada aqui foi executado contra um projeto real: este repositório não tem credenciais. Tudo o
que dá para validar sem elas (regras, índice, seed e backfill) já roda no emulador.

---

## 1. Antes de publicar

- Node.js 20+ e `npm install` (o `firebase-tools` é dependência de desenvolvimento).
- Uma conta Google e um projeto no [console do Firebase](https://console.firebase.google.com/).
- Java **não** é necessário para publicar; ele só serve ao emulador (`npm run test:rules`,
  `npm run seed:demo`).
- O repositório já aponta para o projeto **`elegancestudiodb`** (`.firebaserc`). Falta apenas a sua
  conta autorizar: `npx firebase login`.

## 2. Criar o projeto e ligar os serviços

No console do Firebase:

1. **Criar projeto** (o nome livre; o identificador será o `projectId`).
2. **Build → Authentication → Começar** e habilitar o provedor **E-mail/senha**.
   Sem isso o cadastro e o login falham com `auth/operation-not-allowed`.
3. **Build → Firestore Database → Criar banco** em modo **produção** (as regras do repositório
   substituem as regras padrão; não escolha "modo de teste").
4. **Configurações do projeto → Seus apps → Web (`</>`)** e copiar os valores do SDK.

Depois, na raiz do projeto:

```bash
cp .env.example .env
# preencha VITE_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET,
# MESSAGING_SENDER_ID e APP_ID com os valores do console
npm run dev
```

Com as variáveis preenchidas, o aplicativo deixa de usar o `localStorage` e passa a ler e
gravar no Firestore (`src/lib/backend/firestore.ts`). Sem elas, continua no modo local.

## 3. Publicar as regras e o índice

```bash
npx firebase login
# o projeto já está vinculado em .firebaserc (elegancestudiodb)
npm run deploy:rules
```

O comando publica `firestore.rules` e `firestore.indexes.json`. O índice composto
(`appointments`: `serviceId` + `dateISO`) é usado quando a gestão desativa um serviço — sem
ele o Firestore devolve `failed-precondition` com um link para criá-lo no console. A criação
do índice leva alguns minutos; o Firestore mostra o progresso em **Índices**.

Para publicar só as regras:

```bash
npx firebase deploy --only firestore:rules
```

Para conferir a configuração e os alvos sem enviar nada:

```bash
npm run deploy:rules -- --dry-run
```

O `--dry-run` valida `firebase.json`, as regras e o arquivo de índices e para antes do envio. Ele
ainda exige `firebase login`: sem credenciais o erro é exatamente
`Failed to authenticate, have you run firebase login?` — é assim que se confirma que o problema
é a conta, e não a configuração.

Reversão: o console mantém o histórico de regras (**Firestore → Regras → histórico**); publicar
uma versão anterior restaura o comportamento na hora, sem redeploy do aplicativo.

### Publicar o aplicativo (Hosting)

O `firebase.json` já aponta o Hosting para `dist/`, com **reescrita de SPA** (qualquer rota cai no
`index.html`, necessário para recarregar `/painel` ou `/agendar/revisao` sem 404) e cache longo
para os arquivos com hash em `assets/`. Todo o resto sai com `no-cache` — inclusive as rotas
reescritas: o header casa com o caminho pedido (`/painel`), não com o `index.html` entregue, e sem
isso o navegador poderia guardar um `index.html` antigo apontando para assets que a nova
publicação já removeu (tela em branco depois do deploy).

```bash
npm run deploy:app     # build de produção + firebase deploy --only hosting
npm run deploy:all     # build + regras + índice + hosting
```

Atenção: as variáveis `VITE_FIREBASE_*` são lidas **no build**, não em tempo de execução. Publique
de uma máquina com o `.env` preenchido, senão o site sobe em modo local e cada visitante passa a
gravar no próprio navegador. Para conferir o resultado sem publicar:

```bash
npm run build
npx firebase emulators:start --only hosting
```

O Hosting serve a versão estática em `http://127.0.0.1:5000`; as chamadas de Auth e Firestore
continuam indo para o projeto configurado no `.env`.

## 4. Criar a primeira gestão (passo manual, por desenho)

As regras proíbem que alguém se torne gestão sozinho: o cadastro sempre nasce com
`role: "cliente"`. Isso é intencional, então a primeira conta de gestão é criada assim:

1. Abra `/criar-conta` e crie a conta com o e-mail da gestão.
2. No console: **Firestore → `users` → documento com o uid dessa conta → campo `role`**.
   Troque `cliente` por `admin` e salve.
3. Saia e entre de novo. O painel (`/painel`) passa a abrir; para uma cliente, a rota continua
   bloqueada.

Qualquer outra gestão depois dessa é promovida do mesmo jeito (ou pela própria gestão, se um dia
existir uma tela de equipe).

## 5. Dados de demonstração (opcional)

O script `scripts/seed.ts` usa o Admin SDK e **ignora as regras** — é a ferramenta correta para
carga inicial, porque ninguém consegue escrever dados de outra pessoa pelo cliente.

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/service-account.json"
export GCLOUD_PROJECT="seu-project-id"

npm run seed:backfill          # reconstrói agenda/ a partir dos agendamentos existentes
npm run seed:demo -- --force   # troca TODO o conteúdo pela demonstração (apaga contas e atendimentos)
```

- A service account vem de **Configurações do projeto → Contas de serviço → Gerar nova chave
  privada**. Ela dá acesso total ao projeto: nunca versione o arquivo.
- `npm run seed:backfill` é o único seguro de rodar em produção: ele não apaga nada e preserva
  blocos de agenda de atendimentos que não leu.
- `--demo` apaga contas de autenticação, agendamentos, ajustes de catálogo e a agenda; fora do
  emulador ele só roda com `--force`.

## 6. Checklist de validação no ambiente publicado

Marque cada item olhando o comportamento real, não só o console do Firebase:

- [ ] **Login da cliente**: entra com a conta criada e vê "Meus Agendamentos" com os próprios
      atendimentos.
- [ ] **Login da gestão**: entra e abre `/painel`; uma cliente que tenta `/painel` é redirecionada.
- [ ] **Isolamento**: com a cliente logada, o console do navegador não mostra leitura de
      `appointments` de outra pessoa (o Firestore responde `permission-denied`, e a lista de
      contas em `users` fica vazia para ela — é o esperado, ver comentário em
      `src/lib/backend/firestore.ts`).
- [ ] **Conflito de horário**: dois aparelhos reservam o mesmo horário da mesma profissional ao
      mesmo tempo; um recebe "Este horário acabou de ser ocupado" e a agenda mostra um único
      atendimento.
- [ ] **Cancelamento devolve a vaga**: cancelar pela cliente libera o horário no app e no painel.
- [ ] **Falta (no-show)**: só é aceita depois do horário marcado, libera a vaga e pode ser
      revertida.
- [ ] **Desativação de serviço**: funcionar sem `failed-precondition` comprova que o índice
      composto foi criado; desativar um serviço com agendamento futuro é recusado com a mensagem
      de conflito.
- [ ] **Seed/backfill**: `npm run seed:backfill` termina com "todos os agendamentos têm bloco no
      documento do dia".
- [ ] **Rotas profundas**: abrir `https://<projeto>.web.app/painel` direto pela URL e recarregar
      a página não devolve 404 — confirma a reescrita de SPA. `curl -sI` nessa URL mostra
      `Cache-Control: no-cache`; num arquivo de `assets/`, `max-age=31536000, immutable`.
- [ ] **Regras**: `npm run test:rules` continua passando depois de qualquer alteração em
      `firestore.rules` (roda no emulador, sem tocar no projeto real).

## 7. Limites conhecidos desta publicação

- **As regras de `agenda` são permissivas** para qualquer pessoa autenticada criar/atualizar o
  documento do dia. É o preço de fazer a transação no cliente sem Cloud Functions: as regras não
  conseguem validar sobreposição de horário. O documento guarda apenas identificador, horário e
  status — nenhum dado pessoal. Um cliente malicioso poderia corromper a agenda; corrigir exige
  mover a reserva para uma Cloud Function ou para um servidor (plano Blaze).
- **E-mail registrado, envio não**: os pedidos de aviso ficam parados em `mail/` até a extensão de
  e-mail ser instalada (seção abaixo). WhatsApp continua fora de escopo (a recuperação de senha
  por e-mail do Firebase Auth funciona).
- **`resetDemo` é inerte no Firebase**: não existe "recomeçar do zero" pelo aplicativo; a
  demonstração é recarregada pelo script, com `--force`.
- **Histórico de 90 dias** no painel (`HISTORY_DAYS` em `src/lib/backend/firestore.ts`).
- **Fotos e preços** seguem os placeholders e estimativas descritos em `STATUS.md`.

## Avisos por e-mail (opcional)

O aplicativo **não envia e-mail: ele grava um pedido** em `mail/`, no formato da extensão oficial
**Trigger Email from Firestore** (`to` + `message.{subject,text,html}`). Enquanto a extensão não
estiver instalada, os pedidos ficam parados — e o painel mostra isso, em vez de fingir que saíram.

> A extensão exige o plano **Blaze**. O volume de um estúdio fica dentro do nível gratuito do
> provedor de e-mail; a cobrança do Google é por uso (centavos por milhares de envios).

1. Crie uma conta em um provedor transacional (Resend, SendGrid ou Postmark) e verifique o domínio
   do estúdio. Guarde as credenciais SMTP.
2. Instale a extensão:
   ```bash
   npx firebase ext:install firebase/firestore-send-email --project <id-do-projeto>
   ```
   - **SMTP connection URI**: `smtps://usuario@smtp.provedor.com:465` — a senha vai no campo de
     segredo separado e nunca dentro da URI;
   - **Email documents collection**: `mail`;
   - **Default FROM address**: o endereço verificado no provedor.
3. Publique as regras (`npm run deploy:rules`): elas validam o formato do pedido (destinatário,
   tamanho do assunto e do texto) e deixam a leitura do resultado para a gestão.
4. Faça um agendamento com uma conta e confira em Firestore → `mail/`: o campo `delivery.state` vai
   de `PENDING` para `SUCCESS` (ou `ERROR`, com a mensagem do provedor).

### O que sai, e quando

| Aviso | Disparado por |
| --- | --- |
| Pedido recebido | concluir o agendamento na tela de revisão (e-mail informado ou da conta) |
| Horário confirmado | confirmar o atendimento no painel |
| Lembrete de véspera | abrir o painel (idempotente: um por atendimento) |

A convidada informa o e-mail na etapa de revisão e recebe os mesmos avisos; sem endereço nenhum,
fica só o comprovante na tela. Lembrete automático sem ninguém abrir o painel exigiria um job agendado (Cloud Function
com `onSchedule` ou Worker com cron lendo a mesma coleção).
