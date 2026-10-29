# Checkpoint para retomada

## H-002 — estado atual, 28/10/2026

Origem: Prompt 6; correções dos cinco achados. Revisão humana pendente.
Branch main, revisão-base f1b6f437756eb3c86c141986818c34bb720ab9c8, sem commit novo.
O início desta tarefa já tinha os artefatos H-001 e o nome de prompt ajustado pelo
usuário; preservar essas alterações. Novas correções ficam em scripts/harness/,
docs/harness/ e log de prompts; não há mudança funcional/dependência/CI.

Confira [evidência H-002](../evidence/corrections.md) e o resultado atual de Git.
O checkpoint executável agora distingue clean/dirty de erro e não gera proposta
válida se uma consulta Git falhar. Revisão independente concluída com ajuste de
placeholder; rodada final deve ser consultada na evidência, nunca inferida daqui.
Próxima ação: revisar resultados do Harness; depois planejar contrato funcional
somente quando autorizado. Hook real, seleção nativa e retomada limpa continuam
não demonstrados; [procedimentos](../validation-gaps.md). Timeout da árvore QA foi
demonstrado em Windows. Não repetir efeitos externos pela memória.

## H-001 — checkpoint histórico

28/10/2026 · origem H-001 / checkpoint explícito · status proposta consolidada
pelo orquestrador responsável por esta documentação; revisão humana pendente.

Branch main, revisão-base f1b6f437756eb3c86c141986818c34bb720ab9c8. Nenhum hash novo:
o Harness está sem commit. Alterações: docs/AI_PROMPTS.md e docs/ARCHITECTURE.md;
novos AGENTS.md, SOLUTION.md, .codex/, .agents/skills/, scripts/harness/,
docs/REQUIREMENTS.md, docs/HARNESS.md, docs/harness/ e docs/prompts/.

Tarefa atual: H-001, construção/verificação do Harness. Confira resultados reais
em [demo](../evidence/demo.md), decisões em [índice](decisions.md) e lacunas no
[estado](project-state.md). Não usar este resumo como comprovação de testes.

Retomada: `git status --short`, `git branch --show-current`, `git rev-parse HEAD`;
compare com o acima e execute `node scripts/harness/harness.mjs doctor`.
Carregue `resume-project` e leia só o necessário. Divergência implica reconciliar,
sem reset/clean nem repetição automática de ações com efeitos externos.

Próximo passo recomendado: revisão humana do Harness; depois contrato funcional
dos requisitos 1,4,5–10 e 14–15 mediante autorização. Nenhuma publicação, mudança
de confiança ou implementação funcional foi autorizada pelo checkpoint.
