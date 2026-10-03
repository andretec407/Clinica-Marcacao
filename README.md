# nassauTickets

Sistema de Controle de Atendimento para um Laboratório de Análises Clínicas.

## Visão geral

Sistema para gerenciar cadastro e exames de pacientes, fila, atendimento,
coleta, saída, senhas públicas, relatórios e auditoria.

**Tecnologias:** React 19 + Vite, Node.js 22 + Express, MySQL 8, JWT e bcrypt.
O frontend usa a API interna do backend; não há serviços externos.

`Paciente / Atendente / Administrador / Totem / Painel → React → Node.js + Express → MySQL`

A emissão pública de senhas é anônima. Pacientes acompanham solicitações após
login; a equipe opera a fila; gestores e administradores acessam relatórios e usuários.

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
| Polona Faustino dos Santos | 11033915 | Scrum Master |
| André Carlos Ferreira de Lima | 01775590 | Documentador |
| João Victor Rodrigues | 01849475 | Desenvolvedor-1 |
| Niraldo Barbosa | 01797309 | Desenvolvedor-2 |
| Tiago Barros da Silva | 01597841 | Testador |

> Substituam os placeholders antes da entrega. A atividade exige que a seção se chame exatamente `## Membros`.

## Funcionalidades

- Senhas SP/SE/SG: expediente 07:00–17:00, prioridade alternada, sequência diária
  por tipo, painel com cinco últimas chamadas e registro de faltas.
- Exames: cadastro/login, solicitação e anexo médico, agendamento, fila por
  chegada, coleta, saída, histórico e notificações.
- Acesso por perfil, relatórios, métricas e auditoria.
- Regras completas: [regras de negócio](docs/requirements/regras-negocio.md);
  requisitos: [requisitos](docs/requirements/requisitos.md).

## Backend

```powershell
Set-Location backend
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

Antes do `seed`, crie o banco usando `backend/sql/schema.sql`.

Variáveis obrigatórias em `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nassau_tickets
DB_USER=root
DB_PASSWORD=sua_senha
JWT_SECRET=use-uma-chave-aleatoria-longa
CORS_ORIGIN=http://localhost:5174
ENFORCE_BUSINESS_HOURS=true
```

Usuários de demonstração criados por `npm run seed`:

- Atendente: `atendente@demo.local` / `Atendente123!`
- Gestor: `gestor@demo.local` / `Gestor123!`
- Administrador: `admin@demo.local` / `Admin12345!`
- Paciente: `paciente@demo.local` / `Paciente123!`

Troque essas credenciais e a chave JWT em um ambiente real. Para testes fora do expediente, pode-se usar `ENFORCE_BUSINESS_HOURS=false`; na entrega acadêmica, mantenha `true` para refletir a regra das 07:00 às 17:00.

## Frontend

Na pasta `frontend`:

```powershell
npm install
npm run dev
```

O frontend inicia em `http://localhost:5174` (`VITE_API_URL` usa
`http://localhost:3000/api` por padrão).

## Demonstração sem MySQL

Inicie o frontend e abra `http://localhost:5174/login`. As contas de exemplo:

- Paciente: `paciente@demo.local` / `Paciente123!`
- Atendente: `atendente@demo.local` / `Atendente123!`
- Administrador: `admin@demo.local` / `Admin12345!`

O modo demo salva alterações apenas neste navegador; para reiniciá-lo, remova
`nassau_demo_state` do armazenamento local. Essas contas não criam usuários no
banco e não devem ser usadas em produção.

## Branches e versionamento

A entrega acadêmica mantém as branches `dev` e `main`, integrando `dev` em
`main` por merge.

## Documentação

Requisitos, regras, modelo de dados, mockups e diagramas estão em `docs/`,
incluindo segurança, LGPD e acessibilidade.
