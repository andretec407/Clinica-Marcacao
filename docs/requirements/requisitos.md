# Requisitos do nassauTickets

## Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | Emitir senha anonimamente pelo totem. |
| RF02 | Gerar numeração `YYMMDD-PPSQ`. |
| RF03 | Reiniciar a sequência diária por tipo de senha. |
| RF04 | Manter fila nos tipos SP, SE e SG. |
| RF05 | Selecionar a próxima senha conforme a regra de prioridade. |
| RF06 | Permitir ao atendente escolher o guichê e chamar a próxima senha. |
| RF07 | Permitir iniciar e finalizar o atendimento. |
| RF08 | Permitir chamar novamente uma senha. |
| RF09 | Marcar como não compareceu após duas chamadas sem atendimento. |
| RF10 | Exibir as cinco últimas senhas chamadas no painel. |
| RF11 | Exibir guichê associado à chamada. |
| RF12 | Manter máquina de estados das senhas. |
| RF13 | Registrar auditoria de chamadas e atendimento. |
| RF14 | Gerar resumo de senhas emitidas, atendidas e não atendidas. |
| RF15 | Gerar quantitativos por prioridade e tempo médio. |
| RF16 | Exibir relatório detalhado das senhas. |
| RF17 | Permitir login para atendente e gestor. |
| RF18 | Permitir cadastro de usuários pelo gestor. |

## Requisitos não funcionais

- RNF01 — Disponibilidade: o painel deve indicar indisponibilidade quando a API não responder.
- RNF02 — Segurança: autenticação JWT, senhas com hash e autorização por perfil.
- RNF03 — Concorrência: chamadas simultâneas devem ser serializadas na seleção da fila.
- RNF04 — Desempenho: consultas da fila e índices devem evitar varreduras desnecessárias.
- RNF05 — Auditoria: operações de chamada e atendimento devem possuir registro.
- RNF06 — LGPD: o totem não solicita identificação pessoal; dados operacionais devem ter acesso restrito.
- RNF07 — Acessibilidade: controles devem possuir texto visível, foco navegável, contraste e feedback textual; áudio é recurso complementar.
- RNF08 — Manutenibilidade: frontend e backend separados e documentados.
