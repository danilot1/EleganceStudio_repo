# Membros 
Danilo Teixeira de Carvalho <br>
Dayvson Henrique da Silva Mendes <br>
Diana da Silva <br>
Gabrielly Gouveia da Silva Feitosa <br>
Marcos Vinícius Medeiros Ferreira <br>
Pedro Mota Mendes <br>

# EleganceStudio — Podologia Especializada & Salão de Beleza

Front-end funcional do EleganceStudio, construído a partir das telas geradas no
**Google Stitch** para o Projeto Integrador da UNICAP.

Cobre os dois lados do sistema:

- **Cliente:** Home, catálogo de serviços, agendamento em 4 etapas, criar conta, entrar,
  recuperar senha e "Meus Agendamentos" (próximos e histórico).
- **Gestão:** Painel Executivo com calendário (mês, semana e dia), indicadores do dia, agenda do
  dia com ações de início/conclusão de atendimento, registro de pagamento, reagendamento,
  encaixe de cliente, registro de falta (no-show), consulta de clientes e visão da equipe e do
  catálogo.

> Leia também o **[STATUS.md](./STATUS.md)**: ele separa o que funciona de verdade do que é
> apenas demonstração. Nada é simulado como se estivesse pronto.
>
> Para publicar no Firebase (regras, índice, primeira gestão e checklist), siga o
> **[DEPLOY.md](./DEPLOY.md).**
>
> O raciocínio por trás das decisões está no segundo cérebro de notas:
> **[brain/MOC.md](./brain/MOC.md)** (Markdown com `[[wikilinks]]`, abre como cofre no Obsidian).

---

## Como rodar localmente

Pré-requisito: **Node.js 20+** (testado com Node 24) e npm.

```bash
npm install       # instala as dependências do package-lock.json
npm run dev       # abre em http://localhost:3000
```

Outros comandos:

```bash
npm run typecheck   # só a checagem de tipos
npm run build       # gera a versão de produção em dist/
npm test            # roda os testes (Vitest + Testing Library)
npm run lint        # análise estática (oxlint)
npm run test:rules  # testes das regras no emulador (precisa de Java)
npm run seed:demo   # carrega a demonstração no emulador (precisa de Java)
npm run seed:backfill  # reconstrói os documentos de agenda dos agendamentos
npm run deploy:rules   # publica regras + índices (precisa de `firebase login`)
npm run preview     # serve o resultado do build
```

## Back-end (Firebase)

O aplicativo funciona **em modo local por padrão**: sem configuração, os dados ficam no
navegador, como na demonstração. Para ligar o Firebase:

```bash
cp .env.example .env   # preencha as variáveis VITE_FIREBASE_*
npm run dev
```

Nenhuma tela muda: as telas conversam apenas com `useAppState()`, e `src/lib/backend/` decide
qual implementação responde — `local` sem `.env` e `firestore` com as variáveis preenchidas.

| Fase | Situação |
| --- | --- |
| 0. Base (dependência, `.env.example`, `firebase.json`) | concluída |
| 1. Camada de dados isolada (`src/lib/backend`) | concluída |
| 2. Autenticação real (Firebase Auth) | concluída — login, cadastro, recuperação por e-mail e "Lembrar-me" |
| 3. Agenda transacional no Firestore | concluída — `agenda/{profissional}__{dia}` serializa a reserva |
| 4. Security Rules + testes de regra | concluída — 23 testes no emulador (`npm run test:rules`) |
| 5. Seed e backfill da agenda | concluída — `scripts/seed.ts` grava a demonstração e reconstrói `agenda/` a partir dos agendamentos, com verificação no emulador |
| 6. Publicação das rules e do índice | pronta para publicar — `npm run deploy:rules` e o passo a passo em `DEPLOY.md`; a publicação em si exige o projeto Firebase do dono |

## Contas de demonstração

O primeiro acesso cria os dados de exemplo automaticamente no navegador
(senha das duas contas: `elegance123`):

