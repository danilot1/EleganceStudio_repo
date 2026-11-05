---
titulo: Disponibilidade, conflito e falta
tipo: nota-permanente
tags: [regras-de-negocio, agenda]
atualizado: 2026-11-05
---

# Disponibilidade, conflito e falta

Tudo aqui é função pura em `src/lib/`, sem React: é o que torna o comportamento testável e igual
nas duas telas (cliente e gestão).

## Grade de horários

`src/lib/availability.ts` gera blocos de 30 minutos dentro do expediente, e filtra:

- **expediente**: 09:00–19:00, sábado até 14:00, **domingo fechado**;
- **almoço**: 12:00–13:00 fora da grade;
- **horários passados**: não aparecem;
- **conflito por profissional**: um serviço de 90 min ocupa três blocos seguidos;
- **fim do expediente**: serviço cuja duração terminaria depois do fechamento é recusado, em vez
  de ser cortado.

A contagem "7 vagas" e o selo "Lotado" em `SlotPicker.tsx` são calculados, não fixos.

## Conflito

- **Modo local**: checagem antes de gravar, com estado sincronizado entre abas pelo evento
  `storage`. Uma reserva em outra aba ocupa o horário imediatamente — mas duas gravações no mesmo
  instante, em aparelhos diferentes, não são atômicas.
- **Modo Firebase**: transação no documento do dia. Ver [[documento-de-agenda]].

É a diferença central entre a demonstração e o sistema real.

## Falta (no-show)

`src/lib/noShow.ts`, com uma regra que parece detalhe e não é: **só é permitida depois do horário
marcado**. Antes disso o atendimento ainda pode acontecer.

Efeitos: a falta libera a vaga na agenda (como um cancelamento) e pode ser revertida — reverter
devolve o bloco. A taxa de no-show usa como denominador só os atendimentos **com desfecho**
(concluídos + faltas) do período; futuros ainda podem virar presença, então não entram na conta.
Cancelamentos aparecem no resumo, mas não na taxa. Ver [[testes]].

## Agenda em três visões

Mês (grade domingo–sábado com vagas por dia), Semana (sete dias com atendimentos) e Dia (grade de
30 min por profissional, verde/vermelho/cinza). Clicar num bloco verde abre atendimento de balcão
já preenchido com aquele horário. Implementação em [[arquitetura-frontend]].
