# CONTAINER-001 — containerização

30/10/2026 · base limpa main/0c8e682 · [contrato](containerization-plan.md) ·
[pedido integral](../../prompts/2026-10-30-containerization.txt).

## Arquitetura e limites

PostgreSQL → db-init (provisionamento inicial, migrations, grants, check) → Next.js
standalone → Caddy TLS local. Todos compartilham apenas a rede de db, nunca rede
host/PID/filesystem. URLs e identidade SQL continuam exigindo127.0.0.1:5432/imobilead.
PostgreSQL e Next escutam somente no loopback do namespace. Só3443/tcp é publicado
como127.0.0.1:3000 por padrão (3300 nos testes).5432 não é publicado.

Credenciais sintéticas fixas são exclusivamente para o Compose local. Administrador
em db (bootstrap do PostgreSQL) e db-init; migration só no init; app só runtime.
Não há conta admin de produto padrão. Smoke promove exclusivamente sua fixture.
Nenhuma leitura de .env.local ou conexão ao PostgreSQL instalado no Windows.
Volume nomeado postgres-data, sem external/name/bind para dados. Namespace não é
host, sem host.docker.internal ou montagem de socket Docker dentro dos serviços.

Runtime node não root, standalone/static/public, filesystem read-only, /tmp tmpfs,
ALL capabilities removidas, no-new-privileges, init e CMD exec para sinais.
Gateway não root/read-only/tmpfs, sem bind de código ou certificado na imagem.
Sua CA/certificados são efêmeros, mudam ao recriar/reiniciar. Exige confiança local
explícita no navegador; não altera trust store do host automaticamente.
Health da app verifica HTTP401 sem sessão; db verifica readiness; init verifica
SQL/ACL efetiva. Não se apresenta esse health HTTP como consulta autenticada ao DB.

## Imagens verificadas no registry

Digests OCI multi-plataforma reais, confirmados com docker buildx imagetools inspect:

| Imagem | Digest SHA256 |
| --- | --- |
| node:22.13.1-bookworm-slim | 83fdfa2a4de32d7f8d79829ea259bd6a4821f8b2d123204ac467fbe3966450fc |
| postgres:18.6-bookworm | 5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8 |
| caddy:2.10.2-alpine | 4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d |

Plataforma executada: Docker Desktop Linux/amd64; Node host22.13.1.
Nenhum scan de vulnerabilidades das imagens foi adicionado; audit cobre npm.
Fixação histórica de Node é exigência explícita, não atualização automática de SO.