| Perfil | E-mail | Para quê |
| --- | --- | --- |
| Cliente | `mariana@exemplo.com` | ver "Meus Agendamentos", cancelar e reagendar |
| Gestão (admin) | `gestao@elegance.com` | abrir o Painel Executivo (`/painel`) |

Na tela **Entrar** existem dois botões "usar" que preenchem o formulário com essas contas.

## Estrutura do projeto

```
src/
├── components/       componentes reutilizáveis (shell, cards, stepper, campos, tokens visuais)
├── data/             catálogo de serviços, profissionais e registro de imagens
├── lib/              tipos, datas pt-BR, formatação, disponibilidade, no-show e persistência local
│   ├── backend/      contrato de dados (`Backend`) + implementação local
│   └── firebase.ts   inicialização do Firebase (Auth + Firestore), lida do `.env`
├── routes/           uma pasta por tela; routes/booking e routes/admin para os fluxos
├── state/            provedores de estado (dados/sessão e rascunho de agendamento)
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

## Agenda da gestão

O calendário fica em `/painel` (entre com `gestao@elegance.com`):

- **Mês:** grade de domingo a sábado com a quantidade de vagas de cada dia, setas para trocar de
  mês e botão "Hoje".
- **Semana:** os sete dias com os atendimentos de cada um.
- **Dia:** grade de 30 minutos por profissional. Verde = livre, vermelho = ocupado, cinza =
  fechado (fora do expediente, almoço ou horário que já passou). Um bloco verde abre o
  atendimento de balcão já preenchido com aquele horário.

O horário reservado sai da disponibilidade do cliente no mesmo instante, porque as duas telas
leem os mesmos dados (`src/lib/agenda.ts` e `src/lib/availability.ts`). A grade é responsiva:
no celular o mês usa sete colunas compactas e a visão Dia rola na horizontal, sem cortar texto.

## Avisos por e-mail

O aplicativo **não envia e-mail: ele registra o pedido** na coleção `mail/`, no formato da
extensão oficial *Trigger Email from Firestore*. Três avisos são montados:

| Aviso | Quando | Quem dispara |
| --- | --- | --- |
| Pedido recebido | ao concluir o agendamento (com conta) | tela de revisão |
| Horário confirmado | ao confirmar no painel | cartão do atendimento |
| Lembrete de véspera | véspera do atendimento | abertura do painel |

Sem o serviço de e-mail configurado, os pedidos ficam registrados (no modo local aparecem em
**Painel → Agenda → Avisos por e-mail**) e nenhuma tela finge que a mensagem saiu. Para ativar o
envio, siga a seção "Avisos por e-mail" do **[DEPLOY.md](./DEPLOY.md)**. O lembrete usa um id
derivado do atendimento, então abrir o painel várias vezes não duplica aviso.

## Como trocar as cores, fontes e fotos

- **Cores, fontes e sombras:** tudo em `src/index.css`, no bloco `@theme`. Alterar um valor
  muda todas as telas de uma vez.
- **Fotos:** o protótipo usa fotos que não vieram no export. Cada posição mostra hoje um
  placeholder elegante. Para usar as imagens reais, coloque os arquivos em `public/images/`
  e aponte o caminho em `src/data/images.ts` — nenhum outro arquivo precisa mudar.
- **Serviços e preços:** o catálogo base fica em `src/data/catalog.ts` (preços estimados
  marcados com `priceEstimated: true`, listados no STATUS.md). A gestão pode ajustar duração,
  preço e disponibilidade em **Painel → Serviços**, sem editar código.

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · lucide-react (ícones) ·
Firebase (Authentication + Firestore, opcional) · Vitest + Testing Library (testes).

## Repositório GitHub

Código publicado em **https://github.com/danilot1/EleganceStudio_repo** (branch `main`).
O histórico local desta máquina tem os mesmos arquivos, mas foi criado por outro caminho,
então os SHAs dos commits diferem dos do GitHub.

