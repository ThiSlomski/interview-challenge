# DB-001 — evidências da etapa de banco

29/10/2026 · origem: [pedido integral](../../prompts/2026-10-29-database.md) e
[contrato prévio](database-plan.md). Consolidação de Documentação por retornos
sanitizados; revisão humana pendente.

## Base e limites

- Git inicial: `main`, HEAD `2ee16c787dd77b23da02353d1667ab7568258941`, árvore
  limpa. Harness V1 commitado; os checkpoints anteriores que diziam “sem commit”
  são históricos. CI/build aprovados nesse checkpoint são informação do usuário,
  sem nova execução remota nesta etapa.
- O usuário criou `imobilead` no DBeaver e informou conexão disponível também na
  extensão de banco do VS Code. Nenhuma credencial da extensão foi extraída.
- Destino exclusivo após atualização: `127.0.0.1:5432/imobilead`. A conexão da
  extensão não comprova conexão do código da aplicação.
- Não houve acesso a Sillage, alteração da autenticação PostgreSQL, CI, commits,
  push, publicação, endpoints, telas ou fluxo de autenticação nesta etapa.

## Diagnóstico executado pelo orquestrador

| Verificação | Resultado observado |
| --- | --- |
| `node scripts/harness/harness.mjs doctor` inicial | Código 0; Node 22.13.1, npm 10.9.2; artefatos obrigatórios presentes |
| `node scripts/harness/harness.mjs validate` inicial | Código 0, sem erros |
| Arquivos de ambiente | Apenas `.env.example` presente; `.env.local` confirmado ignorado pelo Git |
| Presença de variáveis esperadas | `DATABASE_URL`, `MIGRATION_DATABASE_URL` e `PGPASSWORD` ausentes; valores não lidos/expostos |
| Serviço PostgreSQL 18 | Em execução; ferramentas locais `psql`, `initdb` e `pg_ctl` presentes |
| Inspeção delimitada do `pg_hba.conf` ligado ao diretório do serviço | Seis regras ativas; zero regras `trust`; zero inclusões; autenticação não alterada. A leitura do arquivo não comprova qual configuração está carregada no processo |
| Tentativa `psql -X -w` antes da atualização de destino | Código 1, `fe_sendauth: no password supplied`; destino solicitado então `localhost:5432/imobilead`, usuário administrativo. Nenhum inventário nem mutação ocorreu |

A tentativa acima antecedeu a instrução posterior de usar exclusivamente
`127.0.0.1`. Não comprova conexão da aplicação nem verificação do banco existente.
Credenciais devem ser preenchidas localmente pelo usuário em variável/arquivo
ignorado, sem envio no chat. O plano de cluster efêmero foi cancelado antes de
implementação ou execução após a atualização de destino; testes em banco separado
dependem de compatibilizar essa restrição e obter credenciais locais.

## Contrato Backend/Banco

Backend fez revisão inicial sem escrita com a skill `review-security`. Acordou
e-mail canônico único; hash separado; papel padrão `user`; privilégios por coluna
que impeçam promoção pelo runtime; campos de endereço e mensagem opcionais por
ausência de obrigatoriedade no README. Para sessões, digest SHA-256 de token
aleatório de 32 bytes, integridade referencial, expiração absoluta de uma hora e
revogação. Cookies/login/logout e parâmetros de Argon2id ficam para a etapa auth.
Admin futuro será promoção administrativa explícita de usuário existente por ID,
sem seed, conta ou senha padrão.

## Implementação e verificação

Banco implementou `database/migrations/1793232000000-users-sessions.cjs`,
`scripts/database/{config,migrate,provision,cli}.mjs`, `server/db/{config.mjs,index.ts}`,
`tests/database/{config,integration}.test.mjs`, `.env.example`, package e lockfile.
Decisões em [arquitetura](../../ARCHITECTURE.md), reprodução em
[SOLUTION](../../../SOLUTION.md). Dependências novas exatas: pg8.23.1,
server-only0.0.1, node-pg-migrate9.0.0 e @types/pg8.23.1; demais versões preservadas.

