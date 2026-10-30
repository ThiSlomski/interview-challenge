# CI-001 — evidência, 30/10/2026

## CI-001-R1 — runtime interno das actions, 30/10/2026

Pedido delimitado: corrigir somente os avisos Node20 das actions; responsável
único/autorrevisão sequencial, sem delegação. Base main/2d45597ac143ca5e0e53961a4bd0fed70bf1352a,
árvore inicialmente limpa. Escrita: workflow, versão vigente em SOLUTION e este
registro de CI. Os três jobs verdes foram informados pelo usuário; esta rodada
não atribui esse resultado ao novo diff nem altera configuração remota.

Releases oficiais estáveis (draft:false/prerelease:false), tags resolvidas para
commits oficiais completos e action.yml consultado diretamente por SHA:

| Action | Release | SHA | runs.using |
| --- | --- | --- | --- |
| checkout | [v5.1.0](https://github.com/actions/checkout/releases/tag/v5.1.0) | fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 | node24 |
| setup-node | [v5.0.0](https://github.com/actions/setup-node/releases/tag/v5.0.0) | a0853c24544627f65ddf259abe73b1d18a591444 | node24 |

Escolhida a linha v5 para a migração mínima ao runtime interno Node24. Exige
runner >=2.327.1, compatível com o runner hospedado ubuntu-24.04 existente.
O checkout5.1.0 traz proteção adicional de pull_request_target; este workflow
usa pull_request comum e não habilita checkout inseguro. Cache npm explícito
preservado, sem ativar opção adicional de cache automático do setup-node.

As seis ocorrências foram atualizadas por SHA; aplicação e imagem de integração
permanecem Node22.13.1. Comparação estrutural do YAML antes/depois, normalizando
somente os campos uses, exige igualdade completa: comandos, jobs, permissões,
timeouts, credenciais não persistidas, cache, serviço PG e proteções intactos.
Sem variável de supressão/compatibilidade com Node20 e sem tags móveis.

Validações desta correção: YAML e igualdade estrutural aprovados; action.yml
oficial de ambos os SHAs confirma node24. Doctor/validate/verify aprovados;
verify parcial/readiness not-assessed, com testes Harness, probe, lint e typecheck
aprovados. UTF-8/fences dos3 arquivos,27 links locais/10 âncoras e diff --check
aprovados. Patch exclusivo contra a base limpa, conferido com
git apply --check --reverse:
C:\Users\thiag\AppData\Local\Temp\devsecops-ci-actions-node24.diff.
Resultados funcionais abaixo são históricos; testes de produto, build, banco/UI
e audit não foram reexecutados nesta correção de referências.
Novo CI remoto e desaparecimento dos avisos na interface ainda não observados;
dependem do commit/push pelo usuário. Sem commit/push nesta rodada.

Os registros abaixo preservam a implementação inicial, inclusive versões v4 e
suas verificações, e são superados por R1 apenas quanto às versões das actions.

Fase1 local, revisão humana pendente. [Contrato](ci-plan.md),
[prompt integral](../../prompts/2026-10-30-devsecops-ci.txt),
[workflow](../../../.github/workflows/ci.yml),
[jobs/comandos/variáveis](../../../SOLUTION.md#ci-e-próxima-etapa),
[decisão](../../ARCHITECTURE.md#ci-001--pipeline-bloqueante-30102026).

## Base e diagnóstico

main/b98c2f4042a014fc57bfdfdd8ecdfe742e9fb716; árvore inicialmente limpa.
Workflow único ci.yml: Node20, um job sem timeout/permissões/concorrência,
audit report-only, nenhuma integração PG e comentários falsamente indicando
testes placeholder. npm test já era real, incluindo launchers servidor.
Não havia workflow_dispatch. Actions usavam tags major mutáveis.

Consulta remota somente de leitura via gh: repositório público, Actions enabled,
allowed_actions=all, sha_pinning_required=false; workflow CI ativo. CodeQL
default setup not-configured. Run41009122441 success para o HEAD-base, confirmado
pela API (não apenas relato). [Execução da base](https://github.com/ThiSlomski/interview-challenge/actions/runs/41009122441).
Isso não executa nem comprova os novos jobs. Configuração remota não foi alterada.

## Implementação e autorrevisão

Quality15min: Checkout → Setup Node → npm ci → lint → typecheck → Test/npm test → build.
Postgres-integration20min: serviço saudável → Checkout → Setup Node → npm ci →
Test PostgreSQL and HTTP/npm run test:db:integration.
Security10min: Checkout → Setup Node → npm ci → npm audit --audit-level=high.
Todos no Ubuntu24.04/Node22.13.1/cache npm oficial. Erros não são suprimidos.

Actions oficiais checkout4.3.1 e setup-node4.4.0 fixadas pelos SHAs consultados
diretamente nos repositórios actions/checkout e actions/setup-node via API:
34e114876b0b11c390a56381ad16ebd13914f8d5 e
49933ea5288caeca8642d1e84afbd3f7d6820020. contents:read,
persist-credentials:false, concorrência workflow/ref e cancel-in-progress:true.

Serviço postgres:18, sem volume, usuário administrativo ci_fixture_admin e
senha sintética ci_only_disposable_2026; não são credenciais reais ou secrets.
Banco-base imobilead vazio só neste serviço, nome exigido pela guarda existente;
sem conexão do CI ao banco persistente. Loopback127.0.0.1:5432, host auth SCRAM,
pg_isready com intervalo10s/timeout5s/start10s/retries10. Tag major explícito,
sem digest; atualizações menores permanecem mutáveis.
Somente no passo de teste: TEST_ADMIN_DATABASE_URL sintética para esse serviço,
DB_TRUST_REMOVED=true e DB_DISPOSABLE_TEST_AUTHORIZED=true.

Inspeção da fixture: sem fallback, URL/host/porta/nome validados, autorização
explícita; bancos imobilead_test_<hex12>, papéis de migração/runtime próprios e
senha aleatória. BEGIN/COMMIT de criação dos papéis; conexão encerrada desfaz
transação incompleta. finally tenta fechar clientes, remover apenas recursos
identificados, consultar catálogo e comparar metadados protegidos; falha quebra
o runner. Next recebe somente credencial do papel runtime temporário em env,
sem copiar .env.local ou herdar credenciais administrativas. Saída bruta do
Next/erros PG é limitada e retida; diagnósticos publicados são sanitizados.
Kill forçado pode interromper finally; o CI descarta o serviço ao terminar.

Integração executa auth9 + autorização7 + cadastro8 + privilégios15 subtestes,
além do teste principal com migrations1/0, constraints, sessões e concorrência.
Nenhum skip/todo condicional configurado; UI_BROWSER_TEST/UI_RACE_TEST não são
definidos no workflow. Suíte padrão não lança Chromium, embora importe helpers.
UI completa, concorrência e clima UI mantidos locais: navegador ainda não
provisionado pelo workflow, autofill CDP/capturas versionadas e nenhuma prova
de portabilidade Ubuntu. Sem improvisar instalação nem alterar suíte/UI.

SCA high/critical bloqueante, incluindo devDependencies; low/moderate visíveis
sem bloquear pelo limiar. Sem force/correção automática/aceite silencioso.
CodeQL opcional avaliado e não incluído; nenhum setup avançado validado nesta
entrega. Não se presume proteção de branch/checks obrigatórios para merge.
Autorrevisão sequencial, sem subagentes ou revisão independente adicional.

O passo HTTP/PG executa o comando canônico dentro da imagem oficial
node:22.13.1-bookworm, fixada no digest Linux amd64
sha256:8ef2dd8a3a6d24354800fb796cf256a6ec7ec8c3a388289469255ed8a12ed378
(verificado no manifest do registro). docker run --network container:<service-id>
compartilha a rede do PostgreSQL, conservando127.0.0.1 tanto na URL quanto em
inet_server_addr(). Uma porta publicada comum faria essa guarda falhar pelo
endereço bridge. As dependências instaladas pelo npm ci no runner Linux são
reutilizadas por mount read-only em /workspace; fixtures Next/saídas ficam em
/tmp do contêiner. --rm/--init limitam resíduos e propagam o código de saída.
POSTGRES_CONTAINER_ID é metadado sintético do serviço, não credencial.
POSTGRES_INITDB_ARGS=--auth-host=scram-sha-256 também exige senha no TCP
loopback; apenas POSTGRES_HOST_AUTH_METHOD não bastaria para as regras localhost
geradas pelo initdb. Nenhuma guarda de produção foi alterada.

## Validação local

Ambiente Windows, Node22.13.1/npm10.9.2/PostgreSQL18. Execuções locais separadas
do GitHub Actions Linux; resultados atuais abaixo, sem reaproveitar QA histórico.

| Verificação | Resultado |
| --- | --- |
| npm ci Windows | Aprovado em diretório temporário com cópias idênticas dos manifests:400 pacotes,401 auditados |
| npm ci Linux Docker | Aprovado:405 pacotes,406 auditados, zero vulnerabilidades; Node22.13.1/npm10.9.2 |
| npm run lint | Aprovado |
| npm run typecheck | Aprovado |
| npm test | 55/55, zero falhas/cancelamentos/skips/todo; launchers cadastro8/auth11/autorização6 |
| npm run test:db:integration | 40/40, fail0/cancelled0/skipped0/todo0, PostgreSQL/Next HTTP reais |
| Cleanup PG | confirmed, remainingResources0, protectedMetadata unchanged em ambas as execuções |
| HTTP/PG Linux Docker | 40/40, zero falhas/cancelamentos/skips/todo,247s no teste principal; mesma imagem Node/rede/mount read-only do workflow |
| npm run build | Código0: compilação, TypeScript e páginas aprovados |
| npm audit --audit-level=high | Código0, zero vulnerabilidades |
| YAML | js-yaml: sintaxe/asserts do contrato aprovados; bash -n do passo Docker aprovado |
| Harness doctor | ok:true; Node/Git/npm/Codex disponíveis |
| Harness validate/verify | Aprovados: validate ok; verify --product ok, partial:true/readiness:not-assessed;27 testes Harness e55 Node comprovados |
| Links/âncoras, UTF-8/fences, diff --check | Aprovados:13 arquivos UTF-8/fences,282 links locais,101 âncoras; diff --check limpo |
| UI nesta rodada | Não executada; decisão de manter local documentada |
| CI remoto do diff | Não executado; fase2 pendente |

Falha intermediária preservada: npm ci na raiz retornou EPERM ao remover o
binário Argon2 em uso. Nenhum processo do usuário foi encerrado. Hipótese de
arquivo bloqueado: executar npm ci isolado; passou com zero vulnerabilidades.
Dependências locais recompostas da instalação limpa comparando SHA256 e
copiando apenas arquivos distintos/ausentes;16565 copiados,6121 idênticos.
npm ls --depth=0 código0 com duas dependências extraneous já observadas no
ambiente (@emnapi/runtime e @img/sharp-wasm32); isso não altera manifests/lock.
ESLint9 sem suporte e depreciação React18 no build são avisos preexistentes;
nenhum finding SCA atual foi aceito. tsconfig.json permaneceu inalterado.

## Diff e pendências

Falha intermediária Harness:26/27, fixture documental sem .github; os novos
links para ci.yml ficavam ausentes só na cópia isolada. Reproduzido diretamente;
acrescentado .github ao allowlist (uma linha), sem enfraquecer validações.
Docker inicialmente indisponível; após usuário informar engine ativo, engine
29.5.3/desktop-linux confirmado. Fixture nova sem portas publicadas, cópia
seletiva de fontes sem .env.local; PostgreSQL18.6 saudável, endereço127.0.0.1
e senha sintética incorreta rejeitada por TCP. Imagem PostgreSQL obtida:
sha256:979bccfde35445db618c65107d27d08c6c21339d8dc3ad4c830c6633947be0e4.
Suíte Docker concluída40/40, cleanup confirmed/remainingResources0/protectedMetadata
unchanged. Catálogo da fixture confirmou0 bancos e0 papéis de teste. Contêiner
PostgreSQL encerrado/removido; contêineres Node usam --rm. Na máquina local não
foi publicada a porta5432 para não disputar a porta existente; no CI a porta
publicada pertence somente à VM efêmera. Isso não altera a rede compartilhada
entre Node/PG. Docker Desktop local não comprova os três jobs no GitHub Actions.
Conferência editorial encontrou conversão ASCII em trechos novos via pipe
PowerShell; reescritos explicitamente em UTF-8, preservando os históricos.

O diff exclusivo desta rodada parte de HEAD-base limpo, inclui arquivos novos,
sem staging/commit/push. Patch final: C:\Users\thiag\AppData\Local\Temp\devsecops-ci-001.diff,
conferido com git apply --check --reverse.
Produto/UI/schema/guardas/manifest/lock/exemplo de ambiente preservados;
única alteração Harness é a cópia da pasta .github no teste documental.

Limpeza de arquivos temporários de instalação: revisão automática rejeitou
Remove-Item -Recurse, inclusive com destino literal conferido, informando apenas
blocked by policy. Não se contornou essa rejeição; diretório npm preservado:
C:\Users\thiag\AppData\Local\Temp\devsecops-ci-install-c71e03fae39f4533a671b3a6b961aeca.
Também permanece a cópia Linux com fontes/dependências, sem .env.local:
C:\Users\thiag\AppData\Local\Temp\devsecops-ci-docker-7a302a4c10504bb3874c475a9bf59437.
A limpeza de arquivos locais é pendência distinta do cleanup de banco/roles.
Sondagem inicial do nome de volume falhou por parsing do template Docker;
a remoção automática do volume anônimo usa --rm. Inventário posterior registrado
no fechamento confirmou0 volumes Docker e0 contêineres Node correspondentes,
sem depender desse template. Imagens baixadas permanecem em cache.

Fase2 somente após revisão humana: usuário fará commit/push; acompanhar execução
do SHA publicado e exigir quality, postgres-integration e security verdes.
Novo workflow ainda não concluído remotamente. Nenhum deploy/publicação.
Sugestão de mensagem reservada à fase2, sem executar commit:
`ci: valida qualidade, PostgreSQL descartável e SCA bloqueante`.
