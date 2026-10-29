# Checkpoint para retomada

## AUTH-001 — estado vigente, 29/10/2026

Base real main/1c96acb; DB-001 e REG-001 versionados. CI-base aprovado conforme
usuário; nenhum CI remoto do diff. Alteração prévia de AI_PROMPTS preservada.
Pedido atual autorizou login/sessão/logout e supera restrições históricas abaixo.
Implementados POST /api/auth/login, GET /api/auth/session, POST /api/auth/logout,
função central servidor, cookie/digest, TTL absoluto3600 sem renovação e CSRF/abuso.
[Plano](../evidence/authentication-plan.md) e [evidência](../evidence/authentication.md)
registram falha intermediária HTTP, correção P2 e revisão independente sem achados
pendentes; revisão humana pendente. QA: npm test28 pass (launchers cadastro8/auth11),
auth explícito11/11, integração final Next+PG33/33 sem skips, limpeza0 recursos e
metadados/ACLs protegidos iguais. Build/audit/doctor/validate/verify --product e
lint/typecheck/diff --check passaram, Harness parcial/readiness not-assessed.
Navegador/HTTPS produção não exercitados. Limites locais exigem controles produção.
Sem mudança de schema/grants principais/Harness/CI/dependências, DML principal,
remotos ou commit/push/publicação. Roles/listagem403/página protegida/telas/clima
pendentes. Não iniciar etapa nova nem repetir mutações por memória.
## REG-001-E1 — estado vigente, 29/10/2026

