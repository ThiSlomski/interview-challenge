# CI-001 — contrato, 30/10/2026

- Pedido: [prompt integral](../../prompts/2026-10-30-devsecops-ci.txt).
- Base: main/b98c2f4042a014fc57bfdfdd8ecdfe742e9fb716, árvore limpa.
- Requisitos: CI-1/2/3, SEC-7, 14–15, 18.a, ENT-4; fase 1 local.
- Responsável: orquestrador; execução e autorrevisão sequenciais. Sem delegação,
  pois workflow/documentação compartilham decisões e não há ganho concreto.
- Escopo de escrita: .github/workflows/ci.yml, SOLUTION.md,
  docs/ARCHITECTURE.md, docs/REQUIREMENTS.md, docs/AI_PROMPTS.md,
  docs/prompts/2026-10-30-devsecops-ci.txt, docs/harness/evidence/ci*.md,
  docs/harness/memory/{handoff,project-state,index,decisions}.md. Complemento
  necessário após reprodução: scripts/harness/harness.test.mjs, somente cópia
  de .github para a fixture documental agora referenciada pelos links novos.
- Sem mudanças de produto/UI/schema/guardas/dependências/lockfile, commit,
  push, deploy, configurações remotas ou banco principal.
- Entradas: README integral, scripts package.json, workflow, exemplo de ambiente,
  guardas/fixture PostgreSQL, testes offline/servidor/HTTP/auth/authz/UI,
  Harness, solução, arquitetura, requisitos e memória canônica.
- Contrato DB: somente TEST_ADMIN_DATABASE_URL local autorizado; DDL/DML nos
  bancos/roles aleatórios da execução. Banco-base apenas para conexão,
  criação/remoção dos recursos próprios e leitura de metadados protegidos.
- Aceite: três jobs bloqueantes, Node22.13.1/npm ci/cache, PostgreSQL18 isolado,
  audit high bloqueante, permissões mínimas, SHA oficial, testes reais e docs.
- Verificação: YAML, lint, typecheck, npm test, test:db:integration, build,
  audit high, doctor/validate/verify, links/âncoras/UTF-8/fences/diff.
- Limite: uma execução e até duas correções por hipótese nova; não repetir
  suítes válidas sem alteração relevante. Consolidar resultados sanitizados em
  [ci.md](ci.md), separando execução local, remoto da base e remoto do diff.
- Fase 2 depende da aprovação humana; usuário fará commit/push. Nenhuma ação
  remota mutável autorizada nesta fase; revisão humana permanece pendente.
