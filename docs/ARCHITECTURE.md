# Arquitetura da solução

## Estado atual — DB-001 (29/10/2026)

A etapa de banco está autorizada pelo [pedido atual](prompts/2026-10-29-database.md).
PostgreSQL, modelo inicial, migrations e provisionamento estão implementados em
arquivos; a execução real e suas limitações constam da
[evidência DB-001](harness/evidence/database.md). Cadastro, API de usuários,
login/cookies, autorização e logout ainda não foram implementados. As seções
anteriores de estabilização/Harness e os templates abaixo são históricos; as
decisões DB-001 ao final deste documento são as escolhas atuais de persistência.

## Histórico — migração do lint (28/10/2026)

Esta etapa altera apenas ferramentas, versões e documentação. As seções de
arquitetura funcional abaixo continuam como template, não como implementação
ou evidência de funcionamento de banco, autenticação ou autorização.

### ADR: alinhar o lint ao Next.js 16

- **Contexto:** o upgrade anterior deixou `next lint` (removido no Next 16),
  `.eslintrc.json` legado e ESLint 8.57.0 incompatível com o peer >=9 de
  `eslint-config-next@16.4.3`.
- **Decisão:** manter Next e eslint-config-next em 16.4.3; usar ESLint 9.39.5,
  `eslint .` e `eslint.config.mjs` com `defineConfig`, `globalIgnores` e
  `eslint-config-next/core-web-vitals`, conforme a
  [documentação oficial](https://nextjs.org/docs/app/api-reference/config/eslint).
  Nenhuma regra foi desativada. Ignorar `.next/**`, `out/**`, `build/**`,
  `next-env.d.ts` e `**/*.tsbuildinfo`, que são artefatos gerados.
- **Critério de versão:** 9.39.5 é a última versão estável da série 9 retornada
  pelo npm nesta execução. Seus requisitos de Node e os peers de ESLint dos
  plugins instalados foram conferidos. A versão está marcada no registro como
  sem suporte; permanece por restrição explícita ao ESLint 9 nesta etapa.
- **Alternativas:** manter ESLint 8 preservaria o conflito de peers; adotar
  ESLint 10 ou atualizar React extrapolaria o escopo autorizado.
- **Reprodutibilidade:** versões diretas exatas, preservando as resolvidas
  anteriormente, exceto ESLint: Next/eslint-config-next 16.4.3, React/React DOM
  18.2.0, axios 1.20.0, TypeScript 5.3.3, @types/node 20.11.20,
  @types/react 18.2.58 e @types/react-dom 18.2.19. Lockfile atualizado por
  `npm install` normal; instalação limpa validada com `npm ci`.
- **Ambiente:** Windows, Node 22.13.1, npm 10.9.2. Não foi inicializado Git.
- **Pendências:** revisão humana das alterações; migração futura do React 18
  depreciado; escolha futura de uma série suportada de ESLint; alinhamento do
  CI (hoje Node 20) ao ambiente local. O audit do CI continua report-only e o
  script de testes continua um placeholder. Nenhuma execução remota de CI ou
  validação funcional do desafio é afirmada por esta etapa.

### Validação anterior pelo Codex na pasta de origem

| Comando | Resultado em 28/10/2026 |
| --- | --- |
| `npm install` | Código 0; lockfile atualizado normalmente; zero vulnerabilidades |
| `npm ci` | Código 0; 358 pacotes instalados; zero vulnerabilidades |
| `npm ls --depth=0` | Código 0; versões diretas esperadas; dois pacotes extraneous |
| `npm ls eslint --depth=1` | Código 0; ESLint 9.39.5 deduplicado; nenhum peer inválido nessa consulta |
| `npm run lint` | Código 0 na execução final; zero erros e zero avisos |
| `npm run typecheck` | Código 0 na execução final |
| `npm run build` | Código 0 na execução final; aviso de depreciação do React 18 |
| `npm audit` | Código 0; zero vulnerabilidades reportadas |

A primeira execução do lint apontou `react-hooks/set-state-in-effect` em
`components/Hello/index.tsx`, na chamada ao helper `handleContent` pelo efeito.
O helper já era assíncrono; o diagnóstico da regra não comprova que havia
atualização síncrona em runtime. O ajuste mínimo explicita a atualização
`setMessage` no callback de resolução de `api.get('/v1')`, dentro do efeito,
mantendo mensagem e tratamento de erro. Nenhuma regra foi desativada e nenhuma
funcionalidade nova foi implementada. Lint, typecheck e build foram repetidos
após esse ajuste e passaram. Não houve teste de navegador nesta etapa.

Avisos restantes: npm marca ESLint 9.39.5 como sem suporte; build deprecia
React 18. `npm ls --depth=0` ainda lista `@emnapi/runtime@1.11.3` e
`@img/sharp-wasm32@0.35.5` como extraneous, inclusive após `npm ci`; a causa
não foi investigada nesta correção e não houve limpeza manual. O audit não
substitui avaliação de compatibilidade nem comprova segurança funcional.
Build/typecheck atualizam artefatos gerados em `.next` e `tsconfig.tsbuildinfo`.
Avaliação técnica local feita pelo Codex; revisão humana permanece pendente.

### Estabilização do clone antes do primeiro commit (28/10/2026)

O primeiro `npm run build` desta etapa passou e reaplicou os ajustes do
Next.js ao `tsconfig.json`. Agora eles são preservados por autorização:

- `jsx: react-jsx`: ajuste obrigatório informado pelo Next para usar o
  runtime automático de JSX do React.
- `target: ES2017`: alvo sugerido pelo Next, cujo diagnóstico cita suporte
  a top-level await. É mantido como configuração recomendada do framework,
  sem afirmar que a aplicação utiliza esse recurso.
- `.next/dev/types/**/*.ts` no `include`: inclui tipos gerados pelo Next em
  desenvolvimento; os arquivos gerados continuam ignorados pelo Git.
- A expansão dos arrays é apenas formatação automática do JSON.

Em seguida, `npm run lint`, `npm run typecheck` e `npm run build` passaram
com código 0. A comparação de hashes de todos os arquivos versionados
existentes e de `git status --short`, antes e depois dessa rodada, confirmou
que não houve novas alterações. O segundo build manteve apenas o aviso de
depreciação do React 18. A restauração de `tsconfig.json` descrita na etapa
anterior do log de AI é histórica e foi substituída por esta decisão.

A revisão do diff confirma que `Hello` mantém a chamada a `/v1` no efeito,
a atribuição de `res.data.message`, o estado inicial vazio, o mesmo `<h1>`
e o log de erro. A troca de `async/await` por callbacks da Promise atende
ao lint sem adicionar comportamento funcional. Essa conclusão vem da
leitura do código e das validações estáticas; não houve teste de navegador.

> Preencha este documento com as decisões da sua solução e o **porquê** de cada
> uma. É um dos itens avaliados — queremos entender seu raciocínio, não só o
> código. Pode remover estas instruções em itálico ao entregar.

## Visão geral

_Descreva, em poucos parágrafos, o que você construiu e como as partes se
encaixam (frontend, API, banco de dados, serviços externos)._

## Diagrama

_Um diagrama simples (ASCII, Mermaid ou imagem em `docs/`) do fluxo de dados:
do formulário no client até a persistência no banco e a chamada da API de
previsão do tempo._

```text
[ Browser / Form ] --POST--> [ API /api/... ] --> [ DB ]
        |
        +--GET (client)--> [ API pública de previsão do tempo ]
```

## Banco de dados

- **Escolha:** _qual banco e por quê (trade-offs: simplicidade, fidelidade a
  produção, tempo)._
- **Modelo de dados:** _tabelas/coleções, tipos, índices, unicidade (ex.: e-mail)._
- **Migrations:** _ferramenta e como rodar do zero._

## Segurança (DevSecOps)

_Para cada item, diga o que fez e por quê — e o que deixaria para depois._

- **Senha:** _algoritmo de hash, custo, política._
- **Autenticação/autorização:** _estratégia de sessão (cookie httpOnly, JWT,
  lib), proteção de rotas, **autorização por papel** (user vê só o próprio
  registro; admin lista tudo — checagem no servidor), como um usuário vira
  admin, CSRF/CORS, rate limiting no login, prevenção de user enumeration,
  expiração/renovação._
- **Validação/sanitização:** _client e server; proteção contra injeção e XSS._
- **Segredos:** _como são carregados; o que está em `.env.example`._
- **Rate limiting / anti-abuso:** _estratégia._
- **Headers de segurança:** _quais e onde configurados._
- **Dependências:** _resultado do `npm audit`; findings aceitos e por quê._
- **CI de segurança:** _qual passo (SAST/SCA/secret scan) e o que ele cobre._
- **(Plus) Containers / IaC:** _o que provisionaria e por quê._

## Testes

- **Runner e por quê:** _Vitest/Jest/Playwright/outro._
- **O que cobri:** _validação, regras de autorização (user vs. admin), API._
- **Como rodar:** _comando(s); e onde isso roda no CI._

## Decisões e trade-offs (ADRs)

> Registre decisões relevantes como ADRs curtos. Copie o bloco abaixo por
> decisão.

### ADR-001: _título da decisão_

- **Contexto:** _o problema/necessidade._
- **Decisão:** _o que você escolheu._
- **Alternativas consideradas:** _o que descartou e por quê._
- **Consequências:** _prós, contras e o que fica como dívida técnica._

## O que eu faria com mais tempo

_Liste o que priorizaria a seguir — mostra visão e senso de priorização._

## ADR-H001 — Harness local antes do desenvolvimento funcional (28/10/2026)

- Contexto: o esqueleto foi estabilizado nos registros acima; o pedido atual
  solicita oito componentes de desenvolvimento assistido, antes do produto.
- Decisão: AGENTS conciso; configuração .codex com concorrência 2; quatro
  especialistas standalone; seis skills .agents/skills; scripts Node sem pacotes;
  workflows manuais guiados, memória explícita e hooks opcionais de orientação.
  [Guia operacional](HARNESS.md), [fontes oficiais e formatos](harness/sources.md).
- Alternativas: só criar pastas não demonstraria operação; framework adicional
  ou Agents API ampliaria escopo/custo; hooks globais e trust automático foram
  excluídos pelo pedido. Scripts explícitos mantêm operação sem depender de hooks.
- Consequências: checks positivos/negativos e retomada reproduzíveis; manutenção
  pequena proporcional ao prazo de três dias; documentação não vira pipeline.
- Limites: papéis executados por leitura explícita, seleção nativa não demonstrada;
  revisão de leitura é orientação, sem isolamento por agente; rules cobrem prefixos
  diretos e não formas indiretas; handler testado não comprova disparo real.
  Estado detalhado por componente em [capabilities](harness/capabilities.md).
- Validação: [evidência real H-001](harness/evidence/demo.md); preservação do produto,
  dependências, lockfile e CI conferida contra hashes iniciais. Banco/auth/runner
  continuam sem decisão. Revisão humana pendente; sem commit ou publicação.

## ADR-DB001 — PostgreSQL, SQL explícito e migrations (29/10/2026)

- Contexto: PostgreSQL 18 foi definido pelo usuário, que criou `imobilead` no
  DBeaver. Recuperação de acesso é contexto local, não requisito de instalação
  para o avaliador. A conexão na extensão VS Code foi informada pelo usuário;
  conexão da aplicação precisa de evidência própria.
- Decisão: driver `pg@8.23.1` no servidor e `node-pg-migrate@9.0.0` em
  desenvolvimento, com SQL explícito em `database/migrations/`. A ferramenta
  fornece histórico, ordenação, transação e lock de migrations; não há runner
  próprio de migrations. `server-only@0.0.1` marca a fronteira de servidor e
  `@types/pg@8.23.1` fornece tipos. Novas dependências diretas exatas; versões
  estabilizadas anteriormente foram preservadas.
- Alternativa: Prisma daria cliente gerado e schema declarativo, mas acrescentaria
  geração/DSL sem ganho necessário para duas tabelas e constraints explícitas
  nesta etapa. SQL requer manutenção manual dos tipos e consultas parametrizadas.
- Comandos oficiais consultados: [API node-pg-migrate](https://salsita.github.io/node-pg-migrate/api),
  [CLI node-pg-migrate](https://salsita.github.io/node-pg-migrate/cli),
  [conexões SSL no node-postgres](https://node-postgres.com/features/ssl).
  `node-pg-migrate@9.0.0` requer Node >=20.11; ambiente local Node 22.13.1.
- Consequências: scripts são limitados ao destino autorizado
  `127.0.0.1:5432/imobilead`, sem opções de URL que sobreponham host. Conexão é
  construída apenas no servidor, de forma lazy, e recusa papel administrativo
  no runtime. Essa restrição local precisará de decisão explícita para produção.
  Credenciais ficam em variáveis/`.env.local` ignorado; nenhum segredo é exibido.
- Migrations são forward-only. Não existe reset/down destrutivo do banco local.
  Preflight verifica identidade efetiva e inventaria objetos; objetos do projeto
  sem histórico impedem avançar. A execução real ainda depende das credenciais
  locais e da inspeção do estado existente, conforme a evidência.

## ADR-DB002 — modelo inicial e fronteira de dados (29/10/2026)

Schema de aplicação `imobilead`; histórico em `imobilead_meta`, sem acesso pelo
papel runtime. Uma migration inicial cria as tabelas abaixo.

| Tabela/campo | Tipo e nulabilidade | Regra/decisão |
| --- | --- | --- |
| users.id | uuid, PK, não nulo | gerado por `gen_random_uuid()` |
| users.name | varchar(150), não nulo | máximo 150; mínimo não inventado, string vazia aceita nesta camada |
| users.email | text COLLATE C, não nulo, UNIQUE | valor canônico `lower(btrim(email))`, CHECK de formato básico |
| users.password_hash | text, não nulo | CHECK não vazio; tamanho não deriva do limite 8–35 da senha |
| users.address/city/state/country/postal_code/message | text, nulos permitidos | README não fixa obrigatoriedade/limites; sem restrições brasileiras de CEP/estado |
| users.role | text, não nulo | CHECK `user/admin`, DEFAULT `user` |
| users.created_at/updated_at | timestamptz, não nulos | DEFAULT now(); CHECK updated_at >= created_at |
| sessions.token_hash | bytea, PK, não nulo | CHECK 32 bytes; digest SHA-256, nunca token bruto |
| sessions.user_id | uuid, não nulo | FK users.id ON DELETE CASCADE; índice para vínculo/exclusão |
| sessions.created_at/expires_at | timestamptz, não nulos | criação DEFAULT now(); expiração > criação |
| sessions.revoked_at | timestamptz, nulo permitido | quando presente, >= criação |

O banco rejeita e-mail não canônico, e o índice UNIQUE protege a unicidade também
em inserções concorrentes. O Backend futuro deve aplicar a mesma política de
normalização antes do INSERT; o CHECK de formato é uma defesa básica, não validação
completa de endereço nem prova de posse. Esta decisão cobre o casefold ASCII;
normalização/casefold internacional requer decisão e testes antes de ampliação.

Não há coluna de senha em texto puro nem confirmação. O banco não consegue
comprovar que um texto não vazio é hash seguro: hashing Argon2id e parâmetros
serão implementados/testados com Backend na etapa de autenticação. A política de
senha original 8–35 alfanumérica pertence às validações futuras, não à coluna hash.

`updated_at` deverá ser atualizado explicitamente pelo Backend; não há trigger.
PKs e UNIQUE já fornecem seus índices, sem duplicação. Não há índice de expiração
porque não foi criada tarefa de limpeza nesta etapa; reavaliá-lo junto dessa tarefa.

`server/db/index.ts` oferece uma projeção explícita dos campos de cadastro,
identificador e datas; exclui `password_hash`, papel e todo material de sessão.
Não existe API de consulta ainda: respostas futuras precisam usar allowlist e
checar autorização no servidor. A existência dessa constante não comprova ausência
de vazamento em endpoints futuros.

## ADR-DB003 — sessão e administrador: contrato com Backend (29/10/2026)

Backend revisou o contrato antes da tabela. Estratégia acordada: token opaco
aleatório de 32 bytes gerado no servidor, persistindo apenas seu SHA-256 de 32
bytes. Expiração absoluta de uma hora, sem renovação inicialmente; revogação por
`revoked_at`. Consulta futura aceita somente sessão não revogada, não expirada e
vinculada a usuário existente. A tabela permite expiração positiva; a política de
uma hora deverá ser aplicada e testada na emissão futura.

Cookie futuro: HttpOnly, Secure, SameSite=Lax, Path=/. CSRF/verificação de origem,
CORS, rate limiting e prevenção de enumeração serão decididos e exercitados com
login/logout. Nenhum cookie, endpoint ou fluxo de autenticação foi implementado
nesta rodada. A alternativa JWT acrescentaria gestão de revogação ao requisito de
logout; sessão opaca permite invalidação central imediata, ao custo de consulta
ao banco por sessão e da futura limpeza de registros expirados.

Administrador futuro: promoção administrativa explícita de usuário já existente
por UUID, após conferência local. Não há seed, conta, senha padrão ou usuário real
criado automaticamente; o comando de promoção fica pendente para a próxima etapa.
Cadastro público deve rejeitar papel recebido e inserir `user`; grants por coluna
já excluem `role` do INSERT e não concedem UPDATE ao runtime como defesa adicional.

## ADR-DB004 — papéis e permissões locais (29/10/2026)

Credenciais separadas: administração em `ADMIN_DATABASE_URL`, migrations em
`MIGRATION_DATABASE_URL` (`imobilead_migrate`) e execução em `DATABASE_URL`
(`imobilead_app`). Provisionamento cria somente papéis e schemas do desafio;
recusa colisões em vez de assumir papéis/objetos existentes. Senhas são definidas
localmente pelo prompt protegido `psql \password`, nunca fixadas no código.

Ambos papéis de projeto são LOGIN/NOSUPERUSER/NOCREATEDB/NOCREATEROLE,
NOREPLICATION/NOBYPASSRLS/NOINHERIT. Migrations detém os schemas; runtime recebe
USAGE somente no schema da aplicação, SELECT users e INSERT em colunas
explícitas que excluem `role`, além de DML sessions. UPDATE/DELETE users não
foram concedidos porque o README exige cadastro/consulta, sem edição/exclusão. Nenhum grant para
histórico ou CREATE de estrutura é dado à aplicação. Checagem runtime recusa
atributos privilegiados, memberships e CREATE em schemas da aplicação/público,
sem revogar permissões globais ou alterar outros bancos. PUBLIC CONNECT/TEMP
padrões do PostgreSQL não foram alterados; não se afirma isolamento absoluto do
papel entre bancos. Negação de DDL aqui diz respeito a objetos permanentes nos
schemas verificados, não a tabelas temporárias.

Não há default grant amplo para tabelas futuras. Cada migration que criar objetos
novos deve incluir/revisar grants mínimos explícitos, e manter objetos internos em
schema sem acesso runtime. `db:grant` concede somente o contrato das duas tabelas
atuais e pode ser repetido; mudanças de modelo exigem atualizá-lo. Papéis globais
criados têm nomes exclusivos do desafio; nenhum papel alheio é modificado.

## Testes e limites DB-001

Node test runner foi escolhido para testes de configuração/guardrails sem outro
framework; `npm test` declara arquivo explícito, compatível com o adaptador atual
do harness. Testes PostgreSQL reais ficam separados em `test:db:integration` e
não são substituídos por mocks. O runner prepara banco e papéis com sufixo aleatório
identificado pela execução e limpa somente esses recursos; nunca usa reset/drop/
truncate em `imobilead`. Execução exige autorização explícita de destino descartável
compatível com a restrição atual e credencial administrativa local.

Casos preparados: primeira e segunda migration, e-mail canônico/único concorrente,
nome/papel, integridade temporal/FK e revogação de sessões, DML autorizado e DDL/
escalada/persistência de migrations negados ao runtime. Resultados executados e
lacunas estão na [evidência](harness/evidence/database.md). Testes offline não
comprovam migrations ou permissões reais; cadastro/auth/API permanecem pendentes.
CI não foi modificado nesta rodada; integração PostgreSQL no CI fica para etapa
posterior. `npm audit` após adições retornou código 0, zero vulnerabilidades,
sem resolver os avisos históricos de suporte de ESLint 9 e React 18.

## ADR-DB005 — verificar o contrato efetivo de privilégios (29/10/2026)

Origem: revisão estática do diff DB-001 compartilhado nesta conversa. A checagem
administrativa anterior não detectava grants extras em tabelas/colunas; não foi
demonstrado grant indevido em imobilead. Reprodução descartável confirmou que
UPDATE(role) adicional era efetivo e a checagem antiga ainda aprovava. Testes
anteriores permanecem válidos no escopo original, sem esse cenário adicional.

Decisão: manter verifyRuntimePrivileges somente de leitura e limitada às três
tabelas atuais. Exigir flags administrativas/memberships/CREATE explicitamente
false, USAGE no schema da aplicação explicitamente true e contrato de ACLs
explicitamente verdadeiro. OIDs de pg_catalog permitem verificar o histórico
sem conceder USAGE no schema interno. Ausência/NULL/resposta incompleta/erro
nunca aprovam. Usar as funções oficiais
[de privilégios efetivos](https://www.postgresql.org/docs/18/functions-info.html),
que consideram grants de tabela, coluna e PUBLIC.

- Users: SELECT em suas 13 colunas e INSERT nas 12 autorizadas, excluindo role;
  sem UPDATE em qualquer coluna, DELETE/TRUNCATE ou poderes fora do contrato.
  INSERT por coluna não exige INSERT na tabela inteira.
- Sessions: SELECT/INSERT/UPDATE efetivos nas cinco colunas e DELETE; sem extras
  como TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ou delegação de privilégios.
- Histórico: sem USAGE/CREATE em imobilead_meta nem privilégios de tabela/coluna
  em pgmigrations, mesmo direitos latentes sem acesso ao schema.

Alternativa de comparar somente ACLs diretas seria insuficiente para privilégios
efetivos herdados de tabela/PUBLIC. Reparação automática com GRANT/REVOKE foi
excluída: divergência deve ser diagnosticada e tratada em tarefa autorizada.
Não há auditor genérico; mudança de schema/contrato requer atualizar a checagem.

Regressões reais isolam grants/revogações no descartável e restauram o contrato
em finally. A restauração de INSERT da tabela precisa repor os grants por coluna,
pois [REVOKE de tabela também revoga os correspondentes de coluna](https://www.postgresql.org/docs/18/sql-revoke.html).
Uma falha intermediária do teste expôs esse comportamento e foi corrigida sem
alterar grants do banco existente. Revisão independente acrescentou USAGE como
acesso necessário; correção e regressão real incluídas.

Limites: contrato fixo de ACLs atuais, sem auditoria de RLS, funções privilegiadas,
objetos futuros, TOCTOU ou autorização da API. A checagem é um diagnóstico no
momento de execução, não uma garantia permanente contra mudanças posteriores.
Resultados reais, revisão e limpeza em [DB-001-P1](harness/evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).
