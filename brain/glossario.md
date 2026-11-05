---
titulo: Glossário
tipo: nota-de-referencia
tags: [referencia, glossario]
atualizado: 2026-11-05
---

# Glossário

Termos que aparecem no projeto e nas notas, em linguagem direta.

**MOC (Map of Content)** — nota-índice que aponta para as outras. Aqui: [[MOC]]. Funciona como
sumário navegável; no Obsidian, é o nó central do grafo.

**Wikilink** — ligação no formato `[[nome-da-nota]]`. Cria a teia entre notas e é o que desenha o
grafo; ligação para nota inexistente aparece como pendente, o que também é útil.

**Vault (cofre)** — a pasta que o Obsidian abre como um todo. Aqui: `brain/`.

**Grafo** — visualização das notas como pontos e dos wikilinks como linhas.

**Backend / camada de dados** — no projeto, o contrato `Backend` que decide entre `local` e
`firestore`. Ver [[contrato-backend]].

**Transação** — operação do Firestore que lê e grava de forma indivisível; duas ao mesmo tempo são
serializadas. É o que impede duas reservas no mesmo horário. Ver [[documento-de-agenda]].

**Índice composto** — índice de dois campos, necessário para consultas que filtram por ambos.
Declarado em `firestore.indexes.json`. Ver [[publicacao-firebase]].

**Emulador** — versão local do Firestore/Auth, usada para testes de regra e seed, sem tocar em
produção. Precisa de Java.

**Regras (security rules)** — código que o Firestore executa para autorizar cada leitura e escrita.
Ver [[regras-de-seguranca]].

**Seed** — carga inicial de dados de demonstração.

**Backfill** — reconstruir dados derivados a partir dos dados existentes; aqui, `agenda/` a partir
dos agendamentos, preservando blocos órfãos. Ver [[scripts-de-dados]].

**No-show (falta)** — cliente que não apareceu; só pode ser registrado depois do horário marcado.
Ver [[disponibilidade-e-no-show]].

**Dry-run** — execução de ensaio que valida sem aplicar efeito; usada no deploy das regras.

**Guard** — componente que bloqueia rota por perfil. Conveniência, não segurança. Ver
[[autenticacao-e-papeis]].

**`clientUserId`** — campo do agendamento que liga o atendimento a uma conta; `null` em
agendamento de convidada. É o que as regras usam para decidir leitura.
