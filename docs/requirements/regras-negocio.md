# Regras de negócio

1. O expediente para chamadas ocorre das 07:00 às 17:00.
2. Tipos de senha: SP (prioritária), SE (retirada de exames) e SG (geral).
3. A ordem-base é `SP → SE/SG → SP → SE/SG`.
4. SP tem prioridade máxima.
5. SE é atendida depois de SP quando existir e possui prioridade operacional especial.
6. SG possui menor prioridade.
7. Qualquer guichê pode atender qualquer tipo.
8. Após duas chamadas sem comparecimento, a senha é descartada como `NAO_COMPARECEU`.
9. O painel mostra somente as cinco últimas chamadas; não mostra a próxima senha.
10. A sequência da senha possui três dígitos e reinicia diariamente para cada tipo.
11. A senha segue a máquina de estados definida na especificação.
12. O atendimento iniciado deve ser finalizado pelo atendente.
13. O relatório detalhado deixa os campos de atendimento vazios quando a senha não foi atendida.

## Fluxo clínico do paciente

1. O paciente cria uma conta com e-mail, senha, nome, CPF, data de nascimento e telefone; o perfil vem da autenticação e não pode ser escolhido no formulário.
2. Uma solicitação pertence ao paciente autenticado e começa em `SOLICITADO`.
3. A equipe aprova a solicitação (`AGUARDANDO_CONFIRMACAO`) e confirma a data/horário (`AGENDADO`).
4. Somente uma solicitação agendada pode registrar chegada; esse evento define `NA_ESPERA` e o horário de entrada.
5. A fila clínica é ordenada pelo horário registrado de chegada, independentemente das senhas legadas SP/SE/SG.
6. A chamada muda o estado para `CHAMADO`; iniciar o atendimento registra `EM_ATENDIMENTO` e o funcionário responsável.
7. A coleta segue `EM_COLETA → COLETA_REALIZADA`; o atendimento segue para `ATENDIMENTO_FINALIZADO` e só então pode registrar `CONCLUIDO` (saída).
8. Falta é permitida para agendamento confirmado; cancelamento é permitido antes da chegada.
9. Cada mudança de estado gera evento no histórico e notificação para o paciente.
10. O pedido médico aceita PDF/JPG/PNG até 5 MB e só pode ser baixado pelo próprio paciente ou pela equipe autenticada.
11. O tempo de permanência é calculado entre chegada e saída; espera entre chegada e início; atendimento entre início e finalização.
