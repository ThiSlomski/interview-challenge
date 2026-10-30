# CONTAINER-001 — contrato

30/10/2026 · pedido integral em [prompt](../../prompts/2026-10-30-containerization.txt).
Base verificada: main/0c8e6824cfb0ae42b8fd6798a1a87d1c8ff9c473, Git limpo.

- Responsável: sessão principal, escrita e autorrevisão sequenciais, sem delegação.
- Escopo autorizado: Dockerfile, Compose, inicializador idempotente, gateway TLS,
  smoke, job independente, configuração standalone e documentação canônica.
- Exclusões: funcionalidades/API/UI/schema/guardas/dependências/lock/README,
  banco persistente, credenciais reais, Git mutável e publicação.
- Entradas: package, next.config, provision/migrate/config/checker, CI, testes,
  README, handoff/estado, contrato e política de contexto do Harness.
- Contrato: PostgreSQL loopback no namespace de db; init migra→grant→check;
  runtime só imobilead_app. Cookie Secure e exigência HTTPS preservados.
- Aceite: build sem cache, health, HTTP real, Chromium/clima, persistência,
  grants/migrations repetíveis, isolamento e cleanup por nome/labels; lint,
  tipos, testes, audit, Harness e documentos. [Resultados](containerization.md).
- Uma execução por hipótese, até duas correções; falhas intermediárias e limites
  registrados. Consolidação documental pela própria sessão principal.
- Revisão humana e CI remoto do diff pendentes; nenhum commit/push/deploy.
