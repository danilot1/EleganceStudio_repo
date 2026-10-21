# EleganceStudio — Podologia Especializada & Salão de Beleza

Front-end funcional do EleganceStudio, construído a partir das telas geradas no
**Google Stitch** para o Projeto Integrador da UNICAP.

# Membros 
Danilo Teixeira de Carvalho <br>
Dayvson Henrique da Silva Mendes 
Diana da Silva
Gabrielly Gouveia da Silva Feitosa
Marcos Vinícius Medeiros Ferreira 
Pedro Mota Mendes


Cobre os dois lados do sistema:

- **Cliente:** Home, catálogo de serviços, agendamento em 4 etapas, criar conta, entrar,
  recuperar senha e "Meus Agendamentos" (próximos e histórico).
- **Gestão:** Painel Executivo com indicadores, linha do tempo do dia, ações de início/conclusão
  de atendimento, registro de pagamento, reagendamento, encaixe de cliente e registro de falta
  (no-show) com taxa calculada por período.

> Leia também o **[STATUS.md](./STATUS.md)**: ele separa o que funciona de verdade do que é
> apenas demonstração (não há back-end neste projeto). Nada é simulado como se estivesse pronto.

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
npm run preview     # serve o resultado do build
```

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

## Como trocar as cores, fontes e fotos

- **Cores, fontes e sombras:** tudo em `src/index.css`, no bloco `@theme`. Alterar um valor
  muda todas as telas de uma vez.
- **Fotos:** o protótipo usa fotos que não vieram no export. Cada posição mostra hoje um
  placeholder elegante. Para usar as imagens reais, coloque os arquivos em `public/images/`
  e aponte o caminho em `src/data/images.ts` — nenhum outro arquivo precisa mudar.
- **Serviços e preços:** `src/data/catalog.ts` (preços estimados estão marcados com
  `priceEstimated: true` e listados no STATUS.md).

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · lucide-react (ícones) ·
Vitest + Testing Library (testes).

## Repositório GitHub

Código publicado em **https://github.com/danilot1/EleganceStudio_repo** (branch `main`).
O histórico local desta máquina tem os mesmos arquivos, mas foi criado por outro caminho,
então os SHAs dos commits diferem dos do GitHub.

