---
titulo: Arquitetura do front-end
tipo: nota-permanente
tags: [frontend, react, arquitetura]
atualizado: 2026-11-05
---

# Arquitetura do front-end

React 19 + TypeScript + Vite + Tailwind 4 + React Router 7. Nada de framework de estado externo:
um provedor de estado próprio sustenta tudo.

## As camadas

```
routes/        uma pasta por tela (/painel, /meus-agendamentos, /agendar/...)
components/    shell, cards, stepper, calendário, campos, guards
state/         AppState (dados + sessão) e rascunho do agendamento
lib/           regras puras: datas, disponibilidade, agenda, no-show, formatação
lib/backend/   contrato de dados + implementação local + adaptador Firestore
data/          catálogo, profissionais, registro de imagens
```

A regra que sustenta o desenho: **regra de negócio não mora em componente**. Disponibilidade,
conflito e no-show vivem em `lib/` como funções puras, e por isso são testáveis sem montar tela —
é o que permite 60+ testes rápidos. Ver [[testes]].

## Estado e sessão

`src/state/AppState.tsx` expõe `useAppState()`: catálogo, agendamentos, clientes, sessão atual e
as ações (criar, cancelar, reagendar, concluir, registrar falta…). Nenhuma tela chama Firestore
diretamente; ela pede uma ação e o backend escolhido responde. Detalhe em [[contrato-backend]].

"Lembrar-me" decide onde a sessão vive: `localStorage` quando marcado, `sessionStorage` quando
não. No modo local a senha fica em texto puro — um limite explícito, listado em
[[limites-e-riscos]].

## Rotas

```
/                      Home
/servicos              Catálogo (busca + filtros)
/agendar/servico|expert|horario|revisao|confirmado
/meus-agendamentos     exige login
/painel                exige perfil de gestão
/entrar  /criar-conta  /recuperar-senha
```

`src/components/guards.tsx` protege `/painel` e `/meus-agendamentos`. No modo Firebase a mesma
checagem é repetida nas regras do Firestore — guarda de tela não é segurança, é conveniência. Ver
[[regras-de-seguranca]].

## Calendário

`src/components/AgendaCalendar.tsx` desenha mês, semana e dia a partir de `src/lib/agenda.ts`.
Verde = livre, vermelho = ocupado, cinza = fechado (fora do expediente, almoço ou horário passado).
No celular o mês usa sete colunas compactas e a visão Dia rola na horizontal. Regras em
[[disponibilidade-e-no-show]].

## Estilo

Sem CSS por componente: tokens em `src/index.css` (bloco `@theme`) e classes utilitárias. Trocar
uma cor ali muda todas as telas. Ver [[design-e-identidade]].
