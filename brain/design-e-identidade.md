---
titulo: Design e identidade
tipo: nota-permanente
tags: [design, frontend]
atualizado: 2026-11-05
---

# Design e identidade

A identidade visual veio dos prints do Stitch e foi reconstruída em tokens — não em valores
espalhados por arquivos.

## Onde mexer

`src/index.css`, bloco `@theme`. Uma cor ali muda todas as telas de uma vez:

| Token | Valor aproximado | Uso |
| --- | --- | --- |
| fundo | `#F6F1E7` (creme) | superfícies |
| acento | `#8B6B2E` (bronze) | botões, detalhes |
| títulos | Fraunces | serifada dos títulos |
| corpo | Inter | texto |

A wordmark da marca usa **Cinzel** (capitais romanas) por ter sido ajustada contra a foto de
referência. Os valores são estimativa lendo os prints, não o arquivo oficial do designer — está
registrado como divergência em `STATUS.md`.

## Fotos

O export não trouxe as imagens. Cada posição mostra um placeholder elegante em CSS. Para usar as
reais: colocar os arquivos em `public/images/` e apontar em `src/data/images.ts`. Nenhum outro
arquivo muda — é o mesmo princípio do [[contrato-backend]], aplicado a mídia.

## Layout

Todas as telas recebidas são mobile (~390 px), então a área do cliente é uma coluna central de até
560 px. O Painel Executivo vira duas colunas em telas grandes. **Não havia referência de desktop**:
essa decisão é do projeto, não do protótipo.

No celular, o calendário usa sete colunas compactas no mês e rolagem horizontal na visão Dia, sem
cortar texto. Ver [[arquitetura-frontend]].

## O que ainda não é final

Preços estimados (dez de quinze), descrições de serviço reescritas no mesmo tom porque o print
estava cortado, e depoimentos recriados. Tudo listado em [[limites-e-riscos]] e em `STATUS.md`.
