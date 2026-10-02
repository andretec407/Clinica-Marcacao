# Backend — nassauTickets

API REST em Node.js 22 + Express com MySQL 8.0.

## Responsabilidades

- autenticação e autorização;
- emissão anônima de tickets;
- numeração diária por prioridade;
- fila com regra SP → SE/SG → SP → SE/SG;
- controle da máquina de estados;
- tratamento de concorrência com transações e `SELECT ... FOR UPDATE`;
- auditoria;
- relatórios diário/mensal (a API mantém o resumo diário e o histórico detalhado);
- cadastro de usuários pelo gestor.

## Segurança

Senhas são armazenadas com bcrypt. Endpoints operacionais exigem JWT e perfil adequado. Helmet, CORS e limite de corpo JSON são aplicados no servidor.
