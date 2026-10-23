# EleganceStudio — Podologia Especializada & Salão de Beleza

Aplicação do EleganceStudio, construída a partir das telas geradas no **Google Stitch**
para o Projeto Integrador da UNICAP. O front-end é React + Vite; o back-end é
**Firebase** (Authentication + Cloud Firestore), com regras de segurança no servidor.

Cobre os dois lados do sistema:

- **Cliente:** Home, catálogo de serviços, agendamento em 4 etapas, criar conta, entrar,
  recuperar senha e "Meus Agendamentos" (próximos e histórico).
- **Gestão:** Painel Executivo com indicadores, linha do tempo do dia, ações de início/conclusão
  de atendimento, registro de pagamento, reagendamento, encaixe de cliente e registro de falta
  (no-show) com taxa calculada por período.

> Leia também o **[STATUS.md](./STATUS.md)**: ele separa o que funciona de verdade do que
> ainda é demonstração. Nada é simulado como se estivesse pronto.

---

## Como rodar localmente

Pré-requisito: **Node.js 20+** (testado com Node 24) e npm.

```bash
npm install       # instala as dependências do package-lock.json
cp .env.example .env   # depois preencha com as chaves do SEU projeto Firebase
npm run dev       # abre em http://localhost:3000
```

Sem o `.env` preenchido o app **não abre as telas**: ele mostra uma página dizendo quais
variáveis faltam. Isso é intencional — não existe mais modo de demonstração com dados
falsos no navegador.

Outros comandos:

```bash
npm run typecheck   # só a checagem de tipos
npm run build       # gera a versão de produção em dist/
npm test            # roda os testes (Vitest + Testing Library), sem rede
npm run lint        # análise estática (oxlint)
npm run preview     # serve o resultado do build
```

---

## Back-end (Firebase) — configuração única

