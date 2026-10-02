# Segurança, LGPD e acessibilidade

## Segurança

- JWT com expiração de 8 horas.
- Senhas com bcrypt.
- Autorização por papel: ATENDENTE e GESTOR.
- Helmet para cabeçalhos HTTP de segurança.
- CORS restrito à origem configurada.
- Corpo JSON limitado a 100 KB.
- Credenciais de demonstração apenas para ambiente acadêmico.

## LGPD

O fluxo do totem foi desenhado para não coletar CPF, nome ou outros dados pessoais para emissão da senha. Relatórios operacionais ficam atrás de autenticação. Em uma implantação real, devem ser definidos política de retenção, base legal, controle de acesso, logs e procedimentos de incidente conforme a legislação e as políticas do laboratório.

## Acessibilidade

- Conteúdo textual não depende exclusivamente de cor.
- Botões possuem rótulos claros.
- Estrutura semântica de headings, formulários e tabelas.
- Layout responsivo.
- O áudio de chamada, quando implementado, deve ser complementar ao texto visual.
