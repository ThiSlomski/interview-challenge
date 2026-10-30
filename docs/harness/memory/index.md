# Índice da memória

REG-ESSENTIAL-001,30/10/2026: dados essenciais+Zod4.6.7 compartilhado e migration3
aplicada localmente por autorização. [Auditoria/evidência](../evidence/required-profile-fields.md),
handoff/estado vigentes. UI78/78/perfil41/41/exclusão45/45/PG74/74/Node69/69;
Harness parcial, revisão humana/CI remoto pendentes. README/CI adiados; ajuste
smoke Compose mantido sem execução. Sem commit/push; não repetir migration.

REG-UI-001,30/10/2026: cadastro centralizado até920px, grid responsivo e lógica
preservada. Comece pelos checkpoints handoff/estado e pela
[evidência](../evidence/registration-refinement.md). UI72/72, Harness62/62,
lint/tipos/build aprovados; Harness parcial. Autorrevisão, humana/CI pendentes.
Somente pares02/09 alterados;18 PNGs preservados. Sem commit/push/deploy.

Atualização vigente ADMIN-DELETE-UI-001,30/10/2026: contraste danger corrigido
somente no CSS, API/fluxo preservados. [Evidência e cores](../evidence/admin-delete-visual.md),
capturas06/10, hashes dos demais16 PNGs/3 referências preservados. UI36/36,
lint/tipos/Harness aprovados, sem commit/push/alteração persistente.

Atualização vigente ADMIN-DELETE-001-L1,30/10/2026: grants persistentes explicitamente
autorizados/aplicados e app reiniciada, destino127.0.0.1:5432/imobilead conferido.
ACLs READ ONLY autorizadas comparam somente as duas mudanças DELETE e preservação
dos demais direitos. [Evidência](../evidence/admin-delete.md#admin-delete-001-l1--preparação-persistente-autorizada).
Nenhum usuário/sessão excluído ou cadastro alterado pelo agente; teste humano de
exclusão ainda depende de autorização explícita para conta sintética.

Atualização vigente ADMIN-DELETE-001,30/10/2026: exclusão admin de user implementada
e testada apenas no descartável; comece pelos checkpoints handoff/estado e pela
[evidência](../evidence/admin-delete.md). Perfil/CI-base publicados/verdes antes
de iniciar, sem novo commit/push. Grants/cadastros persistentes intactos; aplicação
futura e teste humano sintético dependem de autorização. Revisão humana/CI novo pendentes.

Atualização vigente PROFILE-001,30/10/2026: edição própria implementada localmente;
comece pelos checkpoints em handoff/estado e pela [evidência](../evidence/profile.md).
Perfil é a única etapa executada; exclusão/containerização não iniciadas. Banco
persistente ainda exige migration/grants/reinício conforme SOLUTION. CI remoto
do diff e revisão humana pendentes; nenhum commit/push.

Atualização documental, 29/10/2026: [índice de prompts](../../AI_PROMPTS.md) e
[organização/verificações](../evidence/prompt-organization.md). Implementação e
fase funcional preservadas; revisão humana pendente.

28/10/2026 · origem Prompt 5 · estado versionado explícito · evidência
[demo](../evidence/demo.md). Esta pasta não é descoberta/carregada automaticamente.

Comece por [handoff](handoff.md), Git e [estado](project-state.md). Leia
[decisões](decisions.md) somente para a decisão relevante e
[lições](lessons.md) quando o problema reaparecer. Fontes canônicas:
[README](../../../README.md), [requisitos](../../REQUIREMENTS.md),
[arquitetura](../../ARCHITECTURE.md) e [prompts](../../AI_PROMPTS.md).
Memória é resumo revisável, subordinado às fontes e ao Git.
Última atualização: H-002, 28/10/2026; [correções e verificações](../evidence/corrections.md)
e [lacunas](../validation-gaps.md). H-001 permanece como histórico.

Última atualização corrente: DB-001, 29/10/2026; etapa de banco autorizada.
Comece pelo checkpoint DB-001 em handoff/estado e pela
[evidência atual](../evidence/database.md). H-001/H-002 e seus resultados continuam
históricos; não usar restrição de fase antiga para cancelar autorização atual.

Última atualização corrente: UI-001,29/10/2026. Comece pelos checkpoints UI-001
em handoff/estado e pela [evidência UI](../evidence/ui.md). Telas integradas;
clima é a próxima etapa, ainda não iniciada. Histórico acima preservado.

Última atualização corrente: UI-001-P1,29/10/2026; comece pelo checkpoint P1 e
[evidência P1](../evidence/ui-p1.md). Snapshot anterior preservado; concorrência e
identidade oficial corrigidas. Clima/revisão humana final continuam pendentes.

Entrada frontend consolidada: [ui.md](../evidence/ui.md). O [P1](../evidence/ui-p1.md)
é detalhe histórico/técnico; [relato inicial](../evidence/ui-initial-history.md)
preservado. [Galeria final18 imagens](../evidence/ui-captures/README.md) e
[inventário desta organização](../evidence/ui-organization.md). Comece pela entrada
principal; não confunda verificações históricas P1 com a organização atual.

Pastas operacionais padronizadas: [galeria ui-captures](../evidence/ui-captures/README.md)
e [referências ui-reference](../evidence/ui-reference/reference.json). P1 nos
registros acima é histórico; comandos/resultados/snapshots/diffs foram preservados.
Esta renomeação não executou novamente browser, banco ou build.

Atualização vigente30/10/2026: revalidação periódica estável da área protegida.
Comece pelos checkpoints de handoff/estado e pela
[evidência UI existente](../evidence/ui.md#revalidação-periódica-estável--30102026).
Sucesso em fundo sem oscilação; gatilhos restritivos e proteções preservados.
Resultados desta rodada separados dos históricos; revisão humana pendente.

Atualização vigente CI-001,30/10/2026: fase1 local do pipeline obrigatório;
comece pelo handoff/estado e pela [evidência CI](../evidence/ci.md).
Fase2/revisão humana/novo CI remoto pendentes; histórico acima preservado.

CONTAINER-001,30/10/2026: etapa atual de containerização concluída localmente; começar
pelo checkpoint no handoff/estado e pela [evidência](../evidence/containerization.md).
CI remoto e revisão humana pendentes; restrições históricas de não iniciar Docker
foram superadas pelo pedido integral registrado. Sem commit/push/deploy.
