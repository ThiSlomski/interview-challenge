# delivery

Modo: procedimento manual guiado por skill; os comandos indicados são executáveis.
Não é pipeline automático e não altera o CI da aplicação.

- Gatilho: Etapa de requisito autorizada.
- Pré-condições: Contrato com dono único, fontes, aceite e tempo.
- Responsável: Orquestrador coordena; especialista da área executa; Documentação consolida.
- Skills sob demanda: plan-requirement → deliver-requirement → review-security quando pertinente → verify-delivery → record-decision.
- Comandos: `node scripts/harness/harness.mjs <comando>`: doctor; validate; verify; checkpoint.
- Procedimento: Requisito → contrato → implementação autorizada → revisão delimitada → verificação → documentação. Delegue somente com ganho; revisores não recebem conclusão esperada.
- Saída: Diff, evidência, decisão e memória; revisão humana distinta.
- Falha: preserve trabalho, registre última etapa/evidência, respeite tempo e uma
  execução + até duas correções com hipóteses novas; continue partes independentes.

Consulte [contrato](../delegation.md), [comandos](../commands.md) e
[política de contexto](../TOKEN_POLICY.md).

