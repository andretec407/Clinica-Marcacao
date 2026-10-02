# nassauTickets

Sistema de Controle de Atendimento para um Laboratório de Análises Clínicas.

## Objetivo

Controlar a emissão, priorização, chamada e atendimento de senhas, com painel público, terminal do atendente, relatórios e auditoria.

## Tecnologias

- Frontend: React 19 + Vite
- Backend: Node.js 22 + Express
- Banco: MySQL 8.0
- Autenticação: JWT + bcrypt
- API: REST/JSON

A escolha de Node.js + Express segue uma das infraestruturas indicadas no enunciado. O frontend permanece em React, conforme exigido.

## Arquitetura

`Totem / Atendente / Painel / Gestor → React → API Express → MySQL`

A emissão do ticket é anônima. O atendente utiliza login e o gestor possui permissões administrativas e de relatórios.

## Estrutura

```text
nassauTickets/
├── backend/
├── docs/
│   ├── branding/
│   ├── mer/
│   ├── mockups/
│   ├── models/
│   │   └── uml/
│   └── requirements/
├── frontend/
├── .gitignore
├── LICENSE
└── README.md
```

## Membros

| Nome | Matrícula | Papel |
|---|---|---|
| Preencher pelo grupo | Preencher | Scrum Master |
| Preencher pelo grupo | Preencher | Documentador |
| Preencher pelo grupo | Preencher | Desenvolvedor |
| Preencher pelo grupo | Preencher | Testador |

> Substituam os placeholders antes da entrega. A atividade exige que a seção se chame exatamente `## Membros`.

## Regras principais

- Expediente: 07:00–17:00.
- Tipos: SP, SE e SG.
- Ciclo de prioridade: SP → SE/SG → SP → SE/SG.
- Qualquer guichê atende qualquer tipo.
- Após duas chamadas sem comparecimento, o ticket é marcado como `NAO_COMPARECEU`.
- O painel exibe as cinco últimas senhas chamadas, sem exibir a próxima senha.
- Numeração: `YYMMDD-PPSQ`, com sequência de três dígitos reiniciada diariamente por tipo.
- Estados: `EMITIDA → AGUARDANDO → CHAMADA → CHAMADA_NOVAMENTE → EM_ATENDIMENTO → ATENDIDA`, com saída para `NAO_COMPARECEU`.

Essas regras são derivadas da especificação fornecida na atividade.

## Backend

```bash
cd backend
cp .env.example .env
npm install
# crie o banco usando backend/sql/schema.sql
npm run seed
npm run dev
```

Variáveis obrigatórias em `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nassau_tickets
DB_USER=root
DB_PASSWORD=sua_senha
JWT_SECRET=troque-esta-chave
CORS_ORIGIN=http://localhost:5173
```

Usuários de demonstração após `npm run seed`:

- Atendente: `atendente@demo.local` / `Atendente123!`
- Gestor: `gestor@demo.local` / `Gestor123!`

Troque essas credenciais em um ambiente real. Para testes fora do expediente, pode-se usar `ENFORCE_BUSINESS_HOURS=false`; na entrega acadêmica, mantenha `true` para refletir a regra das 07:00 às 17:00.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend utiliza `VITE_API_URL=http://localhost:3000/api` por padrão. Para alterar, crie `frontend/.env`.

## Branches e versionamento

A entrega deve possuir as branches `main` e `dev`. O desenvolvimento deve ocorrer primeiro em `dev`, seguido de merge para `main`, mantendo o histórico.

Exemplos de commits:

```text
chore: cria estrutura inicial do projeto
feat: implementa emissão de senhas
feat: implementa fila e concorrência
feat: implementa painel de chamadas
feat: adiciona relatórios e auditoria
docs: adiciona requisitos e diagramas
```

## Documentação

Os requisitos, regras de negócio, modelo de dados e diagramas estão em `docs/`. O enunciado também exige atenção a segurança, disponibilidade, auditoria, desempenho, concorrência, LGPD e acessibilidade.

Entrega acadêmica: desenvolvimento realizado em dev e integrado a main.
