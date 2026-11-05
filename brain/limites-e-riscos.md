---
titulo: Limites e riscos
tipo: nota-permanente
tags: [riscos, transparencia]
atualizado: 2026-11-05
---

# Limites e riscos

Documento de honestidade. Se algo aqui surpreender alguém depois, é falha deste cofre.

## Riscos técnicos reais

1. **`agenda` é gravável por qualquer pessoa autenticada.** Consequência direta de fazer a
   transação no cliente sem Cloud Function: as regras não validam sobreposição de horário. O
   documento não tem dados pessoais, então o pior caso é corrupção de disponibilidade, não
   vazamento. Endurecer exige plano Blaze — ver [[documento-de-agenda]].
2. **Modo local não é seguro.** Senha em texto puro no `localStorage` e autorização no navegador.
   É demonstração, e o app deixa isso explícito ao não fingir multi-dispositivo.
3. **Sem envio de mensagem.** Confirmação de atendimento, lembretes e aviso de cancelamento não
   saem do sistema. O agendamento nasce "Aguardando Confirmação" e ninguém é avisado.
4. **`resetDemo` é inerte no Firebase.** Não existe "recomeçar do zero" pelo app; só pelo script
   com `--force`.

## O que é estimativa, não dado

- **Preços**: cinco vieram do protótipo, dez são estimativa (`priceEstimated: true`).
- **Descrições e depoimentos**: reescritos porque o print estava cortado.
- **Cores e fontes**: aproximadas dos prints.
- **Fotos**: placeholders.

## O que não existe e nenhuma tela finge

Login com Apple/Google, recuperação por WhatsApp, lembretes automáticos, "Falar Conosco" (nenhum
telefone do estúdio foi informado) e pagamento online. Os controles aparecem com aviso, em vez de
simular sucesso.

## Pendências fora do código

- **Publicar** no projeto Firebase do estúdio — ver [[publicacao-firebase]].
- **Conferir em celular de verdade** e com duas pessoas reservando ao mesmo tempo.
- **Substituir estimativas** por dados oficiais do estúdio.

`STATUS.md` na raiz é a versão canônica e mais detalhada desta lista; esta nota é o resumo de
trabalho.
