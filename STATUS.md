# STATUS — o que é real, o que é demonstração e o que falta

Documento de transparência do projeto. Ele existe para o sistema **não** parecer mais pronto
do que está. Hoje há back-end de verdade (Firebase Authentication + Cloud Firestore com regras
de segurança), mas várias funcionalidades continuam ausentes e estão listadas abaixo.

## 1. Funciona de verdade (código, com regra implementada)

| Item | Onde | Observação |
| --- | --- | --- |
| Navegação completa entre todas as telas | `src/App.tsx` | rotas protegidas por perfil |
| Cadastro e login | `src/lib/backend/firestore.ts` | Firebase Authentication (e-mail/senha); a senha é guardada com hash pelo Firebase e nunca passa pelo código do app |
| Sessão persistente | `src/lib/backend/firestore.ts` | "Lembrar-me" escolhe persistência local ou de sessão do SDK |
| Recuperação de senha por e-mail | `src/routes/ForgotPassword.tsx` | envia o link real do Firebase (expira em 1 hora) |
| Autorização por perfil | `firestore.rules` | papel `admin` checado no servidor em toda leitura/escrita, não só na tela |
| Persistência dos agendamentos | Cloud Firestore | dados compartilhados entre dispositivos e visíveis para a gestão |
| Agendamento em 4 etapas com proteção de etapa | `src/routes/booking/` | exige login na confirmação |
| Cálculo de disponibilidade | `src/lib/availability.ts` | grade de 30 min, expediente por dia, almoço, conflito por profissional, horários passados, domingo fechado |
| Checagem de conflito atômica | `src/lib/backend/firestore.ts` | transação sobre o documento do dia/profissional: dois cliques simultâneos não geram dois atendimentos no mesmo horário |
| Contagem de vagas e dia lotado | `src/components/SlotPicker.tsx` | "7 vagas" e "Lotado" são calculados, não fixos |
| Busca e filtros do catálogo | `src/routes/Services.tsx` | por texto, categoria e profissional |
| Cancelar e reagendar (cliente) | `src/components/AppointmentCard.tsx` | reagendamento recalcula disponibilidade e move o bloco na agenda |
| Painel Executivo | `src/routes/admin/AdminAgenda.tsx` | indicadores calculados a partir dos atendimentos do Firestore |
| Iniciar / concluir / cancelar atendimento | `src/components/TimelineCard.tsx` | grava o status no banco e na agenda |
| Registrar pagamento (PIX, débito, crédito, dinheiro) | `src/components/TimelineCard.tsx` | grava forma de pagamento no atendimento |
| Encaixe de cliente na vaga cancelada | `src/components/TimelineCard.tsx` | cria atendimento de balcão já confirmado |
| Registro de falta (no-show) | `src/components/TimelineCard.tsx`, `src/lib/noShow.ts` | só depois do horário marcado; a falta libera a vaga e pode ser revertida |
| Taxa de no-show por período | `src/routes/admin/AdminAgenda.tsx` | falta ÷ atendimentos com desfecho do dia ou da semana |
| Novo atendimento pela gestão | `src/routes/admin/AdminAgenda.tsx` | botão "+ Novo" com escolha de serviço, profissional e horário |
| Verificação automática | `src/**/*.test.ts(x)` | 39 testes (telas, fluxo de agendamento, gestão, autenticação, agenda e no-show), rodando sem rede sobre um back-end em memória |

## 2. Limitações conhecidas do back-end atual

| Item | Como está hoje | O que falta para ser melhor |
| --- | --- | --- |
| Mensagens | nada é enviado: nem confirmação, nem lembrete | integrar e-mail transacional e/ou API do WhatsApp (Cloud Functions ou servidor) |
| Escrita na coleção `agenda` | qualquer pessoa conectada pode gravar um bloco (não há dado pessoal ali) | um cliente mal-intencionado poderia marcar horário como ocupado; a correção é uma Cloud Function validando o vínculo com o agendamento |
| Unicidade garantida pelo cliente | a transação garante consistência porque o app sempre a usa; as regras validam formato, não sobreposição | mover a regra de conflito para o servidor (Cloud Functions) |
| Papel de gestão | promovido à mão no console (`users/{uid}.role = "admin"`) | custom claims definidas pelo Admin SDK |
| Volume de leitura | a gestão lê todos os agendamentos; a agenda lê de 8 dias atrás em diante, sem paginação | paginar por período e filtrar por data no servidor |
| Erros de sincronização | falha de rede na leitura aparece no console; falha de escrita aparece na tela | estado offline explícito / retry com indicador |
| Exclusão de conta e de dados | não existe | fluxo de exclusão (LGPD) com remoção de perfil e histórico |
| Fotos | placeholders em CSS | arquivos em `public/images/` + `src/data/images.ts` |
| Tamanho do bundle | ~967 kB (o SDK do Firebase responde por boa parte) | importar só os módulos usados e dividir o chunk do SDK |

