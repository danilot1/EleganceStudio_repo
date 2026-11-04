# DEPLOY — publicar o EleganceStudio no Firebase

Guia da fase 6. Ele cobre **o que publicar** (regras + índice), **o que só o dono do projeto
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
npx firebase use --add        # escolha o projeto; cria .firebaserc
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

Reversão: o console mantém o histórico de regras (**Firestore → Regras → histórico**); publicar
uma versão anterior restaura o comportamento na hora, sem redeploy do aplicativo.

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
- [ ] **Regras**: `npm run test:rules` continua passando depois de qualquer alteração em
      `firestore.rules` (roda no emulador, sem tocar no projeto real).

## 7. Limites conhecidos desta publicação

- **As regras de `agenda` são permissivas** para qualquer pessoa autenticada criar/atualizar o
  documento do dia. É o preço de fazer a transação no cliente sem Cloud Functions: as regras não
  conseguem validar sobreposição de horário. O documento guarda apenas identificador, horário e
  status — nenhum dado pessoal. Um cliente malicioso poderia corromper a agenda; corrigir exige
  mover a reserva para uma Cloud Function ou para um servidor (plano Blaze).
- **Sem envio de e-mail/WhatsApp**: confirmação, lembretes e recuperação de senha por WhatsApp
  continuam fora de escopo (a recuperação por e-mail do Firebase Auth funciona).
- **`resetDemo` é inerte no Firebase**: não existe "recomeçar do zero" pelo aplicativo; a
  demonstração é recarregada pelo script, com `--force`.
- **Histórico de 90 dias** no painel (`HISTORY_DAYS` em `src/lib/backend/firestore.ts`).
- **Fotos e preços** seguem os placeholders e estimativas descritos em `STATUS.md`.
