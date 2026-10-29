# handoff-resume

Modo: procedimento manual guiado por skill; os comandos indicados são executáveis.
Não é pipeline automático e não altera o CI da aplicação.

- Gatilho: Pausa, troca de contexto ou retomada.
- Pré-condições: Git real e memória acessíveis.
- Responsável: Documentação consolida; orquestrador reconcilia.
- Skills sob demanda: record-decision; resume-project.
- Comandos: `node scripts/harness/harness.mjs <comando>`: checkpoint; doctor.
- Procedimento: Gere proposta sem escrever memória automaticamente; revise nomes de arquivos e resultados, consolide handoff. Em nova sessão compare branch, HEAD e alterações antes de escolher ação.
- Saída: Checkpoint sanitizado e próxima ação coerente com Git.
- Falha: preserve trabalho, registre última etapa/evidência, respeite tempo e uma
  execução + até duas correções com hipóteses novas; continue partes independentes.

Consulte [contrato](../delegation.md), [comandos](../commands.md) e
[política de contexto](../TOKEN_POLICY.md).

