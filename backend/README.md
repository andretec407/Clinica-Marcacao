# Backend

Node.js 22, Express 5 e MySQL 8. O backend oferece autenticação por perfil,
fluxo de exames, fila de senhas, relatórios, auditoria e notificações. As
chamadas são internas ao frontend; não há serviços externos. Erros de rotas
assíncronas são encaminhados pelo Express ao middleware comum.

## Executar (PowerShell)

Na pasta `backend`, crie o banco usando `sql/schema.sql` e rode:

```powershell
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

Configure as credenciais do MySQL e `JWT_SECRET` no `.env`. Para produção,
inicie com `npm start`. Senhas usam bcrypt, rotas usam JWT e perfil, anexos
médicos ficam em `uploads/` e o CORS usa `CORS_ORIGIN`.
