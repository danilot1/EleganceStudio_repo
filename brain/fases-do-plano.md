---
titulo: Fases do plano
tipo: nota-permanente
tags: [plano, fases, git]
atualizado: 2026-11-05
---

# Fases do plano

O back-end foi construído em seis fases, cada uma com um objetivo verificável e um commit
próprio. A ordem importa: cada fase só começa quando a anterior está provada, porque uma camada
mal fechada contamina a seguinte.

| Fase | Objetivo | Commit |
| --- | --- | --- |
| 0 | Base: dependência do Firebase, `.env.example`, `firebase.json` com emuladores | `e5c01fd` (refactor da camada de dados, junto da fase 1) |
| 1 | Isolar a camada de dados: contrato `Backend` com implementação local | `e5c01fd` |
| 2 | Autenticação real com Firebase Auth + adaptador Firestore | `d0c0061` |
| 3 | Reserva transacional no documento de agenda | `84fbfdc` |
| 4 | Security Rules + 17 testes no emulador | `5b7cdf7` |
| 5 | Seed da demonstração e backfill da agenda | `535be2f` |
| 6 | Publicação das regras e do índice composto | `825f970`, `5531e9a` |

## O que cada fase entregou

- **Fase 1 — camada de dados.** `src/lib/backend/` nasce com o contrato `Backend`, a implementação
  `local` e o adaptador `firestore` entrando pelo mesmo contrato. As telas continuam falando só
  com `useAppState()`. Detalhe em [[contrato-backend]].
- **Fase 2 — autenticação.** Login, cadastro, recuperação de senha por e-mail e "Lembrar-me"
  passam pelo Firebase Auth. O papel de gestão vem do documento `users/{uid}`, nunca do navegador.
  Ver [[autenticacao-e-papeis]].
- **Fase 3 — agenda transacional.** A reserva lê e grava um documento por profissional/dia dentro
  de uma transação, então duas pessoas no mesmo horário não conseguem as duas. Ver
  [[documento-de-agenda]].
- **Fase 4 — regras.** `firestore.rules` com negação por padrão e 17 testes no emulador. Ver
  [[regras-de-seguranca]] e [[testes]].
- **Fase 5 — dados.** `scripts/seed.ts` recria a demonstração no emulador e reconstrói os
  documentos de agenda de agendamentos antigos. Ver [[scripts-de-dados]].
- **Fase 6 — publicação.** `firestore.indexes.json` com o índice composto, `firebase.json`
  apontando regras e índices, script `deploy:rules` e o guia `DEPLOY.md`. Ver
  [[publicacao-firebase]].

## A fase 6 não fechou de verdade

Ela está concluída **até o limite da máquina**: o deploy foi validado em modo de ensaio e falha
exatamente na autenticação (`Failed to authenticate, have you run firebase login?`). Publicar de
fato depende de entrar na conta Firebase do estúdio — ver [[limites-e-riscos]].

## Por que essa ordem

Foi a resposta a um risco concreto: o app guardava tudo no navegador e o cálculo de horário
ocupado era local. Sem uma camada de dados isolada, ligar o Firebase significaria reescrever
dezenas de telas. Isolar primeiro, autenticar depois, e só então trocar a escrita por transação,
manteve cada passo reversível — e cada passo com teste próprio.
