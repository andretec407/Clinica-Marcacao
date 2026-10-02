# Casos de uso

## UC01 — Emitir senha
**Ator:** Cliente (AC)

1. Cliente acessa o totem.
2. Seleciona SP, SE ou SG.
3. Sistema gera a sequência do dia.
4. Sistema registra a senha como AGUARDANDO.
5. Sistema apresenta a senha ao cliente.

## UC02 — Chamar próxima senha
**Ator:** Atendente (AA)

1. AA informa o guichê.
2. Sistema valida se o AA possui atendimento ativo.
3. Sistema bloqueia a seleção concorrente.
4. Sistema aplica a regra de prioridade.
5. Sistema vincula senha ao AA e ao guichê.
6. Sistema registra a chamada na auditoria.

## UC03 — Iniciar atendimento
**Ator:** Atendente (AA)

1. AA seleciona iniciar atendimento.
2. Sistema valida o estado CHAMADA ou CHAMADA_NOVAMENTE.
3. Sistema muda para EM_ATENDIMENTO e registra o horário.

## UC04 — Finalizar atendimento
**Ator:** Atendente (AA)

1. AA seleciona finalizar.
2. Sistema valida EM_ATENDIMENTO.
3. Sistema muda para ATENDIDA.
4. Sistema registra o horário de finalização.

## UC05 — Chamar novamente
**Ator:** Atendente (AA)

1. AA solicita nova chamada.
2. Sistema registra a segunda chamada.
3. Sistema muda para CHAMADA_NOVAMENTE.
4. Caso a senha não seja atendida após as duas chamadas, ela é marcada como NÃO_COMPARECEU.

## UC06 — Consultar painel
**Ator:** Cliente (AC)

O painel consulta periodicamente a API e mostra a última chamada e as cinco últimas senhas chamadas, com guichê.

## UC07 — Consultar relatórios
**Ator:** Gestor/Atendente autorizado

Consulta indicadores, detalhamento e auditoria.