São 7 passos, todos no [console do Firebase](https://console.firebase.google.com/).
Leva cerca de 10 minutos e funciona no **plano gratuito (Spark)** — nada aqui exige
cartão de crédito ou Cloud Functions.

### 1. Criar o projeto

Console → **Adicionar projeto** → nome `EleganceStudio` → pode desativar o Google Analytics.

### 2. Registrar o app Web

Na visão geral do projeto, clique no ícone **`</>`** (Web), apelido `elegance-web`.
Copie o objeto `firebaseConfig` que aparece.

### 3. Criar o `.env`

Na raiz do projeto, copie `.env.example` para `.env` e preencha com os valores do
`firebaseConfig`:

| No `firebaseConfig` | No `.env` |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

O `.env` está no `.gitignore`: cada pessoa usa o próprio projeto, e o repositório não
carrega configuração de ninguém. Esses valores são públicos (identificam o projeto, não
autorizam nada sozinhos) — quem protege os dados são as regras do passo 6.

### 4. Habilitar o login por e-mail e senha

**Authentication** → *Começar* → aba **Sign-in method** → **E-mail/senha** → habilitar.

Ainda em Authentication → aba **Users** → *Adicionar usuário*, e crie as contas do
roteiro de teste (senha `elegance123`):

| Perfil | E-mail |
| --- | --- |
| Cliente | `mariana@exemplo.com` |
| Gestão | `gestao@elegance.com` |

### 5. Criar o banco

**Firestore Database** → *Criar banco de dados* → **modo produção** → região
`southamerica-east1` (São Paulo). O banco começa vazio: os atendimentos aparecem
conforme você agenda pelo app ou cria pelo Painel Executivo.

### 6. Publicar as regras de segurança

**Firestore Database** → aba **Regras** → apague o conteúdo, cole o arquivo
[`firestore.rules`](./firestore.rules) inteiro → **Publicar**.

(Ou, com a CLI: `npx firebase-tools deploy --only firestore:rules`.)

### 7. Promover a conta de gestão

O papel de gestão é o campo `role` no documento do usuário, e só existe depois do
primeiro login dessa conta. Então: entre no app com `gestao@elegance.com`, volte ao
console → **Firestore** → coleção `users` → documento com o UID dela → campo
`role` = `admin` → atualizar.

Sem esse campo a conta entra como cliente e o `/painel` fica bloqueado — inclusive
para você. É intencional: ninguém consegue se promover pelo navegador.

> **Por que o papel não é um custom claim?** Definir claims exige o Admin SDK (Cloud
> Functions ou um servidor com service account), que este projeto não tem. O campo no
> Firestore é checado pelas regras do servidor, então a autorização é real — só a
> promoção é manual.

---

## Modelo de dados

| Coleção | Conteúdo | Quem lê |
| --- | --- | --- |
| `users/{uid}` | nome, telefone, e-mail, `role` | a própria pessoa e a gestão |
| `appointments/{id}` | atendimento completo (cliente, serviço, valor, status, pagamento) | a dona do agendamento e a gestão |
| `agenda/{profissional}__{data}` | blocos ocupados do dia (horário, duração, status, id do atendimento) | **público** — a grade de horários precisa funcionar antes do login |

A separação entre `appointments` e `agenda` é de privacidade: para calcular horário
livre é preciso saber que 10:00 está ocupado, mas **não** quem é a cliente. O documento
de agenda não tem nome, telefone nem observação.

Cada dia de cada profissional é **um documento** com a lista de blocos. Isso permite
que a checagem de conflito e a gravação aconteçam na mesma transação do Firestore
(o SDK só deixa ler documentos dentro de transação, não consultas). Duas pessoas
disputando o mesmo horário ao mesmo tempo são serializadas: a segunda recebe
"Este horário acabou de ser ocupado" em vez de sobrescrever a primeira.

---

## Estrutura do projeto

```
src/
├── components/       componentes reutilizáveis (shell, cards, stepper, campos, setup)
├── data/             catálogo de serviços, profissionais e registro de imagens
├── lib/
│   ├── backend/      contrato da camada de dados + implementação Firestore
│   ├── firebase.ts   inicialização do SDK e leitura das variáveis de ambiente
│   └── ...           tipos, datas pt-BR, formatação, disponibilidade, no-show
├── routes/           uma pasta por tela; routes/booking e routes/admin para os fluxos
├── state/            provedores de estado (sessão/agendamentos e rascunho de agendamento)
├── test/             back-end em memória e dados de exemplo usados pelos testes
├── App.tsx           mapa de rotas
└── index.css         tokens de design (cores, fontes, sombras) + classes base
```

O mapa completo de rotas está em `src/App.tsx`:

```
/                      Home
/servicos              Catálogo (busca + filtros)
/agendar/servico|expert|horario|revisao|confirmado    Fluxo de agendamento
/meus-agendamentos     Agenda do cliente (exige login)
/painel                Painel Executivo (exige perfil de gestão)
/entrar  /criar-conta  /recuperar-senha               Acesso
```

## Como trocar as cores, fontes e fotos

- **Cores, fontes e sombras:** tudo em `src/index.css`, no bloco `@theme`. Alterar um valor
  muda todas as telas de uma vez.
- **Fotos:** o protótipo usa fotos que não vieram no export. Cada posição mostra hoje um
  placeholder elegante. Para usar as imagens reais, coloque os arquivos em `public/images/`
  e aponte o caminho em `src/data/images.ts` — nenhum outro arquivo precisa mudar.
- **Serviços e preços:** `src/data/catalog.ts` (preços estimados estão marcados com
  `priceEstimated: true` e listados no STATUS.md). O catálogo fica no código, versionado;
  só contas e agendamentos vivem no Firestore.

## Testes

`npm test` roda 39 testes sem rede e sem Firebase: as telas usam uma implementação em
memória do back-end (`src/test/fakeBackend.ts`) com o mesmo contrato do Firestore, e os
dados de exemplo ficam em `src/test/fixtures.ts` — arquivos que **não entram no bundle
de produção**.

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · Firebase 13
(Authentication + Firestore) · lucide-react (ícones) · Vitest + Testing Library (testes).

## Repositório GitHub

Código publicado em **https://github.com/danilot1/EleganceStudio_repo** (branch `main`).
