# Executar a solução local

29/10/2026 · DB-001. O esqueleto Next.js e o harness estão disponíveis. Schema,
migrations, papéis e conexão de servidor foram preparados; cadastro, login,
cookies, autorização, logout e clima ainda não foram implementados. Confira a
[evidência atual](docs/harness/evidence/database.md) para distinguir execução real,
testes offline e pendências. Revisão humana permanece pendente.

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
| SESSION_TTL_SECONDS | contrato futuro de sessão: 3600; emissão/cookie ainda pendentes |

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
necessário ao contrato futuro de criação/revogação. Histórico e CREATE de objetos
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
necessário. Não crie conta admin padrão: a próxima etapa preparará promoção local
explícita de usuário existente por UUID, sem expor esse poder no cadastro público.

## Aplicação

```powershell
npm run dev
```

Abra http://localhost:3000. A tela ainda mostra a mensagem de `/api/v1` e não usa
cadastro ou login. `server/db/index.ts` é entrada somente de servidor, inicializada
sob demanda; build e tela pública não provam conexão PostgreSQL. Consultas futuras
devem ser parametrizadas e retornar somente a projeção permitida, com autorização
no servidor; hash de senha e material de sessão nunca integram respostas.

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

`npm test` usa o runner nativo de Node, com arquivo explícito de testes offline de
configuração de destino/papel, identificadores e diagnóstico sanitizado. Não é
placeholder e não testa migrations, constraints ou permissões reais. O adaptador
existente do harness reconhece os eventos estruturados desses casos; seu relatório
continua parcial, sem declarar prontidão do produto. Não foi afrouxado para o runner.

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

O workflow existente não foi modificado nesta rodada. Seu passo `npm test` passa
a chamar os testes offline pelo script atualizado; integração PostgreSQL isolada
no CI fica pendente. A aprovação anterior de CI/build foi informada pelo usuário
para o checkpoint do Harness V1; esta etapa não dispara nem comprova CI remoto.

Conclua as verificações reais de conexão, inventário, migrations e permissões
respeitando o destino autorizado. Depois, mediante próxima etapa, implemente
cadastro e autenticação usando o contrato de sessão já acordado. Não foram
iniciados nesta rodada endpoints, telas, cookies, login/logout ou clima.

Para retomada, leia [handoff](docs/harness/memory/handoff.md), confira Git e use os
[comandos do harness](docs/harness/commands.md). Decisões e critérios estão em
[arquitetura](docs/ARCHITECTURE.md), [requisitos](docs/REQUIREMENTS.md) e
[evidências DB-001](docs/harness/evidence/database.md).
