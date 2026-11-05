---
titulo: Scripts de dados (seed e backfill)
tipo: nota-permanente
tags: [scripts, firebase, dados]
atualizado: 2026-11-05
---

# Scripts de dados (seed e backfill)

`scripts/seed.ts` usa o **Admin SDK**, não o cliente. Motivo: criar contas de autenticação, definir
papéis e escrever fora das regras é operação de dono do projeto, não de navegador. O Admin SDK
ignora as regras por definição.

## Os dois modos

| Comando | O que faz | Seguro em produção? |
| --- | --- | --- |
| `npm run seed:demo` | apaga e recria contas, atendimentos e agenda com a demonstração | **Não** — recria tudo do zero |
| `npm run seed:backfill` | reconstrói `agenda/` a partir dos agendamentos existentes | Sim — não apaga nada |

`--demo` fora do emulador exige `--force`. É uma trava deliberada: apagar a base de um estúdio por
engano não tem desfazer.

## Por que o build passa pelo Vite

`scripts/vite.seed.config.ts` empacota `scripts/seed.ts` em `dist-seed/seed.mjs` (`publicDir:
false`, `build.ssr`). Motivo prático: o script importa código de `src/` com as extensões de import
do app, e o Vite resolve isso sem que se mexa em `tsconfig`. O pacote final roda em Node.

## O backfill e os blocos órfãos

`agendaDocsFrom` agrupa os agendamentos por profissional/dia; `mergeBlocks` grava os blocos
correspondentes e **preserva blocos que não batem com nenhum agendamento**. Sem isso, um documento
de agenda que contivesse uma reserva não rastreada seria limpo.

Foi validado de verdade no emulador: 20 agendamentos geraram 13 documentos de agenda; os 13 foram
apagados e recriados pelo backfill; uma segunda execução não alterou nada (idempotência).

## Aviso conhecido

`MetadataLookupWarning` ao rodar no emulador é inofensivo — o Admin SDK tenta descobrir metadados
do ambiente de nuvem.

## O que o script confere

Depois de gravar, ele relê do Firestore: contagem de agendamentos, exatamente **uma** conta de
gestão, e presença dos blocos. Script que não verifica o próprio efeito é script que mente.

Ver [[documento-de-agenda]] para o formato gravado e [[comandos]] para os comandos.