| Verificação executada | Resultado real e limite |
| --- | --- |
| `npm test` | 4/4 casos offline aprovados, sem falhas; configuração/destinos/papel, identificadores e diagnóstico sanitizado. Não exercita PostgreSQL |
| `npm run lint` / ESLint direcionado após ajustes | Código 0; sem afrouxar regras |
| `npm run typecheck` | Código 0 |
| `npm run build` | Código 0, compilação/TypeScript/geração estática concluídos; aviso de depreciação React 18 permanece; `tsconfig.json` sem diff novo |
| `npm audit --json` após adições | Código 0; zero vulnerabilidades reportadas |
| `node scripts/harness/harness.mjs verify --product` | Código 0, ok:true; validate, suíte Harness, native-probe, lint/typecheck e 4 testes offline comprovados por eventos estruturados. Escopo parcial, readiness not-assessed; não testa PostgreSQL nem produto completo |
| `node scripts/harness/harness.mjs validate` após documentação | Código 0, sem erros |
| `git diff --check` | Código 0 nas verificações delimitadas de código/docs; avisos de conversão LF/CRLF não são erros |
| `npm run db:check` sem arquivo/credenciais locais | Código 1, `DATABASE_CREDENTIALS_MISSING (WITHHELD)`, sem conexão; diagnóstico genérico da tentativa anterior foi corrigido |
| Preflight `npm run test:db:integration` com autorização descartável false | Código 1 esperado, `DATABASE_DISPOSABLE_AUTHORIZATION_REQUIRED (WITHHELD)`, 1 caso/0 aprovados/1 falha antes de criar cliente/conexão. É verificação do bloqueio; nenhum SQL de integração foi executado |
| Instalação do zero / segunda migration / constraints / permissões reais | Preparadas em teste separado, não executadas em PostgreSQL real |

O teste de integração foi preparado com casos de e-mail não canônico/inválido e
unicidade concorrente, nome longo, papel inválido e tentativa de INSERT role,
tamanho/duplicidade/expiração/revogação/FK de sessão, DELETE users negado ao runtime,
DML de sessão, DDL permanente e histórico negados, cascata administrativa.
Não são mocks, mas a presença dos casos não comprova seu comportamento real.

SQL preparado prevê: runtime users SELECT/INSERT por colunas sem `role`, sem
UPDATE/DELETE; sessions DML; migrations detém schemas/histórico; novos objetos
exigem grants mínimos explícitos. Aplicação recusa privilégios elevados,
memberships e CREATE em schemas público/aplicação. Não houve provisionamento nem
grants efetivamente aplicados ao banco local. PUBLIC CONNECT/TEMP padrões não
foram alterados, sem alegar isolamento absoluto do papel entre bancos.

## Revisão independente e correções

Backend fez revisão inicial do contrato e revisão final delimitada, ambas sem
escrita e usando `review-security`. Revisão de leitura é uma instrução, sem sandbox
separado garantido. Achado médio: integração não carregava `.env.local`; Banco
corrigiu. Ajustes adicionais: remover SELECT padrão amplo para futuras tabelas,
reduzir users a SELECT/INSERT por requisito, tornar ausência de credenciais clara,
ampliar casos negativos. Seguimento Backend confirmou correções, sem novo defeito
material nos pontos revisados. Nenhum teste real de migration foi executado pelo
revisor; revisão humana permanece pendente.

O seguimento observou risco de falha de limpeza mascarar o erro primário e não
fechar administração no runner descartável. O orquestrador assumiu o arquivo de
teste após retorno do Banco e corrigiu: cada limpeza/fechamento é tentado de forma
independente, erro primário é preservado e falhas de cleanup emitem somente nomes
aleatórios criados pela própria execução e códigos sanitizados para recuperação.
Autorrevisão delimitada com `node --check`, ESLint do arquivo e diff-check aprovados;
o caminho real de cleanup continua sem execução por falta da integração real.

## Pendências e próximo passo

Usuário informou que preencheria as credenciais localmente nesta etapa; essa
resposta não comprova variável configurada. Na última verificação relatada,
`.env.local` ainda estava ausente. Não foram lidos valores de segredos nem
sobrescritas configurações. Conexão da aplicação, identidade efetiva e inventário
de `imobilead` ainda não estão comprovados; não se assume banco vazio.

Após preenchimento local, execute o procedimento de SOLUTION para conferir destino
e inventário antes de modificar objetos, sem reset/drop/truncate. Integração do
zero exige autorização compatível para banco separado e credenciais; sob destino
exclusivo atual ela não deve ser executada. Não marque cadastro/autenticação/
autorização/logout completos pela estrutura preparada. Próxima etapa funcional
recomendada, após fechar verificação real: cadastro/auth com validação, hash e
controle de acesso no servidor, sem iniciá-la nesta rodada.

## Inventário final da consolidação

Snapshot de Git após escrita dos documentos; sem commit/push. O resumo de diff
tradicional cobre somente versionados, por isso os novos arquivos estão listados
separadamente. Todos pertencem ao contrato DB-001.

