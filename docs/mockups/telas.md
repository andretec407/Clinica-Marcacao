# Mockups funcionais

As telas implementadas no frontend cobrem os fluxos abaixo:

- Home: acesso ao totem, painel público e login/cadastro.
- Login e cadastro: entrada por e-mail e senha; o perfil é determinado pelo backend.
- Portal do paciente: resumo de solicitações, novo pedido de exame, anexo médico, notificações e histórico com timeline.
- Fluxo clínico: dashboard da equipe, solicitações pendentes, busca por CPF/nome/ticket/data de nascimento, fila e ações por estado.
- Recepção: confirmação do pedido/agendamento e registro de chegada.
- Atendimento e coleta: chamada, início, encaminhamento para coleta, coleta realizada e finalização.
- Saída: registro do encerramento presencial da visita.
- Painel e totem: preservam o fluxo público das senhas SP, SE e SG.
- Gestão: métricas clínicas, relatórios de tickets, auditoria e gestão de usuários.

A interface é responsiva. CPF, dados clínicos e documentos aparecem apenas em áreas autenticadas; o painel público não expõe identificação do paciente.