Fontes primárias: [network_mode/depends_on](https://docs.docker.com/reference/compose-file/services/),
[Next standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Execuções e correções

- Primeiro build multi-stage sem cache aprovado; npm ci405 pacotes, audit0;
  Next16.4.3 build/TypeScript aprovados. Avisos preexistentes React18 e ESLint9 EOL.
- Primeira subida de ic-container-20261030 falhou antes de iniciar DB porque opções
  tmpfs não estavam entre aspas no YAML flow. Strings corrigidas; único container
  criado, rede e volume próprios removidos após conferir nomes/label.
- Gateway oficial possui file capability para porta baixa, exec falhou com EPERM
  sob cap_drop ALL. Imagem derivada executa setcap -r, usa3443 e preserva hardening.
- Smoke esperava logout204; API existente retorna200. Corrigida a expectativa do
  teste; nenhuma mudança de produto. Restart explícito exclui o one-shot init;
  recriação com up executa novamente a sequência completa.
- Integração PostgreSQL/HTTP65/65, zero skips/falhas; runner Linux com cópia
  allowlist sem .env e dependências Linux da imagem de ferramentas. Fixtures em
  bancos/papéis exclusivos; cleanup0 e metadados/ACLs da base Compose iguais.
  Isso não representa inspeção do banco persistente Windows.
- Chromium produção1/1: cadastro real, dois REST no navegador com respostas
  sintéticas Open-Meteo, previsão/ícone/data, login Secure/HttpOnly e logout.
  Certificado ignorado só no contexto de teste; nenhuma configuração global TLS.
  Disponibilidade real dos servidores Open-Meteo não é condição deste teste.
- npm test62/62; lint/typecheck aprovados; npm audit --audit-level=high:0 vulnerabilidades.

## Resultado final

Projeto final novo: `ic-smoke-final-20261030-0500`, porta3300, volume próprio.
Passos locais equivalentes a todos os passos executáveis de container-smoke:
config --quiet → build --no-cache → up --wait120 → smoke → cleanup. Saída zero.
Não é execução do GitHub Actions nem comprovação de branch protection remota.
Chromium local adicional1/1, zero falhas/skips. Nenhuma imagem publicada.

Smoke em produção confirmou cadastro/login, cookie __Host-/Secure/HttpOnly, own GET,
user403/admin200, edição de perfil com versão, CSP, duas migrations, runtime,
restart e down/up sem-v preservando sessão/perfil, exclusão204/cascade/sessão401,
logout200/invalidação401, três health healthy e db-init ExitCode0. Logs do init após
recriação: applied0 e COMPOSE_INIT_OK; db:check real reaprovado após recriação.
Pg_hba_file_rules:0 regras trust;0 bancos/papéis de fixtures remanescentes.

Inspeções da imagem/runtime: user node, uid não zero, read-only, cap_drop ALL,
no-new-privileges; sem env/Git/tests/scripts administrativos na imagem runtime;
config ENV da imagem sem credenciais e histórico sem URLs/senhas sintéticas.
Contexto allowlist exclui env/Git/dependências/artefatos/evidências/fixtures locais.
Isso confirma o caminho de build inspecionado; não é scan de todas as bases OS.

Lint/tipos/npm test62 e audit0 passaram. Build de produção foi executado dentro
do Docker, sem sobrescrever .next do servidor local do Windows. Integração65/65
foi separada, em Linux/PG descartável. Harness doctor/validate/verify --product
aprovados: prova62 testes Node; partial:true/readiness:not-assessed, build/browser/
PG comprovados separadamente. Validação YAML2, UTF-8 estrito, links/âncoras e
git diff --check aprovados. Validador considerou IDs HTML explícitos dos prompts.
Problema de encoding no pipe PowerShell e linhas vazias finais dos acréscimos
documentais corrigidos antes da validação final. README, package/lock, guardas,
SQL/migrations, APIs/UI e três jobs existentes preservados em relação à base.
Bloco AGENTS gerado pelo Next restaurado à base inicialmente limpa.

### Isolamento e limpeza

Prova estrutural: nenhum namespace host, URL host.docker.internal, env-file, bind de
dados do Windows ou publicação5432. Namespace é o ID de container PostgreSQL
próprio, que escuta127.0.0.1; app usa só imobilead_app. Integração montou somente
cópia allowlist sem .env e nunca usou credenciais do persistente. Nenhuma leitura
de cadastros ou conexão ao PostgreSQL Windows foi necessária para essa prova.

Projetos intermediário `ic-container-20261030`, smoke `ic-smoke-20261030-0448` e
final foram criados nesta rodada e removidos por nomes/labels exatos. Em cada
smoke completo, cleanup inspecionou ownership e removeu4 containers,1 volume,
1 rede. Inventário final de containers/volumes/redes:0/0/0 por label.
Tags de imagens locais próprias removidas; imagens base/cache Docker mantidos.
Nenhum prune/remoção global, nenhum recurso externo incluído.

A remoção da pasta temporária de fontes
`C:\Users\thiag\AppData\Local\Temp\ic-container-qa-20261030-0450`
foi rejeitada pela revisão automática com "blocked by policy", inclusive usando
caminho literal após Resolve-Path. A pasta permanece sem .env/node_modules;
pendência de limpeza de arquivos separada da limpeza Docker concluída.

Diff exclusivo completo (inclui arquivos novos, fora do repo):
`C:\Users\thiag\AppData\Local\Temp\ic-containerization-20261030.diff`.

### Arquivos da entrega

- Dockerfile, .dockerignore, compose.yaml, docker/Caddyfile, next.config.mjs.
- scripts/container/init.mjs, health.mjs, smoke.mjs, cleanup.mjs.
- tests/container/browser.test.mjs e .github/workflows/ci.yml (só job novo).
- SOLUTION.md, docs/ARCHITECTURE.md, docs/REQUIREMENTS.md, docs/AI_PROMPTS.md,
  docs/prompts/2026-10-30-containerization.txt, esta evidência e contrato.
- Memória canônica: handoff.md, project-state.md, index.md, decisions.md, lessons.md.

Sugestão de commit (não executado):
`feat(devsecops): containeriza app e PostgreSQL com smoke bloqueante`.

## Revisão

Autorrevisão sequencial. Guarda/configuração/SQL de produto preservados; revisão
humana e execução remota do novo job pendentes. Jobs existentes preservados por
comparação do prefixo do workflow com a base. Sem commit/push/publicação/deploy.