```text
 M .env.example
 M SOLUTION.md
 M docs/AI_PROMPTS.md
 M docs/ARCHITECTURE.md
 M docs/REQUIREMENTS.md
 M docs/harness/memory/decisions.md
 M docs/harness/memory/handoff.md
 M docs/harness/memory/index.md
 M docs/harness/memory/lessons.md
 M docs/harness/memory/project-state.md
 M package-lock.json
 M package.json
?? database/migrations/1793232000000-users-sessions.cjs
?? docs/harness/evidence/database-plan.md
?? docs/harness/evidence/database.md
?? docs/prompts/2026-10-29-database.md
?? scripts/database/cli.mjs
?? scripts/database/config.mjs
?? scripts/database/migrate.mjs
?? scripts/database/provision.mjs
?? server/db/config.mjs
?? server/db/index.ts
?? tests/database/config.test.mjs
?? tests/database/integration.test.mjs
```

São 12 arquivos versionados alterados e 12 arquivos novos: modelo/migration (1),
CLI/configuração/provisionamento (4), conexão servidor (2), testes (2), contrato/
evidência/prompt (3). O diff versionado acrescenta as dependências e scripts,
exemplo de ambiente, instruções de reprodução, ADRs, matriz, log e memória.
Nenhum arquivo de CI, tela ou endpoint foi alterado. Arquivos locais de segredos
não foram criados pela automação nem incluídos no Git.

## DB-001-D1 — diagnóstico de identidade, 29/10/2026

Pedido posterior: o usuário executou `npm run db:provision` e informou
`UNEXPECTED_DATABASE_IDENTITY (WITHHELD)`. Diagnóstico autorizado somente de
leitura, sem repetir provisionamento, alterar objetos/permissões ou expor
credenciais. Escopo documental desta rodada: esta evidência; código funcional
preservado. Autorrevisão delimitada na sessão principal, skill review-security.
As alterações anteriores de DB-001 foram preservadas.

### Causa confirmada

