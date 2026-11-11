# STATUS — o que é real, o que é demonstração e o que falta

Documento de transparência do protótipo. O raciocínio por trás das decisões está no segundo
cérebro de notas: **[brain/MOC.md](./brain/MOC.md)**.Ele existe para o projeto **não** parecer mais pronto do que está: o front-end está completo, a
camada de dados está isolada e o back-end Firebase está implementado (fases 2–5) e preparado para
publicar (fase 6). O que realmente falta é a **publicação no projeto do estúdio** e o **envio de
mensagens** aos clientes — nada disso é código pendente.

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
| Calendário da agenda (mês, semana e dia) | `src/components/AgendaCalendar.tsx`, `src/lib/agenda.ts` | grade domingo–sábado, setas de período, contagem de vagas por dia e blocos livres/ocupados/fechados |
| Clique no bloco livre abre o atendimento | `src/routes/admin/AdminAgenda.tsx` | já preenchido com profissional, data e horário do bloco |
| Consulta de clientes pela gestão | `src/routes/admin/AdminAgenda.tsx` | nome, contato, atendimentos concluídos, última visita e próximo agendamento |
| Bloqueio de atendimento fora do expediente | `src/lib/availability.ts` | recusa serviço cuja duração terminaria depois do fechamento |
| Iniciar / concluir / cancelar atendimento | `src/components/TimelineCard.tsx` | muda o status de verdade |
| Registrar pagamento (PIX, débito, crédito, dinheiro) | `src/components/TimelineCard.tsx` | grava forma de pagamento no atendimento |
| Encaixe de cliente na vaga cancelada | `src/components/TimelineCard.tsx` | cria atendimento de balcão já confirmado |
| Registro de falta (no-show) | `src/components/TimelineCard.tsx`, `src/lib/noShow.ts` | só depois do horário marcado; a falta libera a vaga na agenda e pode ser revertida |
| Taxa de no-show por período | `src/routes/admin/AdminAgenda.tsx` | calculada sobre falta ÷ atendimentos com desfecho do dia ou da semana |
| Novo atendimento pela gestão | `src/routes/admin/AdminAgenda.tsx` | botão "+ Novo" com escolha de serviço, profissional e horário |
| Camada de dados trocável | `src/lib/backend/` | contrato único (`Backend`) com implementação local e operações assíncronas; o adaptador Firebase entra pelo mesmo contrato, sem tocar em nenhuma tela |
| Gestão de serviços e horários | `src/routes/admin/AdminAgenda.tsx`, `src/lib/backend/local.ts` | a gestão ajusta duração, preço e ativa/desativa cada serviço; a nova duração passa a reservar os blocos da agenda e a montar os horários do agendamento |
| Verificação automática | `src/App.test.tsx`, `src/state/AppState.test.tsx`, `src/lib/*.test.ts` | 78 testes (telas, fluxo de agendamento, gestão, calendário, conflito de horários, autenticação, agenda, no-show, documento de agenda e avisos por e-mail) |
| Verificação das regras do Firestore | `tests/rules.test.ts` | 23 testes no emulador (`npm run test:rules`): dono do agendamento, convidada, autopromoção a gestão, catálogo restrito e pedidos de e-mail |
| Seed e backfill da agenda | `scripts/seed.ts`, `src/lib/agendaDoc.ts` | `npm run seed:demo` recria contas, agendamentos e documentos de agenda no emulador; `npm run seed:backfill` reconstrói `agenda/{profissional}__{dia}` dos agendamentos existentes (inclusive os anteriores à fase 3) e preserva blocos órfãos; os dois conferem o resultado relendo do Firestore |
| Avisos por e-mail | `src/lib/notifications.ts`, `src/lib/backend/` | três avisos montados e registrados: pedido recebido, horário confirmado e lembrete de véspera; o destinatário é o e-mail informado no agendamento (inclusive da convidada) ou o do cadastro; o pedido segue o formato da coleção `mail/` da extensão oficial do Firebase |
| Lembrete de véspera sem duplicar | `src/lib/notifications.ts` | id derivado do atendimento: abrir o painel várias vezes no mesmo dia registra um lembrete por atendimento |

## 2. Existe, mas é demonstração (NÃO é produção)

