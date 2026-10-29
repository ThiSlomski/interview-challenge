# DB-001 — contrato da etapa de banco, 29/10/2026

Base: main, HEAD 2ee16c787dd77b23da02353d1667ab7568258941, árvore limpa.
Pedido atual autoriza banco e substitui a restrição temporária de fase Harness.
README integral lido; doctor e validate passaram antes da implementação.

- Requisitos: 1 (estrutura), 4, contrato de 6/8.d/9/10.f, testes de persistência
  relacionados a 14–15, documentação 16–18. Cadastro/auth não ficam concluídos.
- Escopo: PostgreSQL local 127.0.0.1:5432/imobilead, ferramenta de migrations,
  modelo usuários/sessões, papéis mínimos, conexão servidor e testes reais.
- Exclusões: endpoints, telas, login/cookies/logout, clima, CI, Git mutável,
  Sillage, configurações pessoais e autenticação PostgreSQL.
- Banco (ganho: especialização em constraints/migrations/permissões): dono de
  `database/**`, `scripts/database/**`, `tests/database/**`, `server/db/**`,
  `.env.example`, `package.json`, `package-lock.json`. Primeiro analisar;
  implementar sessões somente após contrato revisado por Backend.
- Backend (ganho: compatibilidade futura de sessão e exposição de dados):
  revisão sem escrita inicial do contrato; revisão final independente de
  migrations, privilégios e segredos, também sem escrita.
- Documentação (ganho: consolidar resultados dos dois papéis): após retornos,
  dono de `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `SOLUTION.md`,
  `docs/AI_PROMPTS.md`, `docs/prompts/2026-10-29-database.md`,
  `docs/harness/memory/**`, `docs/harness/evidence/database.md`.
- Orquestrador: este contrato, diagnóstico local delimitado, coordenação e QA.
  Atualização do usuário durante a execução: destino exclusivo
  `127.0.0.1:5432/imobilead`; não acessar credenciais da extensão VS Code.
  Conexão da extensão é informada pelo usuário, não prova conexão da aplicação.
  Plano de cluster efêmero cancelado antes de implementação/execução. Testes
  descartáveis serão preparados, mas execução em outro banco fica pendente de
  compatibilizar essa restrição. Nenhum arquivo de runner efêmero foi criado.
  Um escritor por arquivo; agentes não estão sozinhos, devem preservar edições.
- Aceite: versões exatas/documentação oficial; sem senha fixa ou logs secretos;
  nome <=150, e-mail normalizado único, hash separado, user padrão, sessões
  protegidas coerentes; migrations versionadas e provisionamento limitado.
  Testar instalação zero e repetição, constraints, FK, acesso DML e negação DDL
  com PostgreSQL real. Sem credenciais: implementar trabalho independente e
  registrar testes de integração não executados, sem substituir por mocks.
- Pré-condições para operações no banco: confirmar remoção de trust, conferir
  destino efetivo e inventariar objetos; não reset/drop/truncate de imobilead.
- Verificações finais: testes reais pertinentes, lint/typecheck/build/audit,
  harness validate/verify e diff --check. Revisão humana permanece pendente.
- Contexto: histórico herdado, leitura seletiva; até dois especialistas ativos.
  Cada contrato: 30 minutos, uma execução + até duas correções com hipótese nova;
  parar por conflito ou ambiente, devolver limitações e continuar partes independentes.
  Chamadas de documentação oficial/npm autorizadas; sem banco remoto ou segredos.
