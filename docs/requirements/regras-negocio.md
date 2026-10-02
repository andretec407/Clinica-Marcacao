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