| Item | Como está hoje | O que falta para ser real |
| --- | --- | --- |
| Persistência | `localStorage` do navegador (`src/lib/backend/local.ts`) | adaptador Firestore (fase 3); a interface já está pronta e as telas não mudam |
| Conflito de horário | no modo local, checado antes de gravar com o estado sincronizado entre abas; no modo Firebase, transação no documento `agenda/{profissional}__{dia}` — duas gravações simultâneas são serializadas | nenhuma pendência para o conflito; falta apenas rodar a verificação em dois aparelhos reais |
| Autenticação | modo local: usuário e senha no `localStorage`, senha em texto puro; com `.env`, o Firebase Auth assume (a senha nunca passa pelo Firestore) | no modo local, servidor de autenticação com hash de senha |
| Perfil de admin | verificado no navegador (`src/components/guards.tsx`); com `.env`, as regras do Firestore repetem a checagem | testes das regras no emulador (fase 4) e custom claim `role: admin` para a gestão |
| Dados de exemplo | carga inicial em `src/lib/storage.ts`, deslocada para "hoje" a cada dia; no Firebase, a mesma carga é gravada por `npm run seed:demo` | dados reais do estúdio |
| Indicadores do painel | calculados sobre os dados locais | calcular no servidor, com histórico e filtros por período |
| Taxa de no-show | calculada no navegador sobre os atendimentos locais | calcular no servidor, sobre o histórico completo do estúdio |
| Fotos | catálogo preenchido com fotos CC0 de banco de imagens (`public/images/`) e mapa ainda em placeholder | trocar pelos arquivos do estúdio, mantendo os nomes (ver `public/images/CREDITOS.md`) |
| Publicação | `firebase.json` publica as regras, o índice composto (`firestore.indexes.json`) e o app em Hosting (`dist/`, com reescrita de SPA); `npm run deploy:rules`, `npm run deploy:app` e `npm run deploy:all` executam, e `DEPLOY.md` lista o passo a passo e o checklist | falta rodar no projeto do dono (login, projeto, região) — nada foi publicado, e a primeira conta de gestão precisa ser promovida no console |

## 3. Não está implementado (nenhuma tela finge que funciona)

Os controles abaixo existem no protótipo, mas foram deixados **explicitamente** como aviso na
tela em vez de simular sucesso:

- **Login com Apple e Google** — exige OAuth/OpenID com um provedor de identidade.
- **Recuperação de senha por e-mail ou WhatsApp** — exige servidor de e-mail e API do WhatsApp.
- **Lembretes e notificações** — o aplicativo registra o pedido de e-mail (coleção `mail/`),
  mas o envio real depende de instalar o serviço de e-mail no projeto (ver `DEPLOY.md`).
- **"Falar Conosco" / telefone da profissional** — nenhum telefone, WhatsApp ou e-mail do
  estúdio foi informado no projeto.
- **Pagamento online** — o protótipo prevê pagamento no local; nenhum gateway foi integrado.
- **Confirmação do atendimento pelo estúdio** — a gestão confirma no painel e isso gera o aviso
  por e-mail; sem o serviço de e-mail instalado, o pedido fica registrado e não sai.
- **Lembrete automático sem ninguém abrir o app** — o lembrete é gerado quando a gestão abre o
  painel; um job agendado exigiria Cloud Functions ou um Worker com cron.

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
    (Fraunces) e corpo em Inter. Não são os valores oficiais do design. A wordmark da logo
    usa Cinzel (capitais romanas), mantida por ter sido ajustada à foto de referência.
11. **Abas de Serviços, Clientes e Profissionais do painel** aparecem cortadas no print; foram
    implementadas como leitura (catálogo, contatos e equipe), sem cadastro/edição de serviços
    (o protótipo não define esse fluxo).
12. **Agendamento sem login é permitido.** Um agendamento feito deslogado não aparece em "Meus
    Agendamentos", porque não fica vinculado a uma conta — a tela de revisão avisa isso. Em troca,
    essa tela pede um e-mail: é por ele que a convidada recebe confirmação e lembrete.
13. **Falta não é cancelamento.** A falta é registrada pela gestão depois do horário marcado,
    libera a vaga no app (como o cancelamento) e pode ser revertida. A taxa de no-show usa como
    denominador só os atendimentos com desfecho (concluídos + faltas) do período — agendamentos
    futuros ainda podem virar presença ou falta, então não entram na conta. Cancelamentos
    aparecem no resumo, mas não entram na taxa.
14. **Calendário em três visões.** A agenda da gestão tem visão Mês (grade de domingo a sábado
    com vagas por dia), Semana e Dia (grade de 30 minutos por profissional). Verde = livre,
    vermelho = ocupado, cinza = fechado (fora do expediente, almoço ou horário que já passou).
    O domingo continua sem expediente e o sábado fecha às 14h.
15. **Agenda sincronizada entre telas.** Gestão e cliente leem a mesma fonte de disponibilidade,
    e o estado é recarregado quando outra aba grava (`storage`). Uma reserva feita em outra aba
    passa a ocupar o horário imediatamente — mas duas gravações no mesmo instante, em aparelhos
    diferentes, ainda precisam de um back-end com transação para serem realmente atômicas.

## 5. Próximos passos sugeridos

1. Publicar as regras e o índice no projeto do estúdio e criar a primeira conta de gestão
   (`DEPLOY.md`). É o único passo que exige a conta do dono do projeto.
2. Verificar em dois aparelhos reais, ao mesmo tempo, no mesmo horário — a única prova que o
   emulador não dá.
3. Instalar o serviço de e-mail no projeto (extensão + provedor): os pedidos de aviso já são
   registrados em `mail/`, mas só saem depois desse passo — ver `DEPLOY.md`.
4. Endurecer a escrita em `agenda/`: mover a transação para uma Cloud Function (plano Blaze),
   para que as regras possam recusar escrita direta do cliente.
5. Substituir preços estimados pelos valores oficiais e incluir as fotos do estúdio.
