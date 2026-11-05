# Segundo cérebro do EleganceStudio

Esta pasta é um cofre ([vault](https://obsidian.md)) de notas ligadas entre si por `[[wikilinks]]`.
Serve para o projeto não depender da memória de quem trabalhou nele: cada decisão, cada limite e
cada comando tem um lugar.

## Como abrir

1. Instale o **Obsidian** (gratuito).
2. "Open folder as vault" e escolha a pasta `brain/`.
3. Abra [[MOC]] — é o mapa de tudo.
4. Abra a visão **Graph** (ícone de grafo) para ver a teia. O nó central é o MOC; os temas
   (dados, segurança, testes, publicação) formam os cachos.

Os arquivos são Markdown puro: funcionam no GitHub, no VS Code e em qualquer editor, mesmo sem
Obsidian. Só os `[[wikilinks]]` viram texto comum fora do Obsidian.

## Convenções

- **Wikilink**: `[[nome-do-arquivo]]`, sem `.md`. Aponta para o nome exato do arquivo.
- **Frontmatter** no topo de cada nota:
  ```yaml
  ---
  titulo: Nome legível
  tipo: nota-permanente | nota-de-referencia | moc | nota-de-registro
  tags: [tema, tema]
  atualizado: AAAA-MM-DD
  ---
  ```
- **`tipo: moc`** é reservado para notas-índice, como o [[MOC]].
- **Uma ideia por nota**, com o nome dizendo o que ela responde. "documento-de-agenda" e não
  "notas-diversas".
- **Toda nota entra no MOC** e se liga a pelo menos outra nota.
- **Datas absolutas**, nunca "hoje" ou "semana passada".

## O que este cofre NÃO é

- **Não é a fonte da verdade.** `README.md`, `STATUS.md` e `DEPLOY.md` na raiz do projeto são os
  documentos oficiais; o código é a verdade final. Se houver divergência, os três vencem.
- **Não é diário íntimo.** Registro de fase sim ([[registro-de-fases]]), desabafo não.
- **Não duplica o STATUS.** As notas explicam o *porquê* e o *como*; o STATUS lista o que é
  demonstração.

## Notas existentes

Todas listadas e agrupadas no [[MOC]]: projeto, fases, arquitetura, contrato de dados, modelo,
documento de agenda, autenticação, regras, disponibilidade, scripts, testes, publicação, design,
limites, comandos, glossário e registro.

## Manutenção

Ao terminar uma fase do trabalho, atualize a nota do tema **e** o [[registro-de-fases]]. Nota
desatualizada é pior que nota ausente: ela parece confiável.
