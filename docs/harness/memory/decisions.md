# Índice de decisões

## CI-001 — 30/10/2026

Três jobs bloqueantes, Node22.13.1/npm ci/cache, PostgreSQL18 efêmero,
SCA high/critical, SHA oficial e mínimo privilégio. UI fica local e CodeQL
opcional não adicionado. Rede compartilhada com o serviço preserva a guarda
inet_server_addr loopback, sem conexão ao principal.
[Decisão](../../ARCHITECTURE.md#ci-001--pipeline-bloqueante-30102026),
[contrato](../evidence/ci-plan.md) e [evidência](../evidence/ci.md).
Fase2/revisão humana e CI remoto do diff pendentes; sem commit/push.

## WEATHER-001 — 30/10/2026

Open-Meteo sem chave, diretamente no navegador: geocodificação com localização
e previsão com coordenadas; índice 1 dos dois dias em timezone=auto. Sem proxy,
endpoint interno, dependência nova ou persistência. URLs restritas e credenciais
omitidas; somente connect-src acrescentado à CSP antes ausente na base a640fa6.
Validação externa, prazo, abortos/geração, retry e confirmação independente.
[Decisão completa](../../ARCHITECTURE.md#weather-001--previsão-no-navegador-30102026),
[contrato](../evidence/weather-plan.md) e
[evidência UI](../evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).
Autorrevisão sequencial; revisão humana e CI remoto pendentes.

## REG-001 — 29/10/2026

POST /api/users, Argon2id (@node-rs/argon2 2.2.2), validação compartilhada sem banco,
SQL parametrizado/default user, origem fixa e quotas locais. Decisões, formatos
suportados e trade-offs na [arquitetura](../../ARCHITECTURE.md#reg-001--cadastro-pela-api-29102026).
Resultados e revisão em [evidência](../evidence/registration.md). Sem sessão ou
alteração de privilégios; revisão humana pendente. Índices anteriores históricos.

28/10/2026 · origem Prompt 5 · status registrado · evidência
[arquitetura](../../ARCHITECTURE.md).

- Estabilização de lint/TypeScript: registros anteriores na arquitetura.
- Harness V1 local: ADR-H001 no mesmo documento; formato, alternativas e limites.
- Contexto/concorrência: [TOKEN_POLICY](../TOKEN_POLICY.md); dois especialistas,
  histórico herdado declarado, sem estimativas de tokens/custo.
- Banco/auth/admin/runner: decisões pendentes, sem escolha antecipada.

## DB-001 — decisões atuais, 29/10/2026

Origem: pedido DB-001 e acordo Backend/Banco; estado implementado em arquivos,
com execução real separada em [evidência](../evidence/database.md). Os itens de
banco/auth/runner “pendentes” acima são históricos da etapa Harness.

- ADR-DB001: PostgreSQL 18; pg8.23.1, node-pg-migrate9.0.0, SQL explícito,
  versões exatas; alternativa Prisma e consequências na arquitetura.
- ADR-DB002: users/sessions, e-mail canônico único com política ASCII explícita,
  nullable text para campos sem obrigatoriedade/limites definidos no README.
- ADR-DB003: sessão opaca com digest, expiração absoluta1h e revogação; admin
  futuro por promoção explícita local de usuário existente, sem seed/conta padrão.
- ADR-DB004: ADMIN/migrations/runtime separados; users SELECT/INSERT por colunas,
  sessões DML; novos objetos exigem grants mínimos explícitos, sem defaultgrant amplo.
- Destino exclusivo127.0.0.1:5432/imobilead; integração em banco descartável aguarda
  compatibilizar autorização, sem extrair credenciais de extensão ou mudar HBA.
- Node test runner escolhido para configuração offline; adaptação existente do
  harness reconhece casos reais. Não confundir com testes PostgreSQL reais.

Fonte canônica: [arquitetura](../../ARCHITECTURE.md), ADRs DB001–004.