Comece por Git e project-state; a árvore já tinha os 23 arquivos REG-001 pendentes
no início da correção E1. Snapshot temporário preservado, sem index/commit. E1
corrige omissão de comprimento reproduzida nesta rodada: local <=64, cada label
<=63, endereço normalizado <=254 bytes, após ASCII, mesmo erro de campo. Sintaxe
e normalização preservadas; achado não coberto pela revisão independente anterior.
[Contrato](../evidence/registration-plan.md#reg-001-e1--correção-de-comprimento-29102026)
e [evidência atual](../evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026)
registram reprodução, fontes oficiais, testes, limpeza e fechamento. Instância HTTP
separada verifica os seis casos de comprimento sem esgotar quota do cenário padrão;
controle de abuso e caso 429 preservados. Banco principal, grants/migrations,
dependências, Harness e CI inalterados nesta correção. Próxima etapa login/sessão
não iniciada; sem commit/push/publicação. Revisão humana pendente.
Fechamento E1: 27 aprovações npm test, oito servidor explícitos, 24 na integração
real sem skips; limpeza/catalogação confirmadas. Lint/typecheck/build e Harness
incluindo verify --product passaram; diff --check aprovado. Não iniciar a próxima
etapa só por este checkpoint nem repetir efeitos mutáveis pela memória.

## DB-001-P1 — divergências de privilégios detectadas, 29/10/2026

Origem: revisão estática do diff compartilhado. Reprodução PostgreSQL descartável
confirmou checker antigo aceitando UPDATE(role) adicional; não foi demonstrado
grant indevido em imobilead. Checker ampliado para ACLs efetivas fixas users/
sessions/history, inclusive tabela/coluna/PUBLIC, USAGE necessário e falha fechada
por ausência/NULL/erro. Somente diagnostica; nenhum reparo automático.

Final: 16 testes offline e 16 aprovações Node de integração real (15 subtestes+
principal), lint/typecheck/build passaram. db:check leitura em imobilead com
imobilead_app passou; nenhum grant/migration/provisionamento repetido nesse banco.
Falha intermediária de restauração INSERT do teste foi diagnosticada antes de
correção; revisão independente apontou USAGE, corrigido e confirmado em seguimento.
Cleanup confirmado após execuções: zero bancos/papéis descartáveis remanescentes,
metadados/ACLs protegidos de imobilead inalterados. Preservar histórico anterior.
[Evidência, comandos e limites](../evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).
Não implica auth/API prontas ou segurança exaustiva. Revisão humana pendente;
nenhuma próxima funcionalidade iniciada, sem commit/push.

## DB-001-I1 — integração PostgreSQL real aprovada, 29/10/2026

Usuário autorizou banco/papéis exclusivos descartáveis em 127.0.0.1:5432.
Após revisão das proteções e preflight READ ONLY, o agente executou uma vez
`npm run test:db:integration`: código 0, 1 teste aprovado, zero falhas/skips.
Asserções de migrations inicial/repetida, e-mail concorrente, nome/papel,
sessões/FK/tempos e permissões previstas pelo runner passaram em PostgreSQL real.
Esta execução do agente é distinta da sequência manual informada em M1 abaixo.

Limpeza do próprio runner concluída: catálogo antes/depois sem bancos/papéis
descartáveis remanescentes; nenhuma limpeza adicional por prefixo. Metadados
de schemas/relações/ACLs e atributos dos papéis fixos de imobilead permaneceram
iguais; SQL mutável do runner limitado ao banco/papéis exclusivos. Sem leitura
de valores pessoais ou modificação de imobilead, remotos, implementação ou commits.

A integração deixa de estar pendente para os casos executados, sem afirmar
validação exaustiva de constraints/permissões ou auth/API/UI. Próxima tarefa
funcional depende de autorização específica; não repetir ações por memória.
[Comando, revisão, resultados e limpeza](../evidence/database.md#db-001-i1--integração-local-autorizada-29102026).
Revisão humana pendente; registros abaixo são históricos.

## DB-001-M1 — atualização manual informada, 29/10/2026

O usuário informou execução manual bem-sucedida, nesta ordem: db:inspect;
db:migrate (applied:1); db:migrate (applied:0); db:grant; db:check, confirmando
127.0.0.1:5432/imobilead com imobilead_app. Atribuição exclusiva ao relato do
usuário, sem repetição ou confirmação independente pelo agente nesta rodada.
Migrations/grants/conexão runtime passam a constar como execução manual informada,
superando as pendências correspondentes de D2 abaixo, mantido como histórico.

Integração em banco descartável continua pendente. Essa sequência não comprova
constraints, concorrência, sessões e permissões integralmente testadas, nem
funcionalidades concluídas. Não repetir comandos pela memória; a próxima tarefa
depende de autorização específica. Sem implementação ou commits nesta rodada.
[Evidência e limites](../evidence/database.md#db-001-m1--execução-manual-informada-pelo-usuário-29102026).

## DB-001-D2 — correção e provisionamento confirmados, 29/10/2026

`host(inet_server_addr()) AS address` e igualdade com `expected.host` aplicados;
banco/porta/usuário preservados. 12 testes controlados, lint/typecheck/diff passaram.
Preflight PostgreSQL READ ONLY aprovou identidade administrativa integral no
destino exclusivo. `npm run db:provision` executado uma vez, código 0; catálogo
posterior confirmou papéis imobilead_migrate/imobilead_app e schemas
imobilead/imobilead_meta, ownership e direitos de schema esperados, sem tabelas.
Não repetir provisionamento. Nenhuma senha foi definida/redefinida e `.env.local`
não foi alterado; não foram executadas migrations ou testes descartáveis.
Próximo passo depende de autorização específica: senhas locais dos novos papéis
e posterior migrations/grants/check da aplicação. Não iniciá-lo pela memória.
[Resultados e limites](../evidence/database.md#db-001-d2--contrato-da-correção-autorizada-29102026).
Autorrevisão desta correção; revisão humana pendente. Registros abaixo históricos.

Atualização DB-001-D1, 29/10/2026: usuário relatou falha de identidade em
`db:provision`. Diagnóstico somente de leitura confirmou divergência apenas em
`address`: cast inet para text inclui máscara; correção para `host(...)` e
igualdade exata com host está proposta, ainda não aplicada. Não repetir o
provisionamento antes da correção autorizada. `.env.local` agora existe; conexão
administrativa no destino exigido foi verificada sem expor valores. Catálogo
atual sem papéis/schemas/relações previstos pelo provisionamento. A conexão da
aplicação continua sem comprovação. Ver [diagnóstico e QA](../evidence/database.md#db-001-d1--diagnóstico-de-identidade-29102026).
Doctor/validate/verify --product e diff --check passaram nesta rodada, escopo
parcial. Nenhuma alteração de objetos ou permissões e nenhuma correção funcional.

## DB-001 — checkpoint atual, 29/10/2026

Base real reconciliada: main, HEAD 2ee16c787dd77b23da02353d1667ab7568258941,
árvore limpa no início; alterações desta etapa ainda sem commit. O pedido atual
supera a restrição temporária de “somente Harness” dos checkpoints abaixo.

Leia [estado](project-state.md), [evidência DB-001](../evidence/database.md) e
[SOLUTION](../../../SOLUTION.md), depois confira Git. Implementados em arquivos:
pg/node-pg-migrate, migration users/sessions, papéis separados/grants por coluna,
configuração servidor, CLI sanitizada e testes. Backend acordou sessões antes da
tabela e fez revisão independente delimitada; detalhes/correções na evidência.
Revisão humana permanece pendente.

Usar exclusivamente 127.0.0.1:5432/imobilead. Não acessar conexões remotas/Sillage
nem extrair credenciais salvas no VS Code. O usuário criou imobilead no DBeaver e
informou conexão na extensão; isso não comprova a aplicação. Inspeção delimitada
do arquivo HBA do serviço encontrou zero trust/includes, sem mudar autenticação;
a leitura não prova configuração carregada no processo. Não recriar trust.

Próxima ação: credenciais locais em `.env.local` ignorado, preservando existente,
sem ler/exibir valores ou pedi-los no chat. Usuário informou que preencheria nesta
etapa; só confirmar presença/disponibilidade e usar os comandos sanitizados.
Provisionamento ADMIN -> senhas de papéis por psql \password -> MIGRATION/DATABASE
URLs -> db:inspect -> db:migrate duas vezes -> db:grant -> db:check. Conferir
identidade e inventário efetivos antes de mutação. Em colisão, parar e relatar,
sem reset/drop/truncate do banco existente. Não repetir operações pela memória.

Testes offline 4/4, lint/typecheck/build/audit e harness passaram conforme evidência;
migrations/permissões reais ainda não comprovadas. Integração preparada usa banco
separado descartável e exige autorização de destino compatível; não executá-la sob
a restrição exclusiva atual. Cluster efêmero foi cancelado antes de implementação.

Próxima etapa funcional recomendada após fechar essa lacuna: cadastro/auth com
allowlist de entrada/saída, hashing Argon2id definido/testado, sessões e controle
user/admin no servidor. Não iniciar telas/endpoints/login/logout/clima pela
sugestão deste checkpoint. Sem CI, commit/push/publicação/deploy nesta etapa.

## Checkpoints históricos do Harness

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
# REG-001 — retomada, 29/10/2026

Comece por Git e estado atual. Base desta rodada main/835537d, árvore limpa no
início; implementação e documentos desta rodada sem commit. CI do commit-base
aprovado conforme relato do usuário, sem novo CI remoto. Cadastro POST /api/users
concluído no escopo autorizado: validação/hash/SQL/user/erros/origem/corpo/abuso,
sem sessão. Runtime continua exclusivamente imobilead_app no destino original.

Leia [evidência REG-001](../evidence/registration.md),
[plano](../evidence/registration-plan.md), [SOLUTION](../../../SOLUTION.md) e
arquitetura REG-001 conforme necessário. Testes controlados, HTTP Next dev com
provider de fixture e PostgreSQL real distinguidos; limpeza confirmada e banco
principal preservado. Dois P2 de e-mail da revisão independente corrigidos e
seguimento concluído. Revisão humana pendente; consulte fechamento para Harness.

Não repetir migrations/provisionamento/grants/testes mutáveis pela memória.
Quota é global por processo, 409 revela conflito e não há verificação de e-mail;
APP_ORIGIN precisa configuração exata em produção. Próximo escopo depende de
autorização: login/sessão e depois autorização/GET/logout. Telas e clima ausentes.
Sem Git mutável/publicação/remotos nesta rodada. Checkpoints abaixo históricos.
