# release-readiness

Modo: procedimento manual guiado por skill; os comandos indicados são executáveis.
Não é pipeline automático e não altera o CI da aplicação.

- Gatilho: Pedido de avaliar prontidão da entrega.
- Pré-condições: Requisitos, diff e evidências recentes.
- Responsável: Orquestrador e Documentação, revisão especializada sob demanda.
- Skills sob demanda: verify-delivery; review-security quando pertinente.
- Comandos: `node scripts/harness/harness.mjs <comando>`: validate; verify --product.
- verify --product cobre parcialmente Harness e testes do produto; não executa build
  nem substitui a avaliação deste workflow dos demais requisitos/evidências.
- Procedimento: Compare cada aceite com evidência; placeholder, CI remoto não verificado e recurso ausente impedem alegação de prontidão. Não publique nesta etapa.
- Saída: Parecer de prontidão com pendências; nenhuma publicação automática.
- Falha: preserve trabalho, registre última etapa/evidência, respeite tempo e uma
  execução + até duas correções com hipóteses novas; continue partes independentes.

Consulte [contrato](../delegation.md), [comandos](../commands.md) e
[política de contexto](../TOKEN_POLICY.md).

