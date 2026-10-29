# bootstrap

Modo: procedimento manual guiado por skill; os comandos indicados são executáveis.
Não é pipeline automático e não altera o CI da aplicação.

- Gatilho: Nova sessão ou contexto perdido.
- Pré-condições: Git disponível, README e instruções acessíveis.
- Responsável: Orquestrador.
- Skills sob demanda: resume-project.
- Comandos: `node scripts/harness/harness.mjs <comando>`: doctor; validate.
- Procedimento: Leia inicialmente README e AGENTS integralmente; na retomada reconcilie memória e Git e abra só a tarefa relevante.
- Saída: Estado reconciliado e contrato da próxima ação.
- Falha: preserve trabalho, registre última etapa/evidência, respeite tempo e uma
  execução + até duas correções com hipóteses novas; continue partes independentes.

Consulte [contrato](../delegation.md), [comandos](../commands.md) e
[política de contexto](../TOKEN_POLICY.md).

