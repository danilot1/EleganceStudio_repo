---
titulo: Testes
tipo: nota-permanente
tags: [testes, qualidade]
atualizado: 2026-11-05
---

# Testes

Duas suítes com naturezas diferentes, de propósito.

## Aplicação — 76 testes, 7 arquivos

`npm test` (Vitest + Testing Library + jsdom).

| Arquivo | Cobre |
| --- | --- |
| `src/App.test.tsx` | navegação, fluxo de agendamento, telas principais |
| `src/state/AppState.test.tsx` | sessão, cadastro, login, permissões, ações da gestão |
| `src/lib/availability.test.ts` | grade, almoço, domingo, conflito, fim de expediente |
| `src/lib/agenda.test.ts` | calendário mês/semana/dia, contagem de vagas |
| `src/lib/noShow.test.ts` | janela de falta, liberação e reversão da vaga |
| `src/lib/agendaDoc.test.ts` | documento do dia, merge de blocos, backfill |
| `src/lib/notifications.test.ts` | avisos por e-mail, janela do lembrete e formato do documento `mail` |

A maior parte testa **função pura**, não pixel: é o que mantém a suíte rápida e o motivo de a
regra de negócio não morar em componente. Ver [[arquitetura-frontend]].

## Regras — 23 testes, no emulador

`npm run test:rules` sobe o emulador do Firestore (`--project elegance-rules-test`) e usa
`@firebase/rules-unit-testing`. Cobre: dono lendo o próprio atendimento, convidada,cliente tentando se promover a gestão, leitura cruzada de `users/`, catálogo restrito à gestão e
pedidos de e-mail válidos (inclusive de convidada) contra pedido malformado.

Esses testes são os únicos que provam que `firestore.rules` faz o que promete — ver
[[regras-de-seguranca]].

## O que os testes não provam

- **Duas pessoas reais em dois aparelhos** reservando o mesmo horário: a transação é testada em
  lógica, mas a corrida real só aparece em produção. É o primeiro item do checklist de
  [[publicacao-firebase]].
- **Interface no celular**: responsividade foi decidida por código e conferida a olho; não há
  teste visual automatizado.
- **Login real no Firebase**: o fluxo de Auth não é exercitado pelos testes; o emulador é usado
  para dados e regras.

Estado na última execução: `npm test` 76/76, `npm run test:rules` 23/23, `typecheck` e `lint`
limpos.
