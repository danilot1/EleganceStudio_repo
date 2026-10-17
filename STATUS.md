# STATUS — o que é real, o que é demonstração e o que falta

Documento de transparência do protótipo. Ele existe para o projeto **não** parecer mais pronto
do que está: o front-end está completo e funcional, mas **não existe back-end**.

## 1. Funciona de verdade (código, com regra implementada)

| Item | Onde | Observação |
| --- | --- | --- |
| Navegação completa entre todas as telas | `src/App.tsx` | rotas protegidas por perfil |
| Agendamento em 4 etapas com proteção de etapa | `src/routes/booking/` | não deixa pular etapa sem serviço/profissional/horário |
| Cálculo de disponibilidade | `src/lib/availability.ts` | grade de 30 min, expediente por dia, almoço, conflito por profissional, horários passados, domingo fechado |
| Contagem de vagas e dia lotado | `src/components/SlotPicker.tsx` | "7 vagas" e "Lotado" são calculados, não fixos |
| Busca e filtros do catálogo | `src/routes/Services.tsx` | por texto, categoria e profissional |
| Cadastro, login e sessão | `src/state/AppState.tsx` | local; "Lembrar-me" decide entre localStorage e sessionStorage |
| Recuperação de senha | `src/routes/ForgotPassword.tsx` | valida o contato no cadastro local (nenhuma mensagem sai) |
| Cancelar e reagendar (cliente) | `src/components/AppointmentCard.tsx` | reagendamento recalcula disponibilidade real |
| Painel Executivo | `src/routes/admin/AdminAgenda.tsx` | indicadores calculados a partir dos atendimentos |
| Iniciar / concluir / cancelar atendimento | `src/components/TimelineCard.tsx` | muda o status de verdade |
| Registrar pagamento (PIX, débito, crédito, dinheiro) | `src/components/TimelineCard.tsx` | grava forma de pagamento no atendimento |
| Encaixe de cliente na vaga cancelada | `src/components/TimelineCard.tsx` | cria atendimento de balcão já confirmado |
| Registro de falta (no-show) | `src/components/TimelineCard.tsx`, `src/lib/noShow.ts` | só depois do horário marcado; a falta libera a vaga na agenda e pode ser revertida |
| Taxa de no-show por período | `src/routes/admin/AdminAgenda.tsx` | calculada sobre falta ÷ atendimentos com desfecho do dia ou da semana |
| Novo atendimento pela gestão | `src/routes/admin/AdminAgenda.tsx` | botão "+ Novo" com escolha de serviço, profissional e horário |
| Verificação automática | `src/App.test.tsx`, `src/state/AppState.test.tsx`, `src/lib/*.test.ts` | 38 testes (telas, fluxo de agendamento, gestão, autenticação, agenda e no-show) |

## 2. Existe, mas é demonstração (NÃO é produção)

| Item | Como está hoje | O que falta para ser real |
| --- | --- | --- |
| Persistência | `localStorage` do navegador (`src/lib/storage.ts`) | banco de dados + API (ex.: PostgreSQL/MySQL no back-end) |
| Autenticação | usuário e senha gravados no `localStorage`, senha em texto puro | servidor de autenticação, hash de senha (bcrypt/argon2), sessão com cookie/token |
| Perfil de admin | verificado no navegador (`src/components/guards.tsx`) | autorização no servidor — hoje qualquer pessoa poderia alterar o estado local |
| Dados de exemplo | carga inicial em `src/lib/storage.ts`, deslocada para "hoje" a cada dia | dados reais do estúdio |
| Indicadores do painel | calculados sobre os dados locais | calcular no servidor, com histórico e filtros por período |
| Taxa de no-show | calculada no navegador sobre os atendimentos locais | calcular no servidor, sobre o histórico completo do estúdio |
| Fotos | placeholders em CSS | arquivos em `public/images/` + `src/data/images.ts` |

## 3. Não está implementado (nenhuma tela finge que funciona)

Os controles abaixo existem no protótipo, mas foram deixados **explicitamente** como aviso na
tela em vez de simular sucesso:

- **Login com Apple e Google** — exige OAuth/OpenID com um provedor de identidade.
- **Recuperação de senha por e-mail ou WhatsApp** — exige servidor de e-mail e API do WhatsApp.
- **Lembretes e notificações** — exigem serviço de mensagens e jobs agendados (o sino mostra o aviso).
- **"Falar Conosco" / telefone da profissional** — nenhum telefone, WhatsApp ou e-mail do
  estúdio foi informado no projeto.
- **Pagamento online** — o protótipo prevê pagamento no local; nenhum gateway foi integrado.
- **Confirmação do atendimento pelo estúdio** — hoje o agendamento nasce como "Aguardando
  Confirmação" e ninguém é avisado, porque não há envio de mensagens.

