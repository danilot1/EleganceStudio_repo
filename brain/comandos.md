---
titulo: Comandos
tipo: nota-de-referencia
tags: [referencia, comandos]
atualizado: 2026-11-05
---

# Comandos

## Dia a dia

```bash
npm install          # dependências do package-lock.json
npm run dev          # http://localhost:3000
npm run build        # produção em dist/
npm run preview      # serve o build
npm run typecheck    # só tipos
npm run lint         # oxlint
npm test             # 78 testes de aplicação
```

## Firebase e dados

```bash
npm run test:rules       # 23 testes de regra no emulador (precisa de Java)
npm run seed:demo        # demonstração no emulador (apaga e recria)
npm run seed:backfill    # reconstrói agenda/ a partir dos agendamentos
npm run deploy:rules     # publica regras + índices (precisa de firebase login)
npm run deploy:rules -- --dry-run   # valida sem enviar
```

## Publicação, na ordem

```bash
npx firebase login
npx firebase use --add
npm run deploy:rules
```

## Java no emulador

Se o emulador reclamar de Java, o JDK portátil deste ambiente fica em `~/.local/jdk21`:

```bash
export JAVA_HOME="$HOME/.local/jdk21"
export PATH="$JAVA_HOME/bin:$PATH"
```

## Git

```bash
git log --oneline -10
git status --short
git diff --stat
```

## Modo Firebase

```bash
cp .env.example .env    # preencher VITE_FIREBASE_*
npm run dev
```

Sem `.env`, o app é local. Ver [[contrato-backend]].

## Onde ver o resultado

- Regras e índice: [[publicacao-firebase]]
- Testes: [[testes]]
- Scripts de dados: [[scripts-de-dados]]
