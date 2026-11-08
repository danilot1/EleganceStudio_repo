---
titulo: Regras de segurança
tipo: nota-permanente
tags: [firestore, regras, seguranca]
atualizado: 2026-11-05
---

# Regras de segurança

`firestore.rules` segue um princípio só: **negar por padrão** e abrir o mínimo por coleção.

## Funções base

```
signedIn()      request.auth != null
isAdmin()       lê users/{uid}.role == 'admin'   (nunca do navegador)
ownsAppointment(data)  data.clientUserId == uid
```

## O que cada coleção permite

| Coleção | Ler | Escrever |
| --- | --- | --- |
| `users/{uid}` | a própria pessoa **ou** gestão | criar só a si, sempre `cliente`; update não muda `role`; delete negado |
| `appointments` | gestão ou dono do atendimento | criar: gestão, convidada (sem conta) ou a própria pessoa; update: gestão ou dono; delete: gestão |
| `agenda` | todos | criar/update com formato válido (é o cadeado da reserva); delete só gestão |
| `serviceOverrides` | todos | só gestão |

## As três decisões que explicam o resto

1. **Agendamento sem conta continua permitido.** O protótipo permitia agendar deslogado; a regra
   aceita `clientUserId == null`. A consequência é dita na tela de revisão: um agendamento feito
   sem login não aparece em "Meus Agendamentos".
2. **`agenda` aberta para escrita.** Consequência de fazer a transação no cliente — ver
   [[documento-de-agenda]]. O documento é deliberadamente sem dados pessoais.
3. **`users` fechado para leitura cruzada.** A gestão vê contatos; uma cliente não vê o cadastro
   de outra. Efeito visível: lista de clientes vazia para quem não é gestão.
   Ver [[autenticacao-e-papeis]].

## Como isso é provado

23 testes rodando as regras no emulador (`npm run test:rules`), cobrindo dono, convidada,
autopromoção a gestão, catálogo restrito e pedidos de e-mail válidos contra malformados. Ver
[[testes]].

Publicar: `npm run deploy:rules` — e, antes, `--dry-run` para validar sem enviar. Ver
[[publicacao-firebase]].
