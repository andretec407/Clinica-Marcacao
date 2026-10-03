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
| RF19 | Permitir cadastro e login de pacientes por e-mail e senha, identificando o perfil atribuído pelo servidor. |
| RF20 | Restringir rotas e ações conforme perfil de paciente, atendente ou administrador. |
| RF21 | Exibir ao paciente resumo, solicitações abertas/concluídas, status e notificações. |
| RF22 | Permitir solicitar exame com dados pessoais, pagamento, exames, data/horário desejados e observações. |
| RF23 | Permitir anexar pedido médico PDF, JPG ou PNG de até 5 MB, protegido por autorização. |
| RF24 | Exibir ao paciente as solicitações, detalhes, histórico de estados e observações da equipe. |
| RF25 | Permitir à equipe aprovar uma solicitação e confirmar data e horário do agendamento. |
| RF26 | Permitir buscar solicitações por CPF, nome, ticket ou data de nascimento. |
| RF27 | Registrar chegada e colocar o paciente na fila pela ordem de chegada. |
| RF28 | Permitir chamar o próximo paciente e iniciar atendimento com registro de horário e funcionário. |
| RF29 | Controlar as etapas de atendimento, coleta, finalização e saída do paciente. |
| RF30 | Registrar falta e cancelamento nos estados permitidos. |
| RF31 | Manter histórico auditável de cada transição e notificar o paciente sobre atualizações. |
| RF32 | Exibir ao administrador chegadas, fila, atendimentos, coletas, saídas, faltas e cancelamentos. |
| RF33 | Calcular tempos médios de espera, atendimento e permanência, além de exames e produtividade por funcionário. |

## Requisitos não funcionais

- RNF01 — Disponibilidade: o painel deve indicar indisponibilidade quando o backend não responder.
- RNF02 — Segurança: autenticação JWT, senhas com hash e autorização por perfil.
- RNF03 — Concorrência: chamadas simultâneas devem ser serializadas na seleção da fila.
- RNF04 — Desempenho: consultas da fila e índices devem evitar varreduras desnecessárias.
- RNF05 — Auditoria: operações de chamada e atendimento devem possuir registro.
- RNF06 — LGPD: o totem não solicita identificação pessoal; CPF, dados clínicos e documentos devem ter acesso restrito e não ser expostos no painel público.
- RNF07 — Acessibilidade: controles devem possuir texto visível, foco navegável, contraste e feedback textual; áudio é recurso complementar.
- RNF08 — Manutenibilidade: frontend React e backend Node.js separados e documentados; chamadas internas não dependem de serviços externos.
