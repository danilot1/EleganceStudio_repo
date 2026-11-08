---
titulo: Avisos por e-mail
tipo: nota-permanente
tags: [email, notificacoes, firebase]
atualizado: 2026-11-09
---

# Avisos por e-mail

O produto tinha um furo visível: a cliente reservava, o agendamento nascia "Aguardando
Confirmação" e ninguém avisava ninguém. A gestão confirmava e a cliente só descobria abrindo o app.

## A decisão central: o app não envia, o app pede

`src/lib/notifications.ts` monta o aviso (assunto, texto e HTML) e grava um **documento em
`mail/`** no formato que a extensão oficial do Firebase ("Trigger Email from Firestore") consome:

```js
{ to, message: { subject, text, html }, delivery: { state: 'PENDING' } }
```

A consequência é a mais importante desta nota: **ligar o envio de verdade não exige tocar em
nenhuma tela**. Instala-se a extensão, aponta-se um servidor SMTP e os pedidos que já estavam
parados começam a sair.

## Os três avisos

| Aviso | Quando sai | Quem dispara |
| --- | --- | --- |
| `confirmacao` | na hora em que a cliente agenda | tela de revisão (só com conta) |
| `confirmado` | quando a gestão confirma o horário | cartão do atendimento no painel |
| `lembrete` | véspera do atendimento | abertura do painel (idempotente) |

O lembrete usa **id determinístico** (`lembrete-{appointmentId}`): abrir o painel dez vezes no
mesmo dia não manda dez e-mails. É o tipo de detalhe que só aparece depois do primeiro cliente
reclamando de spam.

## Quem recebe — e quem não recebe

Duas fontes, nesta ordem: o **e-mail informado no agendamento** e, se não houver, o **do cadastro**.
A etapa de revisão pede o endereço (opcional, validado) justamente para a convidada — sem conta —
também receber confirmação e lembrete. Antes disso, só quem tinha conta recebia.

Continua sem aviso o atendimento de balcão criado pela recepção, que não passa por formulário e
nasce sem endereço. Nesse caso a tela diz que o comprovante é o registro, em vez de prometer uma
mensagem que não existe. Ver [[limites-e-riscos]] e [[modelo-de-dados]].

## O lembrete depende de alguém abrir o painel

Sem Cloud Functions (o projeto não está no plano Blaze), não existe job agendado. O lembrete é
gerado quando a gestão abre o painel — na prática, todo dia. Um envio verdadeiramente agendado é a
evolução natural: cron de Worker ou função agendada lendo a mesma coleção `mail/`.

## O que o modo demonstração faz

Sem `.env`, o pedido vai para uma caixa de saída em `localStorage` (`outbox`) e aparece no painel
como "Avisos por e-mail registrados", com a frase que importa: **o envio depende do serviço
configurado**. Nada finge ter saído.

## Segurança

As regras em [[regras-de-seguranca]] permitem que a cliente **crie** o pedido (inclusive sem
conta), mas validam o formato: destinatário com cara de e-mail, assunto e corpo com tamanho
limitado, e `delivery.state == 'PENDING'`. Ler o resultado, mudar o estado e apagar é da gestão e
da extensão. Sem esse limite, a coleção viraria um relay de spam.

## Passo a passo do envio real

Em `DEPLOY.md`, seção "Avisos por e-mail". Resumo: conta em um provedor (Resend, SendGrid,
Postmark), extensão instalada com a URI SMTP e a coleção `mail`, e um `FROM` verificado no domínio.

Ver [[testes]] para os testes que cobrem esta nota.
