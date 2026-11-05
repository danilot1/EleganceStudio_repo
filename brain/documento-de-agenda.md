---
titulo: Documento de agenda (o cadeado da reserva)
tipo: nota-permanente
tags: [firestore, transacao, concorrencia]
atualizado: 2026-11-05
---

# Documento de agenda (o cadeado da reserva)

O problema: duas pessoas reservando 14h com a mesma profissional ao mesmo tempo. Se cada uma
grava seu próprio `appointments/{id}`, as duas conseguem — não existe unicidade entre documentos
no Firestore.

A solução: **um documento por profissional/dia** guarda os blocos ocupados.

```
agenda/{professionalId}__{dateISO}
  professionalId: "p1"
  dateISO: "2026-11-05"
  blocks: [{ appointmentId, start, end, status }]
```

## Por que funciona

A reserva roda dentro de `runTransaction`: lê o documento do dia, confere se o horário colide com
algum bloco, grava o bloco e cria o atendimento. Se duas transações disputam o mesmo documento, o
Firestore serializa — a segunda relê e encontra o horário ocupado. O erro que a segunda pessoa vê
é "Este horário acabou de ser ocupado", não um estado inconsistente.

As operações que passam por ali: criar, cancelar (remove o bloco), reagendar (remove de um dia,
grava em outro), falta (remove) e reversão de falta (devolve).

## O preço pago

Transação no cliente exige que as regras liberem escrita nesse documento para qualquer pessoa
autenticada. E as regras **não conseguem validar sobreposição de horário** — elas só checam
formato (`professionalId` string, `dateISO` string, `blocks` lista). Por isso o documento guarda
apenas identificador, horários e status: **nenhum dado pessoal**. Um cliente malicioso poderia
corromper a agenda, mas não ler nome ou telefone de ninguém. Ver [[limites-e-riscos]].

A alternativa seria uma Cloud Function, que exige plano Blaze e é outro tipo de decisão de custo.
Ficou registrado como caminho de endurecimento futuro.

## Derivados

`src/lib/agendaDoc.ts` concentra a aritmética desse documento: `agendaDocId`, `blocksOf`,
`busyAppointments`, `upsertBlock`, `removeBlock`, `agendaDocsFrom` e `mergeBlocks`. As duas
últimas existem para o backfill, que reconstrói `agenda/` a partir dos agendamentos. Ver
[[scripts-de-dados]] e [[testes]].

`mergeBlocks` é o detalhe que evita estrago: ao reconstruir um dia, ele **preserva** blocos que
não correspondem a nenhum agendamento conhecido (órfãos). Sem isso o backfill apagaria reservas
que ele não entendeu.
