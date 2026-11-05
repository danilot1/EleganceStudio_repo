---
titulo: EleganceStudio
tipo: nota-permanente
tags: [projeto, visao-geral]
atualizado: 2026-11-05
---

# EleganceStudio

Sistema de agendamento para um estúdio de podologia e beleza, construído a partir das telas do
Google Stitch para o Projeto Integrador da UNICAP. O front-end já estava pronto; o trabalho
seguinte foi dar a ele um back-end de verdade.

## Dois lados, um cadastro

- **Cliente** — Home, catálogo, agendamento em 4 etapas, criar conta, entrar, recuperar senha e
  "Meus Agendamentos" (próximos e histórico).
- **Gestão** — Painel Executivo com calendário (mês, semana, dia), indicadores do dia, agenda com
  início/conclusão de atendimento, pagamento, reagendamento, encaixe, falta (no-show), consulta de
  clientes, equipe e catálogo editável.

O ponto de virada do projeto: **as telas não sabem com quem estão falando**. Toda tela conversa
com `useAppState()`, e uma camada única decide se os dados vêm do navegador ou do Firestore. É o
que permite trocar o back-end sem reescrever tela nenhuma — ver [[contrato-backend]] e
[[arquitetura-frontend]].

## Estado em uma frase

Front-end completo, back-end Firebase implementado em seis fases, testado no emulador e **ainda
não publicado** — publicar exige a conta do dono do projeto. Ver [[fases-do-plano]] e
[[publicacao-firebase]].

## Onde as coisas ficam

| Assunto | Nota |
| --- | --- |
| Como o app é organizado por dentro | [[arquitetura-frontend]] |
| A camada que troca local por Firestore | [[contrato-backend]] |
| Coleções, tipos e regras de papel | [[modelo-de-dados]] |
| O cadeado que impede dois agendamentos no mesmo horário | [[documento-de-agenda]] |
| Login, sessão e quem é gestão | [[autenticacao-e-papeis]] |
| O que cada perfil pode ler e escrever | [[regras-de-seguranca]] |
| Grade de horários, conflito e falta | [[disponibilidade-e-no-show]] |
| Carga e reconstrução de dados | [[scripts-de-dados]] |
| O que está provado por teste | [[testes]] |
| Regras, índice e checklist de publicação | [[publicacao-firebase]] |
| Cores, fontes e imagens | [[design-e-identidade]] |
| O que não funciona e por quê | [[limites-e-riscos]] |
| Comandos do dia a dia | [[comandos]] |
| Palavras que aparecem no projeto | [[glossario]] |
| Linha do tempo das fases | [[registro-de-fases]] |

Volte sempre pelo [[MOC]].
