---
titulo: Registro de fases
tipo: nota-de-registro
tags: [registro, git, historico]
atualizado: 2026-11-05
---

# Registro de fases

Linha do tempo do trabalho, na ordem em que foi feito. Cada linha corresponde a um commit real —
o histórico é a fonte, esta nota é a leitura dele.

| # | Fase | Commit | O que ficou provado |
| --- | --- | --- | --- |
| — | Calendário de mês/semana/dia e gestão de serviços | `cb624f2`, `0c2ad7b` | agenda navegável e catálogo editável pela gestão |
| — | Tipografia Fraunces | `e8a9dab` | identidade visual fechada antes do back-end |
| 0/1 | Camada de dados isolada | `e5c01fd` | telas falam só com `useAppState()` |
| 2 | Firebase Auth + adaptador Firestore | `d0c0061` | login real sem mudar tela |
| 3 | Reserva transacional | `84fbfdc` | conflito de horário resolvido no documento do dia |
| 4 | Regras + testes no emulador | `5b7cdf7` | 17 testes de regra passando |
| 5 | Seed e backfill | `535be2f` | demonstração recarregável e `agenda/` reconstruível |
| 6 | Publicação preparada | `825f970` | índice composto, `deploy:rules`, `DEPLOY.md` |
| 6 | Dry-run documentado | `5531e9a` | bloqueio é a conta, não a configuração |

## Leitura do percurso

O padrão que se repetiu: **fechar uma camada, provar, só então abrir a próxima**. Isolar dados
antes de ligar Firebase evitou reescrever telas. Autenticar antes de escrever em produção evitou
regra permissiva sem dono. Provar as regras no emulador antes de publicar evitou descobrir
`permission-denied` com o estúdio usando o sistema.

## O que a fase 6 ensinou

Validar em modo de ensaio muda a conversa: em vez de "acho que está pronto, falta publicar", o
resultado diz **onde** para — `Failed to authenticate, have you run firebase login?`. Um bloqueio
com nome é um bloqueio resolvível. Ver [[publicacao-firebase]].

## Próximo registro

Quando a publicação acontecer, vale registrar aqui: data, o que foi publicado, resultado do
checklist de duas pessoas no mesmo horário, e qualquer surpresa. Ver [[limites-e-riscos]].
