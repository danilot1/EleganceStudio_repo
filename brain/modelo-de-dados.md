---
titulo: Modelo de dados
tipo: nota-permanente
tags: [dados, firestore, modelo]
atualizado: 2026-11-05
---

# Modelo de dados

Quatro coleções no Firestore, todas com nome em português de domínio. Tipos em
`src/lib/types.ts`; conversão e leitura em `src/lib/backend/firestore.ts`.

## `users/{uid}`

Perfil de cada pessoa. O `uid` é o do Firebase Auth, então documento e conta são a mesma
identidade.

| Campo | Para quê |
| --- | --- |
| `name`, `email`, `phone` | identificação e contato |
| `role` | `"cliente"` ou `"admin"` — **fonte da verdade do perfil** |
| `createdAt` | ordenação e relatórios |

Regra: nasce sempre `cliente`; o próprio usuário não consegue mudar o `role`. Promover alguém é
operação de console/Admin SDK. Ver [[autenticacao-e-papeis]].

## `appointments/{id}`

Um atendimento. Guarda serviço, profissional, data/hora, duração, preço, status
(`aguardando`, `confirmado`, `em_atendimento`, `concluido`, `cancelado`, `falta`) e
`clientUserId` — que é `null` em agendamento de convidada (sem conta).

`clientUserId` é o campo que as regras usam para decidir quem lê o quê. Ver
[[regras-de-seguranca]].

## `agenda/{profissional}__{data}`

O cadeado da reserva: um documento por profissional e dia, com a lista de blocos ocupados. É o
que impede dois agendamentos no mesmo horário. Explicado em [[documento-de-agenda]].

## `serviceOverrides/{serviceId}`

Ajustes da gestão sobre o catálogo base (`src/data/catalog.ts`): duração, preço e
ativa/inativa. O catálogo em código é o padrão; o override é a exceção editável sem deploy.
Escrita só da gestão.

## Catálogo, não tabela

Serviços e profissionais vivem em `src/data/`, em código. Foi decisão de escopo: o estúdio não
tem tela de cadastro de serviço no protótipo, e uma coleção `services/` só faria sentido com
cadastro completo. A gestão ajusta o que precisa em `serviceOverrides/`.

## Preços estimados

Cinco preços vieram do protótipo; os outros dez são estimativa marcada com
`priceEstimated: true` em `src/data/catalog.ts` e listada em `STATUS.md`. Não é dado real do
estúdio — ver [[limites-e-riscos]].