## 3. Não está implementado (nenhuma tela finge que funciona)

Os controles abaixo existem, mas foram deixados **explicitamente** como aviso na tela em vez
de simular sucesso:

- **Login com Apple e Google** — exige configurar os provedores OAuth no Firebase e tratar
  o fluxo de popup/redirect. Os botões avisam que não autenticam.
- **Recuperação por WhatsApp** — o Firebase só envia link por e-mail; a aba existe no layout
  do protótipo e retorna uma mensagem explicando isso.
- **Lembretes e notificações** — exigem serviço de mensagens e jobs agendados (o sino mostra
  o aviso).
- **"Falar Conosco" / telefone da profissional** — nenhum telefone, WhatsApp ou e-mail do
  estúdio foi informado no projeto.
- **Pagamento online** — o protótipo prevê pagamento no local; nenhum gateway foi integrado.
- **Confirmação do atendimento pelo estúdio** — o agendamento nasce como "Aguardando
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
7. **Horários exatos variam.** O print mostra um dia específico (09:00, 10:00, 13:30…). Aqui a
   grade é gerada por regra (30 min, 09:00–19:00, almoço 12:00–13:00) e filtrada pelos
   agendamentos existentes, então os horários mudam por dia e por profissional.
8. **Indicadores calculados.** No print o painel mostra valores fixos (11 atendimentos,
   R$ 2.150, 88%). Aqui eles são calculados sobre os atendimentos gravados no banco, então
   mudam quando você cancela, conclui ou reagenda.
9. **Fontes e cores aproximadas.** Os tokens (`src/index.css`) foram estimados lendo os
   prints: fundo creme `#F6F1E7`, acento bronze `#8B6B2E`, títulos em serif
   (Playfair Display) e corpo em Inter. O wordmark do cabeçalho usa Cinzel, a partir do
   cartão de visita do estúdio. Não são os valores oficiais do design.
10. **Abas de Serviços e Profissionais do painel** aparecem cortadas no print; foram
    implementadas como listas de leitura, sem cadastro/edição de serviços (o protótipo não
    define esse fluxo).
11. **Falta não é cancelamento.** A falta é registrada pela gestão depois do horário marcado,
    libera a vaga no app (como o cancelamento) e pode ser revertida. A taxa de no-show usa como
    denominador só os atendimentos com desfecho (concluídos + faltas) do período — agendamentos
    futuros ainda podem virar presença ou falta, então não entram na conta. Cancelamentos
    aparecem no resumo, mas não entram na taxa.
12. **Agendar exige login.** Antes era possível confirmar deslogado, e o registro não aparecia
    em "Meus Agendamentos". Com o Firestore isso deixou de fazer sentido: as regras exigem
    `clientUserId == uid`, então a etapa de revisão bloqueia a confirmação e oferece entrar ou
    criar conta.
13. **A agenda é separada dos agendamentos.** `agenda/{profissional}__{data}` guarda só
    horário/duração/status, com leitura pública, porque a grade precisa funcionar antes do
    login. Nome, telefone e observação ficam apenas em `appointments/{id}`, legível pela dona e
    pela gestão. A transação que cria o atendimento grava os dois documentos.
14. **Catálogo no código, dados no banco.** Serviços, profissionais e preços são versionados em
    `src/data/catalog.ts`; só contas e agendamentos vivem no Firestore. Editar o catálogo pelo
    painel não foi implementado.
15. **Os testes não tocam no Firebase.** `src/test/fakeBackend.ts` implementa o mesmo contrato
    em memória, e `src/test/fixtures.ts` guarda a agenda de exemplo. Nenhum dos dois entra no
    bundle de produção.

## 5. Próximos passos sugeridos

1. Criar o projeto no Firebase e preencher o `.env` (passo a passo no README) — sem isso o app
   mostra apenas a tela de configuração.
2. Integrar um serviço de mensagens para confirmação e lembretes.
3. Levar a checagem de conflito e a escrita da agenda para Cloud Functions, se o projeto passar
   a valer como produção.
4. Substituir preços estimados pelos valores oficiais e incluir as fotos do estúdio.
5. Paginar as consultas do painel antes de o volume de agendamentos crescer.
