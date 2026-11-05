---
titulo: Publicação no Firebase
tipo: nota-permanente
tags: [deploy, firebase, operacao]
atualizado: 2026-11-05
---

# Publicação no Firebase

Fase 6. Tudo que dá para preparar e validar sem a conta do dono está pronto; **nada foi
publicado**. O guia operacional completo é `DEPLOY.md` na raiz do projeto — esta nota guarda o
porquê.

## O que é publicado

| Item | Arquivo | Por quê |
| --- | --- | --- |
| Regras de acesso | `firestore.rules` | é a segurança de verdade do sistema |
| Índice composto | `firestore.indexes.json` | consulta por `serviceId` + `dateISO` ao desativar serviço |

`npm run deploy:rules` publica os dois (`firebase deploy --only firestore:rules,firestore:indexes`).

## O índice não é decoração

Ao desativar um serviço, o app checa se existem agendamentos futuros para ele — consulta com
filtro em dois campos. Sem índice composto, o Firestore devolve `failed-precondition` e a tela
quebra. Declarar só esse índice (e nenhum "preventivo") é intencional: índice errado custa
escrita em toda gravação e não resolve nada.

## Como validar sem publicar

```bash
npm run deploy:rules -- --dry-run
```

Lê `firebase.json`, compila as regras e resolve os alvos, e para antes do envio. Sem login, o
erro é exatamente `Failed to authenticate, have you run firebase login?` — é assim que se separa
"falta conta" de "configuração inválida". Resultado desta validação: **só falta conta**.

## O que só o dono faz

1. Criar o projeto, habilitar Authentication (e-mail/senha) e Firestore em modo produção.
2. Registrar o app Web e preencher o `.env` (`VITE_FIREBASE_*`).
3. `npx firebase login` e `npx firebase use --add`.
4. `npm run deploy:rules`.
5. Criar a primeira conta de gestão pela tela e promover no console — ver
   [[autenticacao-e-papeis]].

## Checklist que importa

O item mais valioso é **duas pessoas, dois aparelhos, mesmo horário**: um recebe "horário
ocupado" e a agenda mostra um atendimento só. É a única prova que o emulador não dá — ver
[[testes]].

Depois: isolamento entre clientes (incluindo `permission-denied` esperado), cancelamento
devolvendo vaga, no-show, e desativar um serviço sem `failed-precondition` (prova do índice).

## Reversão

O console mantém histórico de regras; republicar uma versão anterior restaura o comportamento na
hora, sem redeploy do app. Regra publicada errada é incidente de segundos, não de horas.
