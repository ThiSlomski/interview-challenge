# Executar a solução local

## Exclusão administrativa — ADMIN-DELETE-001

Aplicação local posterior autorizada e concluída: db:inspect antes/depois,
db:grant e db:check aprovados em127.0.0.1:5432/imobilead, com restart em localhost:3000.
Leitura de ACLs adicional explicitamente autorizada comprovou somente DELETE users
false→true e DELETE sessions true→false; direitos por coluna/schema/papel idênticos.
[Evidência L1](docs/harness/evidence/admin-delete.md#admin-delete-001-l1--preparação-persistente-autorizada).
Nenhum usuário/sessão foi excluído pelo agente; o teste humano continua pendente.
As instruções abaixo descrevem implantação em outros ambientes e o histórico
da implementação; não repetir efeitos já aplicados sem motivo/autorização.

Extensão do desafio: admin exclui definitivamente somente contas user pela
listagem; contas admin, inclusive a própria, não têm ação de exclusão e são
recusadas no servidor. A confirmação informa nome/e-mail e encerramento das
sessões, com foco em Cancelar, Escape e teclado/mobile. Só há confirmação de
sucesso após204 e nova consulta. Resultado incerto exige conferir a listagem.

API DELETE /api/users/[id] não recebe corpo:401 sem sessão,403 sem papel admin
antes de consultar o alvo,400 UUID inválido após autorização,409 autoexclusão/
alvo admin,404 inexistente/já excluído,204 sem corpo após commit. Sessões saem
pelo ON DELETE CASCADE existente, dentro da mesma transação. GET administrativo
inclui role apenas para apresentação; o endpoint continua autoridade final.

Não há nova migration. Após revisão e autorização separada para o banco
persistente, usar somente `npm run db:inspect`, `npm run db:grant`,
`npm run db:check`, `npm run db:inspect` e reiniciar a aplicação. Não repetir
provisionamento ou migrations por essa mudança. O grant canônico passa a conceder
DELETE users e revogar DELETE direto em sessions; SELECT/INSERT/UPDATE por colunas
e demais proibições são preservados. O checker novo falha fechado com ACL antiga;
não usar essa versão no persistente sem aplicar o novo contrato autorizado.
**Nenhum grant ou exclusão no banco persistente foi executado nesta etapa.**

Testes: `npm run test:admin-delete:server`, `npm run test:admin-delete:ui`;
Node e HTTP/PG também integram npm test/test:db:integration existentes. UI usa
Chromium/Next/PG descartáveis com as guardas locais anteriores; não há fixture
contra o persistente. [Contrato](docs/harness/evidence/admin-delete-plan.md),
[evidências, limites e roteiro manual sintético](docs/harness/evidence/admin-delete.md).
No teste humano futuro, criar conta sintética exclusiva e solicitar autorização
explícita antes de excluí-la; nunca usar qualquer cadastro persistente existente.

## Edição do próprio perfil — PROFILE-001

Aplicação local autorizada posteriormente: migration do perfil applied:1,
grants e db:check aprovados em127.0.0.1:5432/imobilead, destino conferido antes/
depois; app reiniciada em localhost:3000. [Evidência L1](docs/harness/evidence/profile.md#profile-001-l1--aplicação-persistente-local-autorizada).
Os parágrafos abaixo distinguem a implementação inicial do procedimento para
outros bancos existentes; não repetir provisionamento ou criar fixtures no persistente.

Evolução adicional ao enunciado; README preservado. Usuários e administradores
podem editar somente o próprio nome/endereço/cidade/estado/país/CEP/mensagem em
`/area` pelo botão **Editar meu cadastro**. E-mail permanece identificador imutável;
senha/papel não são editáveis. Cadastro e edição compartilham as mesmas regras
de texto, inclusive nome vazio, Unicode até150 e campos opcionais sem novos
limites por campo. O limite HTTP continua16KiB, igual ao cadastro.

Após revisão da entrega, um banco existente exige **nova migration e novos
grants**, sem repetir provisionamento: `npm run db:migrate`, depois
`npm run db:grant` e `npm run db:check`, com as credenciais administrativas/de
migração/runtime locais já documentadas. Reinicie a aplicação após atualizar
schema/grants. Esses comandos **não foram aplicados ao banco persistente pelo
agente nesta etapa**; testes usam exclusivamente bancos/papéis descartáveis.
Sem essa preparação a nova guarda de schema/ACL recusa o runtime.

`GET /api/profile` retorna `{user,profileVersion}` e ETag;
`PATCH /api/profile` exige JSON com `expectedVersion` numérico, pelo menos um
campo editável e `If-Match` igual à ETag recebida. Campos omitidos são preservados.
A versão integer começa em1, incrementa em cada edição confirmada e impede
sobrescrita silenciosa entre abas. HTTP409 exige recarga explícita; o rascunho
fica em memória e nunca em armazenamento Web. Se a resposta se perder, confira
os dados atuais antes de repetir, pois a transação pode ter sido confirmada.

Testes adicionais: `npm run test:profile:server` e `npm run test:profile:ui`.
`npm test` já inclui validação e launcher servidor do perfil; a integração
HTTP/PG do perfil faz parte de `npm run test:db:integration`, usado no CI.
O teste UI usa os mesmos pré-requisitos locais descartáveis/Chromium da suíte
existente; não está incluído no workflow remoto. Não execute testes mutáveis no
banco persistente. [Contrato](docs/harness/evidence/profile-plan.md),
[decisão](docs/ARCHITECTURE.md#profile-001--edição-própria-30102026),
[verificações e limites](docs/harness/evidence/profile.md).

Exclusão e containerização não foram iniciadas. O segundo commit funcional
planejado permitirá excluir somente contas user; contas admin serão recusadas,
com ator/alvo bloqueados e revalidados na transação, sem contagem de admins,
trava global ou coordenação com rebaixamentos futuros. Nenhum commit/push criado.

## Avaliar o frontend

Roteiro vigente único do frontend UI-001, incluindo a correção histórica UI-001-P1.
[Entrega principal](docs/harness/evidence/ui.md),
[capturas finais](docs/harness/evidence/ui-captures/README.md) e
[detalhe histórico da correção](docs/harness/evidence/ui-p1.md).

1. Prepare o ambiente conforme [pré-requisitos](#pré-requisitos-e-instalação),
   [credenciais](#credenciais-locais-separadas) e provisionamento abaixo. Não repita
   preparação de banco já existente. Configure APP_ORIGIN exata e
   SESSION_TTL_SECONDS=3600, execute `npm run dev` e abra essa mesma origem.
2. Na inicial `/`, escolha Criar cadastro. Confira erros de validação e preencha
   os campos com dados seus ou sintéticos no seu ambiente de avaliação.
3. Após sucesso em `/cadastro`, confira resumo sem senha e aviso de login necessário.
   Confira também Previsão para amanhã: localidade resolvida, data, condição,
   mínima/máxima, chuva quando disponível e atribuição Open-Meteo. Sem cidade
   não há consulta; indisponibilidade oferece Tentar novamente e mantém cadastro
   confirmado. Resumo e previsão existem somente em memória; recarregar/saída
   descarta. Entre em `/login`.
4. Consulte `/area`: usuário comum vê apenas o próprio cadastro. Sem sessão válida,
   a URL deve redirecionar; falha de infraestrutura exibe indisponibilidade segura.
5. Avalie a listagem paginada com administrador já provisionado pelo
   [procedimento explícito documentado](#promover-explicitamente-usuário-existente).
   Não há conta/senha padrão, e esta organização não promoveu usuários.
6. Use Sair; confira bloqueio por URL direta, refresh, voltar/avançar e navegação
   cliente. Falha de logout mantém erro seguro; Verificar acesso novamente permite
   recuperar a área após uma checagem válida, sem renovar a sessão.
7. Execute os [testes pertinentes](#testes-e-verificações): `npm test`,
   `npm run test:ui` para Chromium e `node --test tests/ui/race.test.mjs` para
   concorrência. Os dois últimos exigem somente o PostgreSQL descartável autorizado
   e as variáveis de teste descritas abaixo; não testam usuários de imobilead.

Rotas: `/`, `/cadastro`, `/login` e `/area` (admin usa `?after=UUID`).
Validação compartilhada preserva normalização/limites e servidor como autoridade;
senha de login segue intacta. Cookie HttpOnly recebido pelo navegador, sem token
em armazenamento Web. SSR reutiliza autenticação/política/projeção existentes.
Operações antigas são invalidadas por geração/aborto; checagens/logout têm prazo8s,
identidade conferida antes/depois da permissão e sessão absoluta3600s sem renovação.

Identidade Slomski Solutions com SVG/fontes locais; rodapé identifica o
Desafio técnico Imobilead e abre o site oficial com aviso acessível de nova aba.
Clima usa REST Open-Meteo diretamente no navegador, sem chave/configuração nova,
enviando somente localização/coordenadas. [Decisão e limites](docs/ARCHITECTURE.md#weather-001--previsão-no-navegador-30102026).
Revisão humana, CI remoto do diff e HTTPS/produção seguem pendentes.
Resultados históricos e verificação desta organização estão separados na entrega
principal; reorganizar documentos não reaprova por si só a correção assíncrona.

## AUTH-001 — autenticação API, 29/10/2026

Cadastro, login, sessões, logout e consulta autorizada estão implementados. O roteiro vigente do frontend está acima; esta seção preserva os contratos de API AUTH-001.

Configure APP_ORIGIN exata sem barra/caminho e SESSION_TTL_SECONDS=3600, obrigatórias
para auth também no desenvolvimento. Produção exige HTTPS; configuração inválida
retorna 503 AUTH_UNAVAILABLE. Cadastro mantém contrato REG-001.

| Endpoint | Contrato |
| --- | --- |
| POST /api/auth/login | JSON email/password; 200 user.id e cookie; 401 INVALID_CREDENTIALS uniforme |
| GET /api/auth/session | Cookie; 200 user.id/expiresAt ou 401 UNAUTHENTICATED |
| POST /api/auth/logout | Sem corpo obrigatório; revogação persistida e 200 ok:true, repetível |

POST exige Origin igual APP_ORIGIN, ausente/null recusados. Sec-Fetch-Site aceita
somente ausência/same-origin/none, Mode ausência/cors/same-origin, Dest ausência/empty.
Não há CORS amplo. Clientes de API devem enviar Origin explicitamente. Banco
indisponível retorna 503 AUTH_FAILED sem emitir/remover cookie de sucesso. Login:
400 entrada/JSON, 403 origem, 408 prazo, 413 corpo, 415 mídia e 429 limite.
Respostas usam no-store. Senha nunca é transformada; e-mail usa normalização de
cadastro sem acoplar validação completa do formulário.

Cookie de sessão imobilead_session em HTTP local e __Host-imobilead_session em
produção HTTPS: HttpOnly, SameSite=Lax, Path=/, sem Domain e Secure em produção.
Sem Max-Age na emissão; restauração de navegador não prolonga validade servidor.
Token CSPRNG32 bytes/base64url, somente digest SHA-256 persistido, nunca JSON ou
localStorage. Expiração absoluta3600s sem renovação, novo token por login;
sessões anteriores/outros dispositivos preservados. Logout revoga apenas token
apresentado antes de apagar cookie com mesmos atributos e Max-Age=0.

Função central authenticateSession em server/auth/session.mjs recebe provider,
Cookie, configuração e relógio; retorna sessão mínima/null e propaga falha DB para
chamador falhar fechado. Em página servidor pode passar
`(await cookies()).toString()`. Não confia em userId/role do cliente; páginas e
controle por papel usam os serviços existentes conforme a entrega frontend.

Limites por processo:30 tentativas/min global,5/min digest de e-mail,Map<=1024,
janela fixa60s,concorrência2,corpo4096bytes/5s. Ignora IP/Forwarded arbitrários.
Sucessos/falhas contam, sem bloqueio permanente. Quota pode ser esgotada por
terceiros e não coordena múltiplas instâncias/restarts. Produção requer controle
compartilhado e limites no ingresso, proxy confiável e monitoramento sanitizado.
Conta ausente verifica hash dummy Argon2id custo m19456/t2/p1 equivalente ao cadastro;
não se promete tempo constante de requisição inteira.

`npm run test:auth:server`: 11 casos controlados, relógio e DB de fixture.
`npm test`: inclui launcher auth além de cadastro/configuração.
`npm run test:db:integration`: nove cenários auth HTTP Next dev/PostgreSQL reais
no runner descartável já documentado abaixo. Não comprova navegador/TLS/__Host
produção. [Plano](docs/harness/evidence/authentication-plan.md),
[evidência](docs/harness/evidence/authentication.md) e revisão humana pendente.
## Pré-requisitos e instalação

- Node.js 22.13.1 e npm 10.9.2, usados na validação local.
- PostgreSQL 18 com autenticação por senha, destino autorizado nesta etapa:
  `127.0.0.1:5432/imobilead`. Não usar conexões remotas nem credenciais salvas
  em extensões. A conexão do VS Code é independente da conexão da aplicação.
- Uma credencial administrativa local para criar apenas os papéis/schemas deste
  desafio; ela não será usada pela aplicação.

```powershell
npm ci
```

Em instalação limpa, crie o banco `imobilead` por uma sessão administrativa local
com autenticação protegida, conectado ao banco de manutenção da instalação:

```sql
CREATE DATABASE imobilead;
```

Esse é um procedimento para o avaliador preparar ambiente novo; não o repita se o
banco já existir. No ambiente desta tarefa ele já foi criado pelo usuário no
DBeaver e não foi assumido vazio. A recuperação anterior de acesso foi contexto
local, não passo de instalação. Não configure `trust` para executar estes comandos.

## Credenciais locais separadas

Crie `.env.local` a partir de [.env.example](.env.example) somente se ainda não
existir. O Git ignora esse arquivo. Preserve configurações locais preexistentes:

```powershell
if (!(Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
```

Preencha os valores apenas no editor local ou por variáveis de ambiente da sessão.
Não envie senhas/URLs preenchidas ao chat, não as coloque em linha de comando e
não versione esse arquivo. Faça percent-encoding de caracteres reservados na senha
ao formar uma URL. Os scripts carregam `.env.local`; o servidor Next.js usa seu
carregamento normal de ambiente. Nenhum cliente deve receber essas variáveis.

| Variável | Uso |
| --- | --- |
| ADMIN_DATABASE_URL | credencial administrativa local, apenas provisionamento/grants |
| MIGRATION_DATABASE_URL | papel exclusivo imobilead_migrate, histórico e migrations |
| DATABASE_URL | papel imobilead_app, uso exclusivo do servidor da aplicação |
| DB_TRUST_REMOVED | defina true somente após conferir que regra trust temporária foi removida |
| SESSION_TTL_SECONDS | sessão absoluta de3600 segundos, sem renovação |

O clima não usa variáveis de ambiente nem credencial no uso adotado da
Open-Meteo. Os dois endpoints oficiais são constantes internas de
`shared/weather.mjs`; não há configuração pública de URL/chave. Os placeholders
legados de clima foram removidos do exemplo. `SESSION_TTL_SECONDS=3600` permanece
obrigatório para autenticação e não pertence à previsão.

Todas as URLs desta etapa apontam para `127.0.0.1:5432/imobilead`. O runtime exige
`imobilead_app` e verifica os privilégios efetivos; não use `postgres` na aplicação.
As credenciais de migrations e runtime serão preenchidas após criação dos papéis
e definição local de suas próprias senhas. O exemplo usa somente placeholders.

## Provisionamento e migrations desde banco novo

1. Preencha `ADMIN_DATABASE_URL` e confirme a remoção de `trust` em
   `DB_TRUST_REMOVED`. Execute:

   ```powershell
   npm run db:provision
   ```

   O comando confirma identidade/destino e inventaria os objetos antes de criar
   papéis/schemas. A saída contém somente metadados sanitizados. Ele recusa
   colisões com os schemas/papéis do projeto; não recria nem limpa banco existente.
   Se houver conflito, interrompa e revise o inventário antes de qualquer ajuste.
   Não use reset, drop ou truncate para contornar uma falha.

2. Defina senhas distintas para os papéis por entrada protegida de `psql`:

   ```powershell
   & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -X -W -h 127.0.0.1 -p 5432 -U postgres -d imobilead
   ```

   Se o administrador local tiver outro nome, substitua apenas o usuário. Dentro
   do `psql`, use os prompts protegidos, sem SQL contendo senha literal:

   ```text
   \password imobilead_migrate
   \password imobilead_app
   \q
   ```

3. Preencha localmente `MIGRATION_DATABASE_URL` e `DATABASE_URL` com seus papéis
   correspondentes. Inspecione e aplique a migration:

   ```powershell
   npm run db:inspect
   npm run db:migrate
   npm run db:migrate
   ```

   Em instalação nova, a primeira execução deve aplicar uma migration; a segunda
   deve informar `applied: 0`. Isso é o resultado esperado, não uma evidência de
   execução no banco deste usuário. O histórico reside em `imobilead_meta`.

4. Conceda o contrato de acesso e verifique a conexão da aplicação separadamente:

   ```powershell
   npm run db:grant
   npm run db:check
   ```

   `db:grant` usa a credencial administrativa e é repetível para as tabelas atuais.
   `db:check` usa `DATABASE_URL`, verifica identidade/privilégios e informa a
   contagem de objetos, sem mostrar credenciais nem linhas de usuários. Conexão
   bem-sucedida no DBeaver/VS Code não substitui essa verificação.

O papel `imobilead_migrate` detém os schemas do desafio; `imobilead_app` recebe
somente SELECT e INSERT por colunas em users, sem UPDATE/DELETE; `users.role`
não pode ser inserido pela aplicação e `user` é o padrão. Sessões recebem DML
necessário ao contrato de criação/revogação. Histórico e CREATE de objetos
permanentes não são concedidos ao runtime. O check recusa privilégios perigosos
e memberships; não altera permissões globais para corrigir o ambiente. A checagem
também exige USAGE no schema da aplicação e confere o contrato efetivo das
tabelas/colunas users, sessions e pgmigrations, incluindo direitos via PUBLIC.
INSERT por coluna é aceito sem exigir INSERT na tabela inteira. Direitos extras,
acesso necessário ausente, NULL, resposta incompleta ou erro não aprovam o ambiente.
Ela somente diagnostica: não aplica GRANT/REVOKE para reparar o banco existente.
Em divergência, revisar os direitos com administração local antes de qualquer
ajuste autorizado. PUBLIC
CONNECT/TEMP padrões do PostgreSQL não foram revogados nesta tarefa; não se
afirma isolamento absoluto do papel entre bancos nem bloqueio de tabela temporária.

Futuras migrations devem revisar grants mínimos explícitos para seus novos
objetos. Não há grant padrão de SELECT para toda tabela futura. Mantenha objetos
internos em schema sem acesso runtime. Atualize `db:grant` junto do contrato quando
necessário. Não crie conta admin padrão: AUTHZ-001 prepara a promoção local
explícita por UUID descrita abaixo, sem esse poder no cadastro público.

## Aplicação

```powershell
npm run dev
```

Abra a origem exata configurada em APP_ORIGIN (por exemplo http://localhost:3000). As telas e o fluxo de avaliação estão no roteiro único acima. server/db/index.ts é somente servidor e inicializa sob demanda; build ou tela pública não comprovam conexão ao banco. APIs e SSR continuam responsáveis pela autorização e projeção mínima.

## Testes e verificações

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm audit
node scripts/harness/harness.mjs doctor
node scripts/harness/harness.mjs validate
node scripts/harness/harness.mjs verify --product
git diff --check
```

`npm test` usa o runner nativo de Node, com arquivos explícitos de testes offline de
configuração, validação e launchers para registro8/auth11/autorização6 (condição `react-server`, sem banco). O launcher exige resumo completo, sem skips e status
de sucesso do processo filho. Também é possível rodar `npm run test:registration:server`.
Estes casos não testam migrations, constraints ou permissões reais. O adaptador
existente do harness reconhece os eventos estruturados desses casos; seu relatório
continua parcial, sem declarar prontidão do produto. Não foi afrouxado para o runner.


Para Chromium, instale o navegador uma vez com `npx playwright install chromium` e
execute `npm run test:ui`. O launcher autoriza explicitamente só o destino descartável;
exige TEST_ADMIN_DATABASE_URL local e DB_TRUST_REMOVED=true conforme a fixture abaixo.
`node --test tests/ui/race.test.mjs` usa a mesma preparação. Não defina filtros de
caso ou modo de reprodução antiga para uma avaliação completa normal.

O provider é adaptado somente na cópia temporária Next, sem .env.local; captura
somente dados sintéticos. Next, Chromium, banco/papéis e diretórios próprios são
limpos em finally e conferidos por catálogo. O runner de corridas declara respostas
retidas, transporte que ignora abort e harness React só temporário. Os testes de
browser não são comprovados pelo adaptador Node do Harness. Nomes finais e
estados de captura estão no índice da galeria; resultados por rodada na entrega.

O teste PostgreSQL real está preparado em
`tests/database/integration.test.mjs`, separado do comando offline:

```powershell
npm run test:db:integration
```

**Execute somente com autorização explícita para o destino descartável.** Ele
cria um banco descartável `imobilead_test_<sufixo>` no mesmo servidor local e papéis
exclusivos por execução. É necessário autorizar explicitamente esse destino de
teste, fornecer `TEST_ADMIN_DATABASE_URL` local apontando inicialmente a `imobilead`
e definir `DB_DISPOSABLE_TEST_AUTHORIZED=true`, além de confirmar a remoção de
`trust`. Não use a credencial da extensão; não preencha esses valores em comandos
registrados. O runner não usa mocks nem cai no banco existente como fallback.

Quando autorizado, o runner verifica instalação do zero, segunda migration sem
pendências, e-mail canônico/único concorrente, nome/papel, sessões/FK/expiração/
revogação, DML necessário e negação de DDL permanente/escalada/acesso ao histórico.
REG-001 também inicia Next por HTTP local em cópia temporária, com a rota e
módulos de cadastro inalterados e provider de banco exclusivo da fixture.
Este provider aceita somente o banco/papel descartáveis da execução, com os
mesmos grants e checker de privilégios; o runtime principal não é flexibilizado.
Testa criação, campos, hash, papel, ausência de sessão, duplicidade concorrente,
falha de banco sanitizada, origem, corpo e abuso. Saída do Next é consumida e
limitada, sem publicar logs brutos. Banco/papéis e diretório/processo são limpos;
o catálogo confirma ausência dos recursos próprios e metadados protegidos intactos.
A limpeza automática se limita ao banco e papéis criados e identificados pela
própria execução. O banco `imobilead` não é apagado, truncado ou recriado.
Se o teste falhar antes da limpeza, confirme os recursos identificados pela
execução e encerre conexões antes de removê-los; não faça limpeza por prefixo amplo.

DB-001-I1 e DB-001-P1 receberam autorização local explícita e execução real
registrada na evidência. P1 acrescenta divergências por tabela, coluna e PUBLIC,
remoção de acessos necessários e bloqueio do histórico, restaurando direitos
entre os cenários somente no banco descartável. Limpeza confirmada por catálogo.
Isso cobre os casos do runner, sem aprovação exaustiva de permissões ou segurança.
Não marque migrations ou permissões aprovadas com base somente em testes offline.

## CI e próxima etapa

Estado vigente CI-001, 30/10/2026: [workflow](.github/workflows/ci.yml) com
Node **22.13.1**, cache npm oficial e `npm ci` em três jobs independentes no
Ubuntu24.04. Actions oficiais fixadas por SHA (checkout5.1.0/setup-node5.0.0),
credencial Git não persistida, `contents: read`, concorrência por workflow/ref
com cancelamento da execução antiga, eventos push/pull_request/workflow_dispatch.

| Job (timeout) | Passos, em ordem |
| --- | --- |
| quality (15min) | Checkout; Setup Node; Install (`npm ci`); Lint (`npm run lint`); Typecheck (`npm run typecheck`); Test (`npm test`); Build (`npm run build`) |
| postgres-integration (20min) | Serviço saudável; Checkout; Setup Node; Install; Test PostgreSQL and HTTP (`npm run test:db:integration`) |
| security (10min) | Checkout; Setup Node; Install; Dependency audit (`npm audit --audit-level=high`) |

O serviço `postgres:18` acompanha a versão major documentada do projeto, sem
volume persistente. O tag major recebe atualizações menores; não é um digest
imutável. Porta5432 do runner →5432 do serviço; health check `pg_isready`,
intervalo10s, timeout5s, início10s e10 tentativas. O banco-base vazio se chama
`imobilead` porque a guarda existente exige esse nome; ele existe exclusivamente
no serviço deste job, sem relação com o banco persistente da máquina local.
Administrador `ci_fixture_admin`/senha `ci_only_disposable_2026` são sintéticos,
exclusivos desta fixture. Host auth usa scram-sha-256, sem trust de rede.

Somente no passo de integração: `TEST_ADMIN_DATABASE_URL` aponta esse usuário
para `127.0.0.1:5432/imobilead`, `DB_TRUST_REMOVED=true` e
`DB_DISPOSABLE_TEST_AUTHORIZED=true`. Não há secrets do repositório nem
DATABASE_URL/MIGRATION_DATABASE_URL/ADMIN_DATABASE_URL no workflow. Cada runner
cria `imobilead_test_<hex12>` e dois papéis temporários com senha aleatória;
migrations, grants, HTTP e mutações de teste usam somente esses recursos.
O banco-base recebe apenas consultas de metadados; criação/remoção dos recursos
próprios ocorre pela conexão administrativa. Cleanup em `finally`, conferência
de catálogo/metadados e falhas de limpeza bloqueantes. Cancelamento forçado pode
interromper `finally`; o serviço inteiro é descartado ao encerrar o job.

`npm test` cobre configuração/guardas, validação, clima e launchers de servidor
cadastro8/auth11/autorização6. Integração cobre migrations1/0, privilégios,
constraints/sessões, cadastro/login/logout/sessão e consulta própria/admin via
Next HTTP real, incluindo401/403. Não há skips configurados nessas suítes.
Os launchers verificam quantidade, código e ausência de skips dos filhos.

UI completa (`npm run test:ui`), concorrência (`node --test tests/ui/race.test.mjs`)
e recorte clima (`npm run test:weather:ui`) permanecem locais: Chromium não é
provisionado pelo CI existente, há autofill via CDP e escrita de capturas
versionadas, e a portabilidade Ubuntu ainda não foi demonstrada. Os testes
HTTP/PG não lançam browser.


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

SCA bloqueia high/critical, inclusive dependências de desenvolvimento; o limite
`high` permite que low/moderate não bloqueiem, mas continuem visíveis no relatório.
Não há supressão de erro, correção automática nem `--force`. Em falha, examine
job/passo: instalação/lock, lint/tipos/testes/build, saúde/fixture/cleanup do PG ou
advisories no SCA; corrija a causa e repita. Não reduza o gate para obter verde.
CodeQL foi avaliado e não adicionado nesta entrega SCA; decisão na arquitetura.

Para reproduzir os grupos locais com Node22.13.1/npm10.9.2:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
# Configure TEST_ADMIN_DATABASE_URL localmente sem exibir a URL;
# confirme DB_TRUST_REMOVED=true e DB_DISPOSABLE_TEST_AUTHORIZED=true.
npm run test:db:integration
node scripts/harness/harness.mjs doctor
node scripts/harness/harness.mjs validate
node scripts/harness/harness.mjs verify --product
git diff --check
```

Não execute provision/migrate/grant no banco principal para reproduzir o CI.
O runner carrega `.env.local` localmente; CI não cria esse arquivo. Nunca copie
credenciais locais para o workflow. A execução local Windows não prova o serviço
Linux do GitHub Actions. [Evidência CI-001](docs/harness/evidence/ci.md) distingue
CI remoto verde da base e CI remoto do novo diff, pendente da fase2. Nenhum
commit/push nesta fase; usuário revisará e fará ambos após aprovação humana.

O frontend integra cadastro/login/consulta/logout e previsão de amanhã no sucesso.
Execute `npm run test:weather` para 14 unitários offline (também no npm test) e
`npm run test:ui` para UI completa com clima interceptado deterministicamente,
incluindo privacidade, falhas, retry e cancelamento. Use somente a fixture local
descartável autorizada, com TEST_ADMIN_DATABASE_URL; nunca dados reais.
[Resultados atuais](docs/harness/evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).
CI remoto do diff, HTTPS e revisão humana não foram aprovados. Integração e
navegador permanecem separados do adaptador parcial do Harness.

## Contrato de cadastro REG-001

Defina `APP_ORIGIN` em `.env.local` como origem pública exata (sem caminho/barra
final), por exemplo `http://localhost:3000`. É obrigatória em produção; em `next dev`
o padrão é esse localhost. Configuração ausente/inválida retorna 503.

Envie JSON para `POST /api/users` com `name`, `email`, `password`,
`passwordConfirmation`; opcionais string ou null: `address`, `city`, `state`,
`country`, `postalCode`, `message`. Nome string até 150 pontos de código, inclusive
vazio conforme DB-001. Senha ASCII alfanumérica 8–35, sem exigir mistura de classes;
confirmação idêntica. E-mail ASCII, formato com domínio pontuado, remoção
de espaços ASCII nas pontas e lowercase conforme banco. Internacionalização e
prova de posse não implementadas. REG-001-E1 exige parte local de até 64 bytes,
cada segmento do domínio de até 63 bytes e endereço normalizado de até 254 bytes;
após a checagem ASCII, caracteres e bytes coincidem. Os limites seguem
[RFC 5321 §4.5.3.1](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1) e
[RFC 1035 §2.3.4](https://www.rfc-editor.org/rfc/rfc1035#section-2.3.4).
A versão inicial REG-001 omitia esses limites; reprodução e correção estão na
[evidência E1](docs/harness/evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026).
Textos com NUL são recusados por incompatibilidade
com PostgreSQL. Não há formato brasileiro ou limite individual adicional.

Retorna `201 {"user":{"id":"UUID"}}`, sem sessão, cookie ou dados pessoais.
Erros: 400 entrada/JSON inválido, 403 origem recusada, 408 prazo do corpo,
409 conflito, 413 corpo maior que 16 KiB, 415 mídia/codificação não suportada,
429 abuso/concorrência, 500 falha interna sanitizada, 503 configuração de origem.
Métodos não implementados seguem 405 do Next. Erros de campo contêm apenas códigos.
Nunca reenvie o corpo em logs. Ver decisões e limitações de abuso/CORS/CSRF em
[arquitetura REG-001](docs/ARCHITECTURE.md#reg-001--cadastro-pela-api-29102026).

Para retomada, leia [handoff](docs/harness/memory/handoff.md), confira Git e use os
[comandos do harness](docs/harness/commands.md). Decisões e critérios estão em
[arquitetura](docs/ARCHITECTURE.md), [requisitos](docs/REQUIREMENTS.md) e
[evidências DB-001](docs/harness/evidence/database.md).

## Consulta e autorização AUTHZ-001

Estado vigente sobre sugestões históricas de próximas etapas acima.

- GET /api/users: somente admin. Retorna { users: [...], nextCursor: UUID|null }.
  Páginas de até 100, ordenadas por UUID ascendente; envie ?after=UUID com
  nextCursor até receber null. Cursor inválido/duplicado ou chave extra:400.
  Registros criados/removidos entre páginas não têm garantia de snapshot.
- GET /api/users/[id]: user acessa apenas seu próprio UUID; admin acessa qualquer
  UUID. Retorna { user: {...} }. Query extra:400 após autorização.
- Ambos retornam somente id,name,email,address,city,state,country,postalCode,message,
  com campos opcionais null conforme banco. Sem senha/hash, papel ou material de sessão.
  Respostas usam Cache-Control:no-store e não habilitam CORS entre origens.
- Sem sessão válida:401. Papel desconhecido/incompleto ou permissão ausente:403.
  User recebe403 para outro UUID, inexistente ou malformado, antes de consultar alvo.
  Admin recebe400 para UUID inválido e404 para inexistente. Falha de banco/config:503
  com USERS_FAILED sanitizado. POST /api/users continua público para cadastro.

O papel vem de leitura nova do banco em cada requisição; não é armazenado na
sessão nem aceito de query/body/cabeçalhos/cookies adicionais. Rebaixamento vale
na próxima requisição com a mesma sessão. A consulta mínima de sessão não muda.

### Promover explicitamente usuário existente

Operação administrativa local separada da aplicação, sem conta/senha padrão ou
endpoint. Configure ADMIN_DATABASE_URL em .env.local com credencial administrativa
superuser separada de DATABASE_URL; preserve DB_TRUST_REMOVED=true. O comando
valida 127.0.0.1:5432/imobilead, identidade e superuser, exige exatamente um UUID,
bloqueia a linha em transação e confirma exatamente um registro encontrado/alterado.
Runtime continua sem UPDATE(role). UUID já admin é aceito idempotentemente.

Execute somente quando houver autorização explícita para a conta/destino desejados:

```powershell
npm run db:promote-admin -- UUID_DO_USUARIO_EXISTENTE
```

Substitua o marcador pelo UUID obtido legitimamente; não há listagem de contas
no procedimento. Sucesso: ADMIN_USER_UPDATED: 1; falha: ADMIN_USER_OPERATION_FAILED
e saída1, sem valores/SQL/detalhes privados. Não passe credenciais na linha de comando.
Nesta rodada a CLI não foi executada contra imobilead: somente o mecanismo
compartilhado foi exercitado com fixtures no banco descartável autorizado.

Testes: npm run test:authorization:server (seis casos controlados, sem banco);
npm test inclui esse launcher no CI existente. npm run test:db:integration
inclui sete cenários AUTHZ reais, além das regressões anteriores, com as mesmas
guardas descartáveis acima. Ver [evidência](docs/harness/evidence/authorization.md).
Cadastro/login/página protegida estão integrados conforme o roteiro frontend.
Clima permanece pendente; a evidência atual distingue SSR protegido de API protegida.

## Compose local de produção — CONTAINER-001

Requer Docker Engine Linux e Compose v2.20+ (Docker Desktop Linux no Windows).
A configuração usa somente credenciais sintéticas e um volume próprio, sem .env
adicional ou acesso ao PostgreSQL instalado na máquina. Sem conta admin padrão.

```powershell
docker compose up --build
# Abrir https://localhost:3000 (HTTPS obrigatório para sessão de produção)
docker compose logs --tail 50 app db-init db gateway
docker compose ps -a
docker compose stop
# Recriar serviços preservando os dados:
docker compose down
docker compose up -d --wait --wait-timeout 120
```

Para outra porta, defina COMPOSE_HTTP_PORT antes de executar Compose (PowerShell:
$env:COMPOSE_HTTP_PORT='3300'; Bash: export COMPOSE_HTTP_PORT=3300). A origem passa
a https://localhost:3300. O acesso deve usar localhost, não IP/outro hostname.
Use sempre o mesmo nome de projeto (-p ou COMPOSE_PROJECT_NAME) para o mesmo volume.

O gateway gera um certificado local, sem alterar o trust store do computador.
No navegador, aceite explicitamente a exceção para localhost ou exporte a CA
local e instale-a manualmente se desejado; não há instalação automática:

```powershell
docker compose cp gateway:/data/caddy/pki/authorities/local/root.crt compose-local-ca.crt
```

A CA é temporária e muda após restart/recriação do gateway. Exclua o certificado
exportado quando terminar; não o versione. Não use esse ambiente/credenciais/CA
como implantação pública. Para produção pública são necessários domínio, TLS e
gestão de segredos próprios, fora deste pedido.

Reset é DESTRUTIVO: perde todos os dados exclusivamente do projeto selecionado.
Antes confirme nomes e labels com docker compose ps -a e docker volume inspect
NOME_EXATO_DO_VOLUME. Nunca aplique ao PostgreSQL persistente ou a outro projeto:

```powershell
# Somente após conferir o projeto e aceitar perder os dados desse Compose:
docker compose down -v
```

PostgreSQL → db-init → app → gateway. db-init cria papéis/schemas apenas quando
os quatro estão ausentes; estado parcial é recusado. Depois executa db:migrate,
db:grant e db:check; reaplicação não reinicia dados. O volume persiste em down
sem -v. As guardas127.0.0.1 e identidade SQL não mudaram: serviços compartilham a
rede de db. Publicação HTTPS está em db por ele possuir esse namespace; não há
publicação5432. App recebe só runtime, init recebe admin/migration/runtime e
PostgreSQL recebe somente sua credencial de bootstrap.

Teste equivalente ao job, com projeto novo e descartável:

```powershell
$env:COMPOSE_PROJECT_NAME='ic-smoke-meu-teste-unico'
$env:COMPOSE_HTTP_PORT='3300'
docker compose config --quiet
docker compose build --no-cache
docker compose up -d --wait --wait-timeout 120
node scripts/container/smoke.mjs
# Opcional local, requer npm ci e Chromium instalado pelo Playwright:
node --test tests/container/browser.test.mjs
# DESTRUTIVO, restrito a ic-smoke-*; verifica ownership antes e ausência depois:
node scripts/container/cleanup.mjs
```

CI container-smoke é independente/bloqueante, timeout20min, credenciais sintéticas,
sem publicação de imagens; cleanup if:always. Teste browser é local separado.
[Arquitetura](docs/ARCHITECTURE.md) e [evidência/limites](docs/harness/evidence/containerization.md).
## REG-ESSENTIAL-001 — validação e integridade, 30/10/2026

Cadastro e edição usam shared/schemas.mjs (Zod4.6.7 direto) através dos wrappers
registration/profile, no navegador e na API. Nome/cidade/estado/país têm trim e
não podem ser vazios; e-mail/senhas mantêm regras anteriores. Endereço/CEP/mensagem
continuam opcionais; PATCH não escreve campos omitidos. Erros seguem contrato
público controlado e foco no primeiro campo, sem detalhes internos do Zod.

Migration3 preparada com guarda contra legados incompatíveis e aplicada uma vez
ao local127.0.0.1:5432/imobilead após autorização, fresh preflight0 e pós-check.
Não repetir a aplicação por este registro. Para outro checkout/banco local
autorizado, o diagnóstico somente leitura é:

```powershell
node scripts/database/essential-fields-preflight.mjs
```

Se houver incompatíveis, não inventar valores nem forçar a restrição. O script
mostra apenas contagens/schema e a migration também recusa o caso atomicamente.
Testes: npm test; npm run test:db:integration; npm run test:ui;
npm run test:profile:ui; npm run test:admin-delete:ui. Use fixtures descartáveis,
nunca contas persistentes. [Resultados e limites](docs/harness/evidence/required-profile-fields.md).
README/CI ficam para outra rodada; smoke Compose tem fixture essencial/contagem3
ajustados, mas containers não foram executados novamente nesta etapa.
