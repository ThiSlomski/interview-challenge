# AUTHZ-001 — evidência, 29/10/2026

Origem: pedido integral em [AI_PROMPTS](../../AI_PROMPTS.md#authz-001--autorização-e-consulta-29102026).
[Contrato e matriz anteriores à implementação](authorization-plan.md).
Base main/012f9caa2ef9513feca0b9bbca64b87dbf312eb7, árvore limpa inicial.
CI-base aprovado conforme usuário; sem consulta/disparo de CI remoto nesta rodada.
Revisão humana pendente. Sem commit/push/publicação.

## Implementação

GET /api/users admin paginado100/UUID e GET /api/users/[id] próprio/admin.
401 sem sessão;403 sem permissão antes da consulta-alvo;admin inválido400/ausente404.
Política pura, sessão central e papel fresco no banco, SQL parametrizado/projeção
explícita/no-store. POST público preservado. Contrato detalhado em
[SOLUTION](../../../SOLUTION.md#consulta-e-autorização-authz-001).

Procedimento admin separado, UUID/local/superuser/identidade, lock/transação e
cardinalidade1. Testado só no descartável; não executado em imobilead. Schema,
grants principais, dependências/lockfile, Harness e CI preservados. package.json
somente acrescenta launcher offline/comando explícito de promoção.

## Execuções do agente

| Comando | Resultado |
| --- | --- |
| doctor inicial | passou; Node22.13.1/npm10.9.2; main/012f9ca |
| npm run test:authorization:server | 6/6 sem skips; repetido após melhorar testes de falha por fase, 6/6 |
| npm test | 29 aprovações sem falhas/skips; launchers verificam registro8/auth11/autorização6 |
| npm run test:db:integration | 40 aprovações, zero falhas/skips, código0 |
| npm run lint | passou |
| npm run typecheck | passou |
| npm run build | passou; rotas users e users/[id] dinâmicas; aviso prévio React18 deprecado |
| npm audit | zero vulnerabilidades |

Integração real: sete cenários novos AUTHZ e nove de autenticação, oito de cadastro
e comprimento, quinze de permissões, mais teste principal. Next dev HTTP real com
rotas/módulos copiados sem alteração e provider restrito ao banco/papel exclusivo
da fixture; não comprova conexão HTTP da aplicação no banco principal.

Casos novos: cadastro público de dois usuários e admin de fixture; promoção pelo
mesmo mecanismo da CLI, UUID inválido/inexistente/credencial runtime recusados;
401 sem sessão/inválida/expirada/revogada em ambos endpoints; próprio200 e
outro/existente/inexistente/malformado403 com corpo exato sem dados; falsificação
por query/cookie/header/body GET real; admin individual e104 registros em duas
páginas sem duplicação, projeções só allowlist; rebaixamento perde privilégio na
próxima chamada com o mesmo cookie; falha SQL503 sanitizada; logout401.

Controlados: matriz pura incluindo papel desconhecido/id/role ausentes/identidade
divergente; consulta ausente403 antes da projeção; consultas parametrizadas;
allowlist remove campos extras de fixture; cursor inválido/duplicado, query extra,
UUID inválido/ausente admin; falha fechada em sessão, leitura de papel e dados.
Regressões de cadastro/login/TTL absoluto/expiração/logout/grants preservadas.

Limpeza efetiva do runner: cleanup confirmed, protectedMetadata unchanged,
remainingResources0. Processos Next próprios encerrados e diretórios temporários
removidos pelo finally verificado; teste principal e processo terminaram com código0.
Consultas em imobilead restritas aos metadados de proteção existentes; nenhuma linha
pessoal lida ou DML/permissão/promoção executados nesse banco, nenhum banco remoto.

## Revisão independente e ajustes

Backend /root/authz_review carregou review-security, fez revisão somente leitura
de server/users, rotas, promoção, testes e fronteiras auth/config/grants. Nenhum
achado de IDOR/escalada/vazamento. Sugeriu cobrir falhas após consulta da sessão:
teste ampliado para erro em cada fase, seis casos passaram, seguimento estático
confirmou lacuna sanada. Revisor não executou testes ou banco; resultados acima
são execuções do orquestrador. Sem achados pendentes nessa revisão delimitada.

Não houve falha intermediária de produto nas execuções desta rodada. Uma tentativa
de patch documental sem contexto correspondente foi recusada antes de escrita;
documentação consolidada em seguida. A escrita documental via pipe PowerShell/Node
perdeu acentos nos trechos novos; corrigida com UTF-8 explícito, conferindo também
integridade do prompt integral e âncoras. A fixture de prontidão HTTP foi adaptada de
405 para401 por GET agora implementado; nenhum teste de negação foi removido.

## Limites

Revisão humana, navegador/HTTPS produção e CI remoto do diff não executados.
Integração PostgreSQL no CI continua pendente. CLI principal não executada;
mecanismo compartilhado testado real, tratamento genérico da CLI revisto estático.
Não se afirma ausência exaustiva de vulnerabilidades. Paginação não oferece snapshot
sob mutações concorrentes; papel revalidado por requisição, sem cancelar chamada
já autorizada. Telas/cadastro/login/página protegida/sucesso/clima continuam pendentes.
Recuperação de senha/verificação de e-mail não implementadas. Não iniciar próxima
etapa pela memória; nenhuma publicação autorizada nesta rodada.

## Fechamento

doctor/validate/verify --product e git diff --check passaram. verify executou os
testes do Harness, probe, lint/typecheck e comprovou29 casos offline por relatório
estruturado; parcial:true/readiness:not-assessed. Build e integração reais foram
executados separadamente, não atribuídos ao agregador. Após a melhoria do teste
por fase, verify --product voltou a comprovar o launcher dos seis casos novos.

Diff exclusivo completo (inclui arquivos novos; base inicial limpa):
`C:\Users\thiag\AppData\Local\Temp\authz-001.diff`.
Somente código/documentação/testes/scripts atribuídos; nenhum segredo ou artefato
gerado. Nenhum Git mutável, banco remoto ou próxima funcionalidade iniciado.

Conferência documental adicional: prompt integral idêntico ao anexo;112 links
locais/âncoras conferidos, sem erro. Diff completo validado por git apply --check
--reverse (somente leitura), incluindo os12 arquivos novos.

## Arquivos da rodada

- API: `app/api/users/route.ts`, `app/api/users/[id]/route.ts`.
- Servidor: `server/users/policy.mjs`, `repository.mjs`, `handler.mjs`, `index.ts`.
- Administração: `scripts/database/admin-user.mjs`, `admin-user-cli.mjs`.
- Testes: `tests/authorization/server.test.mjs`, `server-runner.test.mjs`,
  `http-postgres.mjs`; `tests/database/integration.test.mjs` e
  `tests/registration/http-postgres.mjs` (prontidão401 e callback compartilhado).
- Comandos: `package.json` (sem dependências novas).
- Documentação: `SOLUTION.md`, `docs/AI_PROMPTS.md`, `docs/ARCHITECTURE.md`,
  `docs/REQUIREMENTS.md`, `docs/harness/evidence/authorization-plan.md`,
  `authorization.md`, `docs/harness/memory/project-state.md` e `handoff.md`.
