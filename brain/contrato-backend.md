---
titulo: Contrato de dados (local × Firestore)
tipo: nota-permanente
tags: [arquitetura, backend, firebase]
atualizado: 2026-11-05
---

# Contrato de dados (local × Firestore)

`src/lib/backend/` existe para uma coisa: **as telas não saberem de onde vêm os dados**.

- `types.ts` — a interface `Backend`: operações assíncronas (listar, criar, cancelar, reagendar,
  concluir, registrar falta, editar serviço…).
- `local.ts` — implementação que usa `localStorage`. É o padrão, e o motivo de o app abrir sem
  configuração nenhuma.
- `firestore.ts` — implementação real sobre Auth + Firestore, com transações.
- `index.ts` — escolhe uma das duas conforme o `.env` (`VITE_FIREBASE_*` presentes ou não).
- `servicePatch.ts` — regra compartilhada de edição de serviço (duração, preço, ativa/inativa),
  para as duas implementações validarem igual.

## A regra de ouro

Nenhum arquivo em `routes/` ou `components/` importa `firebase` diretamente. Quem garante isso é
o lint mental de revisão e a estrutura: se um componente precisa de dado novo, primeiro entra no
contrato. Consequência prática: **ligar o Firebase não mudou uma linha de tela**.

## Modo local (padrão)

Sem `.env`, tudo é navegador. O app abre com a demonstração já carregada, contas
`mariana@exemplo.com` e `gestao@elegance.com` (senha `elegance123`), e os dados de exemplo são
deslocados para "hoje" a cada dia — por isso a agenda nunca aparece vazia numa apresentação.

Limites honestos: senha em texto puro, autorização só no navegador, e conflito de horário
resolvido por estado sincronizado entre abas (duas abas conversam pelo evento `storage`), não por
transação. Ver [[limites-e-riscos]].

## Modo Firebase

Com as variáveis preenchidas, a mesma interface passa a falar com Auth + Firestore:

- cadastro cria a conta no Auth **e** o documento `users/{uid}` com `role: "cliente"`;
- reserva, cancelamento, reagendamento, no-show e edição de serviço usam transação onde há
  concorrência (ver [[documento-de-agenda]]);
- desativar um serviço com agendamento futuro é **recusado** — exige consulta por
  `serviceId` + `dateISO`, que é exatamente o índice composto publicado na fase 6.

`resetDemo` não existe no Firebase: não há "recomeçar do zero" pelo app, só pelo script com
`--force`. Ver [[scripts-de-dados]].