O único campo divergente é `address`. Em `scripts/database/migrate.mjs`,
`inet_server_addr()::text` retorna o endereço com a máscara `/32`. A condição
compara essa representação com IPs sem máscara e lança o erro mesmo no destino
correto. Não é necessário mudar a conexão local para corrigir essa representação.
A [documentação oficial PostgreSQL 18](https://www.postgresql.org/docs/18/functions-net.html)
confirma que o cast explícito de inet para text inclui máscara e que `host(inet)`
retorna somente o endereço.

Consultas com a credencial administrativa local, dentro de transações `READ ONLY`,
confirmaram, emitindo somente nomes de campos e resultados booleanos sanitizados:

- Campo divergente na condição atual: somente `address`.
- A diferença corresponde exatamente à máscara; o endereço sem máscara coincide
  com o host esperado. Banco, porta e usuário coincidem com
  `127.0.0.1:5432/imobilead`, usuário administrativo `postgres`.
- Uma segunda consulta usando `host(inet_server_addr())` satisfez todos os campos
  esperados, inclusive igualdade exata com o host configurado.

### Arquivo local e precedência

`.env.local` agora existe. Na sessão usada para este diagnóstico,
`ADMIN_DATABASE_URL` não estava definida antes do carregamento; a configuração
efetiva veio do arquivo local e correspondeu ao destino/usuário exigidos.
Nenhuma senha, URL completa ou conteúdo do arquivo foi exposto ou persistido.

`loadLocalEnvironment()` chama `process.loadEnvFile('.env.local')`. Uma variável
já existente no processo prevalece sobre o arquivo: ensaio separado com um valor
sintético confirmou essa precedência sem conexão ao banco. Não foi observada tal
sobreposição nesta sessão. O ambiente histórico do terminal em que o usuário
executou o comando não foi capturado; não se afirma inspeção desse outro processo.
A causa de representação do endereço foi reproduzida na conexão atual correta.

### Efeitos anteriores à falha

No código inspecionado, a sequência é conexão, SELECT da identidade e validação.
O erro ocorre antes do inventário, `BEGIN` e `provisionSql()`. Portanto essa falha
não chega ao SQL de criação de papéis/schemas; não depende de supor um rollback.

A consulta de catálogo atual não encontrou os papéis `imobilead_migrate` e
`imobilead_app`, os schemas `imobilead` e `imobilead_meta`, nem relações nesses
schemas. Isso confirma a ausência atual dos artefatos previstos pelo
provisionamento; não constitui auditoria histórica de todo o banco ou de ações
de outros processos. Nenhum objeto ou permissão foi modificado pelo diagnóstico.
As transações de leitura foram encerradas e as conexões fechadas.

### Correção proposta — não aplicada

Em `scripts/database/migrate.mjs`, usar
`host(inet_server_addr()) AS address` na consulta. Preservar as verificações de
banco, usuário e porta; comparar também `identity.address !== expected.host`
para manter o destino exato, em vez de ampliar a lista de endereços aceitos.
Não remover a validação nem aceitar correspondência por prefixo.

Antes de aplicar, acrescentar regressão da representação de rede e casos de
identidade divergente. A expressão proposta já foi conferida por SELECT real
somente de leitura, sem chamar `migrate`, `provisionSql` ou o comando de
provisionamento. Migrations, papéis e privilégios reais continuam pendentes.

Verificação documental desta rodada: doctor, validate e verify --product
retornaram código 0; harness/probe/lint/typecheck e quatro testes offline passaram.
O relatório permanece parcial, sem build ou aprovação de SQL/provisionamento.
`git diff --check` passou. Nenhuma correção funcional foi aplicada nesta rodada.

## DB-001-D2 — contrato da correção autorizada, 29/10/2026

Pedido posterior autoriza corrigir `address`, acrescentar regressões e conferir
identidade por leitura; somente se integralmente correta, executar
`npm run db:provision` uma vez. Preservar histórico, alterações anteriores,
credenciais e `.env.local`; sem migrations, banco descartável, senhas ou Git mutável.

Sessão principal responsável por `scripts/database/migrate.mjs`,
`tests/database/config.test.mjs`, log em `docs/AI_PROMPTS.md`, esta evidência e
atualizações mínimas de handoff/estado. Tarefa pequena, sem delegação; autorrevisão.
Requisitos: identidade estrita e provisionamento limitado, relacionados a 4/16–18.
Aceite: normalizar via `host(inet_server_addr()) AS address`, exigir igualdade
com `expected.host` e preservar banco/porta/usuário; regressões controladas
positiva/negativas separadas da confirmação PostgreSQL real. Executar testes,
lint/typecheck/harness/diff; preflight real de leitura e uma execução de
provisionamento quando elegível; confirmar artefatos reais por catálogo.
Uma execução e até duas correções por hipótese; parar sem repetir provisionamento
se houver falha/conflito. Resultados serão acrescentados abaixo após execução.

### Correção e regressões controladas

A falha original e sua causa estão preservadas em DB-001-D1 acima: somente
`address` divergia porque o cast inet para text retém a máscara. Busca nos arquivos
de código encontrou uma única consulta equivalente, em
`scripts/database/migrate.mjs`, compartilhada por CLI e migrations.
Foi substituída por `host(inet_server_addr()) AS address`; a condição agora exige
`identity.address === expected.host`. Banco, usuário e porta seguem verificados.
Nenhuma lista permissiva, comparação por prefixo ou retirada de controle.

`tests/database/config.test.mjs` recebeu cliente SQL simulado, explicitamente
identificado como teste controlado. O cenário positivo simula a diferença entre
cast com máscara e host sem máscara; os negativos rejeitam banco, usuário, porta,
host, outro loopback, endereço com máscara e endereço nulo, antes do inventário.
Antes da correção: 12 casos, 10 passaram e dois falharam, reproduzindo o defeito
e a aceitação indevida de outro loopback. Depois: 12 passaram, zero falhas/skips.
`npm run lint`, `npm run typecheck` e `git diff --check` passaram.
Esses testes controlados não comprovam comportamento de um servidor PostgreSQL.

### PostgreSQL real: preflight e execução única

Inspeção delimitada atual do HBA associado ao serviço: zero trust e zero includes,
sem alteração de autenticação. A credencial administrativa local foi consumida
pelo carregador existente, sem exibir valores ou modificar `.env.local`.
Preflight real em transação READ ONLY usou a função corrigida e confirmou todos
os campos: host 127.0.0.1, porta 5432, banco imobilead, usuário postgres.
Catálogo antes da mutação: zero papéis, schemas e relações previstos pelo projeto.

Após o preflight, `npm run db:provision` foi executado exatamente uma vez nesta
rodada; código 0. O CLI conferiu novamente identidade/inventário e concluiu a
transação de provisionamento. Não houve repetição nem tentativa de migration.

Consulta posterior, também READ ONLY, confirmou:

- Papéis `imobilead_migrate` e `imobilead_app` presentes, com LOGIN/NOINHERIT e
  sem superuser/createdb/createrole/replication/bypassrls.
- Schemas `imobilead` e `imobilead_meta` presentes, ambos de propriedade de
  `imobilead_migrate`.
- `imobilead_app`: USAGE em imobilead, sem CREATE nesse schema e sem USAGE em
  imobilead_meta.
- Zero relações nos schemas do projeto: tabelas e histórico de migrations ainda
  não foram criados. Nenhum grant de tabelas foi executado nesta rodada.

Não foram definidas/redefinidas senhas, alterado `.env.local`, acessadas conexões
remotas, executados testes descartáveis, migrations, commit ou push. A conexão
administrativa está comprovada; conexão autenticada da aplicação, migrations e
restrições/privilégios reais das tabelas continuam pendentes. Não repetir
provisionamento: os papéis/schemas agora existem.

QA final da correção: doctor e validate passaram; verify --product retornou
código 0, com harness/probe/lint/typecheck aprovados e 12 testes controlados
comprovados por eventos estruturados (zero falhas/skips). Continua relatório
parcial, sem build ou teste SQL de tabelas. `git diff --check` passou.
Histórico e alterações anteriores preservados; somente os seis arquivos previstos
nesta correção foram editados: consulta, testes, log, evidência, handoff e estado.

## DB-001-M1 — execução manual informada pelo usuário, 29/10/2026

Origem: relato explícito do usuário nesta conversa, após DB-001-D2. Os comandos
abaixo foram executados manualmente pelo usuário, com sucesso informado. O agente
não os executou nem os repetiu nesta consolidação, não recebeu logs completos e
não atribui a si verificação independente desses resultados.

| Ordem | Comando manual informado | Resultado informado pelo usuário |
| --- | --- | --- |
| 1 | `db:inspect` | Sucesso |
| 2 | `db:migrate` | `applied:1` |
| 3 | `db:migrate` | `applied:0` |
| 4 | `db:grant` | Sucesso |
| 5 | `db:check` | Confirmou 127.0.0.1:5432/imobilead com imobilead_app |

Estado atualizado com essa atribuição: aplicação da primeira migration, segunda
execução sem migrations pendentes, concessão de grants e conexão da aplicação
foram informadas como bem-sucedidas pelo usuário. Isso supera as pendências de
execução correspondentes no checkpoint D2, preservado como histórico. Não se
inferem valores de credenciais, mudanças de senha, códigos de saída numéricos ou
outros detalhes que não foram fornecidos.

Testes PostgreSQL em banco descartável continuam **pendentes**. Essa sequência
não comprova instalação do zero em ambiente isolado, unicidade concorrente,
constraints de nome/papel, integridade de sessões ou todos os casos positivos e
negativos de permissões. Não declarar constraints/permissões integralmente
testadas, nem cadastro/autenticação/autorização completos.

Escopo desta consolidação: documentação e memória, sem funcionalidades, consultas
adicionais ao banco, repetição desses comandos, commits ou push. Registros
anteriores preservados; revisão humana pendente.

Verificação desta consolidação pelo agente: doctor, validate, verify do harness e
`git diff --check` passaram. O verify parcial executou testes do harness,
probe/lint/typecheck, sem testes de produto, build ou comandos de banco; seus
resultados não verificam nem substituem a sequência manual informada acima.

## DB-001-I1 — integração local autorizada, 29/10/2026

Autorização nova: executar `npm run test:db:integration`, criando/removendo
exclusivamente imobilead_test_<sufixo> e papéis exclusivos da execução em
127.0.0.1:5432. Não modificar imobilead, acessar remotos, limpar por prefixo,
implementar funcionalidades ou fazer commit/push. Em falha, diagnosticar antes
de mudar a implementação. Esta autorização supera apenas a pendência de execução
descartável dos checkpoints anteriores, preservados como histórico.

Contrato: sessão principal responsável por revisão/execução e registros nesta
evidência, docs/AI_PROMPTS.md, estado e handoff. Sem delegação por ser execução
delimitada, sem edição do runner. Skills review-security e verify-delivery.
Requisitos relacionados: migrations/reprodutibilidade e testes de persistência.
Aceite: preflight local, uma execução do comando, resultado real, inventário
antes/depois para confirmação de limpeza e separação de escopo dos testes de
API/auth. Parar em falha antes de alterar implementação.

### Revisão prévia do runner

Lidos tests/database/integration.test.mjs, package.json, módulos de configuração,
provisionamento, migrations e verificação de privilégios. O comando npm aponta
diretamente ao arquivo Node test, sem lifecycle adicional configurado.

- localConnection restringe host literal 127.0.0.1, porta 5432 e banco-base
  imobilead; recusa URL com opções de override. Também exige confirmação de trust
  removido e autorização explícita de execução descartável.
- Banco imobilead_test_<12 hex> e papéis imobilead_migrate_<12 hex> /
  imobilead_app_<12 hex> são gerados na execução. Interpolação dos papéis passa por
  allowlist; senha aleatória fica em memória, sem saída ou argumento de processo.
- Conexão-base é usada para CREATE/DROP do banco exclusivo. Provisionamento,
  migrations, fixtures e grants ocorrem em conexões com database substituído pelo
  nome descartável; não há SQL de mutação direcionado ao banco imobilead.
- Limpeza usa nomes completos mantidos pela execução, com flags após criação
  bem-sucedida do banco e commit dos papéis. Fecha clientes, tenta DROP somente
  desses recursos e fecha administrador; não usa descoberta/remoção por prefixo.
  Falhas são sanitizadas e limpeza incompleta gera nomes exclusivos para recuperação.
- Não há garantia absoluta contra interrupção abrupta do processo; catálogo
  posterior será conferido, sem remover recursos de outras execuções.

Credenciais locais serão carregadas sem leitura/exibição de valores. A URL de
teste existente será respeitada e validada; se ausente, a credencial administrativa
local será disponibilizada como TEST_ADMIN_DATABASE_URL somente no ambiente do
processo filho. DB_DISPOSABLE_TEST_AUTHORIZED=true corresponde ao pedido atual.
Nenhum arquivo secreto será alterado. Resultados serão registrados após execução.

### Execução e resultado PostgreSQL real

Preflight READ ONLY confirmou identidade administrativa no destino permitido.
TEST_ADMIN_DATABASE_URL já estava disponível localmente e foi validada sem
exibição. Não foi necessário recorrer a outra variável ou alterar `.env.local`.
Inspeção atual do arquivo HBA do serviço: zero trust/includes, sem alterações.
Catálogo inicial: zero bancos descartáveis e zero papéis com os formatos
ancorados exclusivos do runner.

Comando executado uma vez: `npm run test:db:integration`.
DB_DISPOSABLE_TEST_AUTHORIZED=true foi fornecida apenas à sessão do comando,
conforme a autorização explícita atual. Resultado: código 0; Node test reportou
1 teste aprovado, 0 falhas, 0 cancelados, 0 skips e 0 todo. Nenhuma falha de
execução ou limpeza foi observada; nenhuma mudança de implementação foi feita.

O teste executou PostgreSQL real, sem mocks. Dentro do banco descartável,
passaram as asserções de:

- Aplicação inicial da migration (uma aplicada) e segunda execução (zero).
- E-mail canônico/formato, unicidade concorrente em duas conexões e limite de
  nome (150 aceito, 151 rejeitado).
- Papel user padrão, papel inválido rejeitado e tentativa de atribuir admin por
  INSERT/UPDATE do runtime negada.
- Token de sessão único/com 32 bytes, FK de usuário, expiração/revogação
  coerentes e exclusão em cascata após exclusão administrativa do usuário.
- DML necessário, atributos efetivos do papel runtime, negação de CREATE/ALTER
  no schema da aplicação, acesso ao histórico e DELETE de usuário pelo runtime;
  ausência de CREATE no schema public.

São verificações específicas desse runner; não equivalem a todas as constraints,
permissões possíveis, fluxo de autenticação/autorização de API ou testes de UI.
Os resultados manuais anteriores em imobilead continuam atribuídos ao usuário.

### Limpeza confirmada e proteção do banco existente

O runner concluiu a limpeza em finally com os nomes completos gerados e flags
de criação da própria execução. Nenhum DROP/limpeza adicional foi executado pelo
agente, por prefixo ou por descoberta de recursos alheios.

Uma nova consulta READ ONLY confirmou zero bancos e zero papéis descartáveis
remanescentes; inventário idêntico ao inicial vazio. A consulta de verificação
usou regex ancorada somente para leitura de catálogo, nunca para exclusão.
O nome concreto do sufixo não é emitido pelo runner no caminho de sucesso;
a confirmação combina seu finally concluído e ausência de resíduos no catálogo.

Snapshots antes/depois dos metadados de imobilead coincidiram: schemas/ACLs,
relações/owners/ACLs e atributos dos dois papéis fixos do projeto. Não foram
consultados valores de registros pessoais nem produzida uma auditoria histórica
dos dados; a revisão do fluxo confirmou que nenhum SQL mutável do teste é
direcionado a imobilead. Fixtures, DDL e grants executaram exclusivamente no
banco descartável e papéis exclusivos.

Não houve acesso remoto, alteração de implementação, credenciais/configuração
local, commit ou push. Integração local preparada deixa de estar pendente para
os casos acima; revisão humana e testes de funcionalidades futuras permanecem
pendentes. Histórico preservado, autorrevisão delimitada desta execução.

QA da consolidação: doctor, validate e verify do harness passaram, incluindo
testes do harness, probe, lint e typecheck; `git diff --check` passou. O verify
permanece parcial e não agregou essa integração: sua execução e resultado real
estão registrados separadamente acima. Build não executado nesta rodada.

## DB-001-P1 — contrato de detecção de divergência de privilégios, 29/10/2026

Origem: revisão estática do diff compartilhado nesta conversa. O usuário relata
que verifyRuntimePrivileges não detecta UPDATE(role) adicional; isso não demonstra
grant indevido no banco imobilead. Resultados anteriores permanecem válidos para
os cenários então cobertos. Autorizado reproduzir/corrigir/testar só em banco e
papéis descartáveis exclusivos, e db:check de leitura no banco existente.

- Sessão principal: reprodução antes da correção, integração e cleanup em
  tests/database/integration.test.mjs, evidência, prompt integral, arquitetura,
  SOLUTION e estado/handoff; baseline prévia em diretório temporário para diff
  exclusivo desta rodada, sem incorporar alterações anteriores.
- Backend implementação: server/db/config.mjs e testes offline em
  tests/database/config.test.mjs, somente após reprodução. Ganho concreto:
  revisão do contrato efetivo com funções oficiais, sem confundir INSERT por
  coluna e tabela, fail-closed para NULL/ausência/erros. Um escritor por arquivo.
- Revisão independente posterior: leitura delimitada desses diffs, sem escrita
  ou operações de banco, avaliando tabela/coluna/PUBLIC e preservação de guardas.
- Fontes: contrato runtimeGrantsSql, migration atual e pedido. Escopo restrito a
  usuários, sessões e histórico atuais; sem auditor genérico ou correção automática.
- Exclusões: grants/migrations/dependências/lockfile/CI, mudanças em imobilead,
  remotos, prefix cleanup, funcionalidades, commits e push.
- Aceite: reprodução antiga aceita grant extra; checagem corrigida aprova contrato
  normal e rejeita cenários pedidos, inclusive PUBLIC e remoção de acesso necessário;
  testes offline/integração, db:check de leitura, lint/typecheck/build/harness/diff,
  limpeza confirmada e revisão independente. Até dois especialistas simultâneos,
  histórico herdado explícito, 30 minutos por subcontrato, uma execução e até duas
  correções com hipóteses novas; parar em conflito sem sobrescrever trabalho alheio.

### Reprodução anterior à correção

Baseline de arquivos/Git preservada antes da escrita. Preflight READ ONLY aprovou
127.0.0.1:5432/imobilead com administração local; catálogo inicial sem bancos ou
papéis descartáveis. Somente o banco-base foi consultado; SQL mutável dirigido
ao banco/papéis exclusivos gerados pelo runner.

Comando `npm run test:db:integration`, checagem antiga ainda intacta, código 0:
o contrato normal foi aprovado; GRANT UPDATE(role) no papel exclusivo foi aplicado
no descartável, has_column_privilege confirmou true e a checagem antiga também
aprovou. A etapa de reprodução registrou esses booleanos sanitizados. O grant foi
restaurado em finally e o runner concluiu cleanup; catálogo posterior vazio e
metadados protegidos de imobilead idênticos ao baseline.

### Alteração e falhas intermediárias

Backend implementou somente server/db/config.mjs e testes offline relacionados.
O checker mantém guardas administrativos, exige flags estritamente false e
consulta o contrato atual users/sessions/history com funções oficiais efetivas,
incluindo tabela/coluna/PUBLIC. Resultados necessários devem ser true; ausência,
NULL, colunas/tabelas ausentes ou erro rejeitam. Não há SQL de reparação.
Users SELECT/INSERT autorizado por coluna, sem INSERT(role), UPDATE, DELETE ou
TRUNCATE; sessions DML previsto e sem extras; histórico bloqueado inclusive grants
latentes. Também rejeita REFERENCES/TRIGGER/MAINTAIN/delegação fora do contrato.

Primeira execução de regressões após a correção: código 1, 4 aprovações e 11
falhas no relatório Node. Os cenários iniciais passaram, mas a restauração de
INSERT da tabela retirou também os grants de coluna originais; a checagem
corretamente recusou o contrato incompleto nas etapas seguintes. Diagnóstico
apresentado antes de alterar o teste e confirmado na
[documentação REVOKE do PostgreSQL 18](https://www.postgresql.org/docs/18/sql-revoke.html).
Corrigida somente a restauração no descartável, reaplicando runtimeGrantsSql
após esse REVOKE. Limpeza foi confirmada também após a falha. Nova execução:
código 0, 15 aprovações, zero falhas/skips.

Revisão independente Backend, leitura delimitada dos três diffs de código,
identificou acesso necessário USAGE no schema da aplicação ainda não exigido.
Flag positiva e cenário real REVOKE/GRANT USAGE foram acrescentados. Seguimento
independente confirmou o achado resolvido, sem novos problemas identificados.
Revisor não escreveu arquivos nem executou banco. Uma fixture offline de resposta
ausente também foi ajustada antes da entrega; não mudou o contrato do checker.

### Validação final e confirmação de limpeza

- `npm test`: código 0, 16 testes offline controlados, zero falhas/skips.
- `npm run test:db:integration`: última execução código 0; 16 aprovações Node
  (15 subtestes + principal), zero falhas/skips em PostgreSQL real.
- Casos reais: contrato normal e INSERT por coluna sem INSERT geral; UPDATE(role)
  e UPDATE da tabela; INSERT(role) e INSERT geral; DELETE/TRUNCATE users;
  SELECT sessions, USAGE schema e INSERT(email) necessários removidos; acesso ao
  histórico e grant latente; UPDATE(role) por coluna e DELETE via PUBLIC;
  TRUNCATE sessions indevido. Cada cenário restaura o contrato no descartável.
- `npm run db:check`: código 0, leitura em 127.0.0.1:5432/imobilead com
  imobilead_app; contrato verificado aprovado. Nenhum ajuste automático, novo
  provisionamento ou migration no banco existente.
- `npm run lint`, `npm run typecheck` e `npm run build`: passaram. Build final
  código 0, apenas aviso histórico de depreciação React 18; sem mudança de versões.

Catálogo final: zero bancos/papéis descartáveis, como no início. Cleanup somente
pelos nomes completos e indicadores de criação do runner; nenhuma limpeza
adicional por prefixo. Snapshots de schemas/ACLs, relações/owners/ACLs,
ACLs de colunas e atributos dos dois papéis fixos de imobilead coincidiram
antes/depois. Não foram lidos valores de registros pessoais. Não foram alterados
dados, estrutura ou grants de imobilead, configuração local, migrations existentes,
dependências, lockfile ou CI. Sem funcionalidades, commits, push ou publicação.

Limites: testes anteriores não são invalidados; não cobriam essa divergência.
Esta checagem não audita RLS, funções privilegiadas, objetos futuros ou autorização
da API, não elimina corridas entre checagem/uso e não afirma segurança exaustiva.
Histórico por coluna, delegação e cada guarda administrativa não receberam novos
cenários PostgreSQL individuais, embora a consulta os contemple. Revisão humana
continua pendente. Diff exclusivo desta rodada exportado à pasta temporária.

QA final adicional: doctor/validate/verify --product passaram. O agregador
comprovou 16 testes offline por eventos estruturados e aprovou harness/probe/lint/
typecheck; integração real e build foram executados separadamente acima.
`git diff --check` passou. Escopo continua parcial, sem avaliação global do produto.

Diff exclusivo: `C:\Users\thiag\AppData\Local\Temp\db-001-permissions-review.diff`,
comparando os arquivos com a cópia prévia desta rodada, não com HEAD. Arquivos:
server/db/config.mjs, tests/database/config.test.mjs,
tests/database/integration.test.mjs, SOLUTION.md, docs/ARCHITECTURE.md,
docs/AI_PROMPTS.md, esta evidência, memória project-state.md e handoff.md.
Demais alterações anteriores devem permanecer idênticas à baseline preservada.
Exportação validada por git apply --check --reverse, sem aplicação do patch.
Comparação de hashes confirmou somente esses nove arquivos alterados na rodada,
com os demais arquivos da baseline preservados; índice e status não foram
alterados pela exportação. O diff anterior completo de DB-001 foi preservado.
