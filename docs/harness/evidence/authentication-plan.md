# AUTH-001 — contrato, 29/10/2026

Base real main/1c96acb1a5c707c443daa53eb63dbca268ca561d. Alteração anterior em
AI_PROMPTS.md preservada; snapshot temporário fora da árvore para diff exclusivo.
README lido integralmente. Pedido atual autoriza login/sessão/logout e testes
mutáveis exclusivamente no runner PostgreSQL local descartável existente.

- Requisitos: 5, 6, 9, 10.a-f; 7 apenas consulta mínima, sem página/roles/UI.
- Backend implementa app/api/auth/**, server/auth/**, tests/auth/server* e extração
  compartilhada de normalização em shared/registration.mjs. Dono único desses arquivos.
- Orquestrador implementa tests/auth/http-postgres.mjs, ligação no runner DB,
  scripts npm e documentos compartilhados. Não altera migrations/grants/Harness/CI.
- Convenção: POST /api/auth/login, GET /api/auth/session, POST /api/auth/logout.
- Sessão: 32 bytes aleatórios, SHA-256 somente no banco, TTL obrigatório 3600,
  absoluto, sem renovação. Cookie local imobilead_session; produção __Host-imobilead_session,
  HttpOnly, SameSite=Lax, Path=/, Secure em produção. Nova sessão por login;
  preservar outras sessões inclusive anterior até logout/expiração (sem substituição).
- CSRF: APP_ORIGIN obrigatório; POST exige Origin exato, ausente/null recusado;
  recusar cross-site e navegação document/ navigate. Sem CORS amplo.
- Aceite: credenciais genéricas com dummy Argon2id equivalente, limites fixos de
  memória/corpo/prazo/concorrência, SQL parametrizado, persistir antes do cookie,
  autenticação central falha fechada, logout persistente repetível e erros sanitizados.
- Evidência: authentication.md; unitários controlados, HTTP Next dev + PostgreSQL
  descartável reais separados de navegador/HTTPS produção não exercitados.
- Delegação: ganho concreto Backend implementa contrato coeso enquanto orquestrador
  constrói integração real e documentação. Backend depois revisa testes de integração;
  segunda instância faz revisão independente de leitura do código de auth.
- Contexto herdado integral; até duas instâncias simultâneas; ninguém cria filhos.
- Tempo: implementação 25 min, revisão 8 min, uma execução e até duas correções com
  hipótese nova por problema. Parar em conflito de contrato/banco ou bloqueio externo.
- Checagens: npm test, servidor explícito, DB integração, lint/typecheck/build/audit,
  doctor/validate/verify --product/diff --check. Revisão humana pendente.
