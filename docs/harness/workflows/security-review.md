# security-review

Modo: procedimento manual guiado por skill; os comandos indicados são executáveis.
Não é pipeline automático e não altera o CI da aplicação.

- Gatilho: Mudança com controles/dados relevantes ou pedido de revisão.
- Pré-condições: Pergunta e superfície delimitadas, acesso de leitura.
- Responsável: Especialista da área; Backend coordena auth, Banco integridade.
- Skills sob demanda: review-security; verify-delivery.
- Comandos: `node scripts/harness/harness.mjs <comando>`: validate; verify após correção.
- Procedimento: Analise ameaças e reporte arquivo/impacto/evidência. Orquestrador atribui correção e valida novamente o comportamento afetado.
- Saída: Achados e resolução, incluindo lacunas que permanecerem.
- Falha: preserve trabalho, registre última etapa/evidência, respeite tempo e uma
  execução + até duas correções com hipóteses novas; continue partes independentes.

Consulte [contrato](../delegation.md), [comandos](../commands.md) e
[política de contexto](../TOKEN_POLICY.md).

