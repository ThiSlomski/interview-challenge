# Índice de decisões

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
