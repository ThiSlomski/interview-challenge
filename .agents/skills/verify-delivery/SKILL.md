---
name: verify-delivery
description: Conferir critérios de aceite, evidências e lacunas antes de declarar entrega.
---

Entrada: Contrato, diff atual e evidências dos comandos.

Procedimento: Carregue só as fontes relevantes. Execute doctor, validate e verify conforme docs/harness/commands.md. Confira resultados e critérios do README. Teste ausente/placeholder é não executado, nunca aprovado. Não repita verificações já válidas sem mudança ou dúvida concreta. Declare o que foi revisão própria e o que foi independente.

Saída: Parecer com aprovado, falha ou não executado por critério; pendências humanas.

Referências a partir da raiz do repositório:
- [Contrato](../../../docs/harness/delegation.md)
- [Política de contexto](../../../docs/harness/TOKEN_POLICY.md)
- [Workflow](../../../docs/harness/workflows/release-readiness.md)

