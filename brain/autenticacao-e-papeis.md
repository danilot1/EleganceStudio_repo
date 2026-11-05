---
titulo: Autenticação e papéis
tipo: nota-permanente
tags: [auth, firebase, seguranca]
atualizado: 2026-11-05
---

# Autenticação e papéis

Duas verdades diferentes convivem: **quem é você** (Firebase Auth) e **o que você pode fazer**
(campo `role` em `users/{uid}`).

## Modo local

`src/state/AppState.tsx` guarda a sessão no `localStorage` (ou `sessionStorage`, com
"Lembrar-me"). Senha em texto puro, comparação no navegador. Serve para demonstração, não para
produção — está em [[limites-e-riscos]].

## Modo Firebase

- **Cadastro**: `createUserWithEmailAndPassword` e, com o `uid`, grava `users/{uid}` com
  `role: "cliente"`. A regra de criação aceita **apenas** esse papel.
- **Login**: sessão persistida pelo SDK; o app lê o perfil para saber se é gestão.
- **Recuperação**: `sendPasswordResetEmail` — esse e-mail o Firebase envia de verdade.

## Ninguém se promove

A promoção a gestão é feita **fora do app**, no console (ou por Admin SDK): abrir
`users/{uid}`, trocar `role` para `admin`. As regras impedem update que mude `role`, então a
própria pessoa não consegue se promover nem por chamada direta ao Firestore. É intencional; a
única fricção aceitável em troca de não ter porta dos fundos.

Primeira gestão, na prática: criar a conta pela tela `/criar-conta` e promover no console. Passo
a passo em [[publicacao-firebase]].

## Duas guardas, um objetivo

`src/components/guards.tsx` impede abrir `/painel` sem perfil de gestão — conveniência de navegação.
As regras do Firestore repetem a checagem (`isAdmin()` lê `users/{uid}.role`) — essa é a
segurança. Guarda de tela, sozinha, não protege nada. Ver [[regras-de-seguranca]].

## Efeito colateral conhecido

Como cada usuário só lê o próprio documento em `users/`, a lista de contas de clientes no painel
aparece vazia no modo Firebase para quem não é gestão — e o mesmo vale para dados de clientes
derivados de `appointments`. Não é bug; é o isolamento funcionando. A gestão lê tudo.