## 4. Decisões tomadas e divergências em relação ao protótipo

1. **Telas ausentes foram projetadas.** O protótipo enviado tem as etapas: Serviço (etapa 1)
   **não enviada**, Expert (etapa 2) **não enviada**, Data & Hora (etapa 3) enviada, Revisão
   (etapa 4) **não enviada** e o comprovante **não enviado**. As três telas ausentes e o
   comprovante foram construídos seguindo o stepper e o estilo da etapa 3 — são coerentes, mas
   **não são cópia fiel** do Stitch.
2. **Nenhuma referência de desktop.** Todas as telas enviadas são mobile (~390 px). A área do
   cliente é uma coluna central de até 560 px; o Painel Executivo vira duas colunas em telas
   grandes. Essa decisão de layout é deste projeto, não do protótipo.
3. **Preços estimados.** Apareceram no protótipo: Corte & Visagismo R$ 180, Escova R$ 130,
   Mechas R$ 390, Manicure R$ 75 e Limpeza de Pele & LED R$ 210. Os demais são estimativas
   (marcadas com `priceEstimated: true` em `src/data/catalog.ts`):
   Lavagem Especial 90, Hidratação Profunda 160, Coloração Glow 250, Botox Capilar 280,
   Progressiva Orgânica 450, Pedicure Spa 95, Combo Pés e Mão 150, Podologia Completa 220,
   Design de Sobrancelha 70, Depilação Facial 110.
4. **Descrições de serviço reconstruídas.** O texto do print é pequeno e parte está cortada;
   as descrições foram reescritas no mesmo tom. Os depoimentos da Home também.
5. **Catálogo com 15 itens, não 14.** O filtro do print mostra "Todos (14)". A seção de
   estética aparece cortada, e uma cliente tem agendamento de "Limpeza de Pele Profunda & LED"
   — esse serviço existe no catálogo, então a contagem do filtro é dinâmica e mostra 15.
6. **Divergência de duração no protótipo.** A Home mostra "Mechas & Balayage — 180 min" e o
   catálogo mostra "Mechas · Luzes Iluminadas — 2h30". Vale a duração do catálogo (150 min),
   porque é a mesma tela que define o serviço.
7. **"Próximos (3)" em Meus Agendamentos.** O print mostra (2). O Painel mostra a mesma cliente
   (Mariana Silveira) em um atendimento de hoje, e os dois registros pertencem à mesma conta —
   mantivemos a coerência dos dados em vez de duplicar a cliente.
8. **Horários exatos variam.** O print mostra um dia específico (09:00, 10:00, 13:30…). Aqui a
   grade é gerada por regra (30 min, 09:00–19:00, almoço 12:00–13:00) e filtrada pelos
   agendamentos existentes, então os horários mudam por dia e por profissional.
9. **Indicadores calculados.** No print o painel mostra valores fixos (11 atendimentos,
   R$ 2.150, 88%). Aqui eles são calculados sobre os atendimentos registrados, então mudam
   quando você cancela, conclui ou reagenda.
10. **Fontes e cores aproximadas.** Os tokens (`src/index.css`) foram estimados lendo os
    prints: fundo creme `#F6F1E7`, acento bronze `#8B6B2E`, títulos em serif
    (Playfair Display) e corpo em Inter. Não são os valores oficiais do design.
11. **Abas de Serviços e Profissionais do painel** aparecem cortadas no print; foram
    implementadas como listas de leitura, sem cadastro/edição de serviços (o protótipo não
    define esse fluxo).
12. **Agendamento sem login é permitido.** Um agendamento feito deslogado não aparece em "Meus
    Agendamentos", porque não fica vinculado a uma conta — a tela de revisão avisa isso.
13. **Falta não é cancelamento.** A falta é registrada pela gestão depois do horário marcado,
    libera a vaga no app (como o cancelamento) e pode ser revertida. A taxa de no-show usa como
    denominador só os atendimentos com desfecho (concluídos + faltas) do período — agendamentos
    futuros ainda podem virar presença ou falta, então não entram na conta. Cancelamentos
    aparecem no resumo, mas não entram na taxa.

## 5. Próximos passos sugeridos

1. Definir o repositório no GitHub e preservar o histórico.
2. Escolher o back-end (linguagem e banco) e mover `src/lib/storage.ts` para uma API real.
3. Implementar autenticação com hash de senha e autorização por perfil no servidor.
4. Integrar um serviço de mensagens para confirmação e lembretes.
5. Substituir preços estimados pelos valores oficiais e incluir as fotos do estúdio.
