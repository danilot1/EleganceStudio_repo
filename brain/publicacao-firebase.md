---
titulo: Publicação no Firebase
tipo: nota-permanente
tags: [deploy, firebase, operacao]
atualizado: 2026-11-09
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
| Aplicativo | `dist/` (Hosting) | é o que as pessoas abrem no navegador |

`npm run deploy:rules` publica regras e índice; `npm run deploy:app` faz o build e publica o app;
`npm run deploy:all` faz os três.

## O app publicado precisa de build, não de sorte

O Hosting serve arquivos estáticos, então `firebase.json` ganhou reescrita de SPA: qualquer rota
cai no `index.html`. Sem ela, recarregar `/painel` devolve 404 — o clássico "funciona navegando,
quebra ao atualizar a página".

As variáveis `VITE_FIREBASE_*` são lidas no **build**. Publicar de uma máquina sem `.env` gera um
site que abre em modo local, com cada visitante gravando no próprio navegador — pior que não
publicar, porque parece certo. Ver [[limites-e-riscos]].

Validado sem conta: `npm run build` + `npx firebase emulators:start --only hosting` serve o
`dist/` em `127.0.0.1:5000`; raiz e `/painel` respondem 200 com `no-cache` e os arquivos de
`assets/` saem com cache imutável. O header de `no-cache` usa `source: "**"` (antes da regra de
`assets/`) porque o Hosting casa o header com a rota pedida, não com o `index.html` reescrito.

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
3. `npx firebase login` — o projeto já está vinculado (`.firebaserc` → `salao-de-beleza-bf03e`).
4. `npm run deploy:rules` e `npm run deploy:app` (ou `npm run deploy:all`).
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
