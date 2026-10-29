# H-002 — contratos das correções

28/10/2026 · origem [pedido integral](../../prompts/2026-10-28-harness-corrections.md).
Estado inicial: main, HEAD f1b6f437756eb3c86c141986818c34bb720ab9c8;
41 novos e dois documentos alterados já existentes. Snapshot SHA256 local em
diretório temporário antes das correções. Preservar o nome de prompt ajustado pelo usuário.

Orquestrador: implementar H-002-1 Git, H-002-2 capacidades, H-002-3 hooks,
H-002-4 fixture e H-002-5 testes produto em scripts/harness/; consolidar documentação.
Escrita exclusiva: scripts/harness/, docs/harness/, docs/AI_PROMPTS.md e novo prompt.
Sem código funcional, package/lockfile/CI, configurações pessoais ou confiança automática.

Aceite: testes positivos/negativos por correção; CLI não zero na falha obrigatória;
probe distingue presente/habilitado/efetivo/demonstrado; fixture válida antes da
mutação; produto ausente/placeholder/falha/sucesso e execução sem prova separados.
doctor, validate, verify (inclui lint/typecheck), diff-check e revisão independente.
Tempo operacional: até 90 minutos; uma execução e até duas correções por problema,
com hipótese nova antes de repetir. Continuar partes independentes se houver bloqueio.

R-H002: revisão independente em leitura, após implementação, com ganho de segunda
análise de invariantes/erros; nenhuma escrita atribuída ou subdelegação. Fontes:
pedido, scripts/testes e contratos dos comandos; até 10 minutos, uma revisão e
até dois seguimentos delimitados. Retorno: achados por linha/impacto, testes e
limites. Não passar conclusões esperadas ao revisor; contexto herdado declarado.

Lacunas: avaliar sem chamadas de modelo adicionais, trust automático ou instalação.
Árvore de processos QA pode ser criada e terminada por PID próprio em ambiente
temporário. Hook real, especialista nativo e retomada limpa só serão considerados
demonstrados se o ambiente/execução realmente fornecer essa evidência.
