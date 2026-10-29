---
name: resume-project
description: Reconstruir contexto pelo checkpoint, Git e fontes canônicas antes de retomar o projeto.
---

Entrada: docs/harness/memory/handoff.md e project-state.md; Git real.

Procedimento: Leia checkpoint e estado. Confira git status --short, branch e HEAD. Reconcilie diferenças; leia index.md e só as fontes da tarefa atual. Execute doctor e valide se necessário. Não repita migrations, envios ou operações externas por memória. Escolha próxima ação do pedido atual; limites e decisões do README prevalecem.

Saída: Estado reconciliado, divergências e próxima ação sem execução externa.

Referências a partir da raiz do repositório:
- [Contrato](../../../docs/harness/delegation.md)
- [Política de contexto](../../../docs/harness/TOKEN_POLICY.md)
- [Workflow](../../../docs/harness/workflows/handoff-resume.md)

