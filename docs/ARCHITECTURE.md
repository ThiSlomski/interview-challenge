# Arquitetura da solução

## Estado atual — REG-001 (29/10/2026)

A etapa de banco está autorizada pelo [pedido atual](prompts/2026-10-29-database.md).
PostgreSQL, modelo inicial, migrations e provisionamento estão implementados;
a execução real e suas limitações constam da
[evidência DB-001](harness/evidence/database.md). Cadastro por POST implementado
em REG-001, com contrato ao final. Consulta GET, login/cookies, autorização e
logout continuam pendentes. As seções
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

## REG-001 — cadastro pela API (29/10/2026)

Origem: [pedido integral](prompts/2026-10-29-registration.md). Plano/contrato em
[REG-001](harness/evidence/registration-plan.md), resultados separados em
[evidência](harness/evidence/registration.md). Revisão humana pendente.

Fluxo: POST /api/users → handler somente de servidor → validação pura compartilhada
→ Argon2id → repository com INSERT parametrizado → PostgreSQL. A rota injeta o
provider de banco existente, que mantém destino 127.0.0.1:5432/imobilead e papel
imobilead_app, com verificação prévia de privilégios. Nenhum grant/schema alterado.
A validação em shared/ não importa servidor, ambiente, crypto ou persistência;
password/repository/handler têm marcador server-only. Cliente futuro pode reutilizar
as mesmas regras; tela/validação no navegador ainda não entregues.

Entrada: name/email/password/passwordConfirmation presentes; name string até 150
pontos de código, sem mínimo além do tipo, preservando DB-001. Senha ASCII
alfanumérica 8–35 sem exigência de misturar letras/números; confirmação exata,
nunca persistida. Opcionais address/city/state/country/postalCode/message aceitam
string ou null, sem tamanho individual/formato brasileiro inventado. Strings com
NUL são incompatíveis com text PostgreSQL e retornam 400. Não se remove HTML dos
textos: armazenamento parametrizado preserva os dados; futura UI deve renderizar
como texto, sem dangerouslySetInnerHTML. Transporte limita o JSON inteiro a 16 KiB.

E-mail: espaços ASCII externos removidos como btrim do contrato; checagem ASCII
antes de lowercase, local dot-atom e domínio DNS pontuado com labels sem hífen nas
pontas. Sintaxe suportada é deliberadamente limitada: sem quoted locals, comentários,
literais IP, SMTPUTF8 ou prova de posse. O dot-atom segue a
[RFC 5322 seção 3.2.3](https://www.rfc-editor.org/rfc/rfc5322#section-3.2.3).
Historicamente, a implementação inicial REG-001 não acrescentava limites de
comprimento; essa omissão foi reproduzida e corrigida em REG-001-E1. Estado atual:
parte local até 64 bytes, cada label do domínio até 63 bytes e e-mail normalizado
completo até 254 bytes. Após checar ASCII, cada caractere ocupa um byte; `.length`
é suficiente, sem Buffer ou importação de Node no validador compartilhado.
A [RFC 5321 §4.5.3.1.1–3](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1)
limita parte local a 64 octetos e caminho SMTP a 256 incluindo pontuação;
254 é o limite adotado para a mailbox normalizada deixando dois bytes para `<`/`>`.
A [RFC 1035 §2.3.4](https://www.rfc-editor.org/rfc/rfc1035#section-2.3.4)
limita labels DNS a 63 octetos. Não há consulta DNS, envio ou verificação de posse.
Excesso retorna o mesmo erro email: INVALID_EMAIL, sem ecoar a entrada. A API valida
formato e comprimento mais estritamente que o CHECK básico do banco; nenhuma
constraint/migration/grant foi alterada. A revisão inicial não cobriu a omissão de
comprimento; descoberta e regressões pertencem exclusivamente à correção E1.

Dependência nova: @node-rs/argon2 **2.2.2**, exata no manifest/lock. Binding nativo
com binário disponível no Windows/Node local, sem ampliar privilégios ou instalar
compiladores. argon2@0.45.1 foi tentado e descartado: exigiu Python/node-gyp
indisponível. npm ci posterior confirmou instalação reproduzível local. Argon2id
v19, m=19456 KiB (19 MiB), t=2, p=1, salt criptográfico novo de 16 bytes, saída de
32 bytes em formato PHC com parâmetros e salt. Parâmetros mínimos recomendados
pela [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
Testes verificam custo/versão/salt único e verificação positiva/negativa. Não há
comparação de senha em texto, armazenamento da senha original ou confirmação.
Reavaliar custo com medições sob carga antes de produção; outras plataformas não
foram executadas nesta rodada.

SQL lista só campos de cadastro e hash; papel/id/datas vêm dos defaults do banco.
Qualquer chave não pública, inclusive role=admin, causa 400. A restrição UNIQUE de
email é o árbitro concorrente: somente SQLSTATE 23505 com constraint
users_email_key vira 409, sem SELECT prévio vulnerável a corrida. Demais erros
retornam 500 com código constante. Não se serializa Error/SQL/detalhe/credencial;
log do servidor contém somente REGISTRATION_FAILED. Resposta 201 é apenas
{user:{id}}, sem hash, e-mail, papel, confirmação, cookie ou sessão. Erros e sucesso
usam no-store e nosniff. Métodos não implementados seguem comportamento 405 do Next.
409 permite inferir existência do cadastro: trade-off explícito deste POST; não é
contrato de erro do futuro login, que deve evitar enumeração.

Origem esperada vem exclusivamente de APP_ORIGIN (sem caminho ou barra final),
obrigatória em produção, padrão http://localhost:3000 apenas em desenvolvimento.
URL/Host/Forwarded da requisição não definem confiança. Origin presente deve ser
exatamente igual; null, outra origem ou Sec-Fetch-Site: cross-site são recusados.
Sem Origin, clientes não navegador podem usar JSON; cabeçalhos podem ser forjados
por clientes diretos e não autenticam usuários. Não há Access-Control-Allow-Origin
ou credenciais CORS; o OPTIONS automático não autoriza leitura cross-origin.
Somente application/json (opcional charset=utf-8) e encoding identity são aceitos,
impedindo submissões HTML simples. Nesta etapa sem sessão/cookie/autoridade ambiente,
não há operação autenticada vulnerável a CSRF; JSON/origem reduzem cadastro forçado
por navegador, mas não substituem controles de CSRF da futura autenticação.

Abuso: orçamento global de 20 tentativas/minuto por instância, incluindo rejeições,
sem confiar em IP/Forwarded; Retry-After em 429. Estado de tamanho fixo evita mapa
controlado por atacante. No máximo dois corpos/hashes/inserts ativos, sem fila;
leitura do corpo limitada em bytes reais, com prazo de cinco segundos, cancelamento
e liberação de slot em finally. Isso limita trabalho Argon2 a cerca de 38 MiB
simultâneos de memória de hashing. Content-Length não é a única defesa. Antes de
produção, gateway precisa impor conexões, tamanho/tempo, quotas por identidade/IP
confiável e orçamento compartilhado. Reinícios/múltiplas instâncias reiniciam/dividem
o orçamento; um cliente pode esgotar a quota global e negar serviço a outros.
Não há proteção anti-bot distribuída ou promessa de disponibilidade sob ataque.

Testes reais: o runner descartável existente inicia Next **dev com webpack** numa
cópia temporária e usa a rota e módulos inalterados. Somente server/db/index.ts da
fixture é substituído para apontar ao banco/papel exclusivos desta execução; exige
prefixos exatos aleatórios e loopback, checker e grants mínimos preservados. Nenhum
segredo é escrito na fixture; env do processo não inclui credenciais administrativas,
de migrations ou runtime principal. Essa adaptação não flexibiliza o runtime real,
nem comprova sua configuração conectando a imobilead. Build de produção validado
separadamente; HTTP real nesta rodada é servidor de desenvolvimento local. Limpeza
remove processo, junction e diretório próprios, banco e papéis próprios; catálogo
confirma zero recursos da execução e metadados/ACLs protegidos iguais. Não lemos
linhas pessoais ou executamos INSERT/DELETE/GRANT no banco principal.

## AUTH-001 — login, sessão e logout, 29/10/2026

[Contrato](harness/evidence/authentication-plan.md) e
[evidência](harness/evidence/authentication.md). Rotas consistentes sob
`/api/auth/{login,session,logout}`; README não define caminhos. Configuração e
protocolo completo em [SOLUTION](../SOLUTION.md#auth-001--autenticação-api-29102026).
Separação: handler servidor controla HTTP/origem/abuso; session.mjs contém cookie,
entropia/digest e autenticação central; provider DB e checker existentes preservados.
Normalização de e-mail extraída da validação de cadastro; login não depende do
formulário/confirmar senha e preserva a senha byte a byte.

Token opaco 32 bytes CSPRNG/base64url, SHA-256 persistido, HttpOnly e no-store;
não há JSON/localStorage com token. Cookie de sessão sem persistência cliente
por Max-Age; expiração absoluta servidor de 3600s, sem refresh. Novo token por
login preserva outros dispositivos e sessões anteriores. Logout UPDATE persistido
antes de apagar cookie; falha retorna 503 sem declarar sucesso. Configuração exige
TTL literal 3600 e APP_ORIGIN exata, HTTPS em produção. __Host prefix/Secure em
produção e nome distinto em HTTP local evitam flexibilizar produção para QA.
SQL parametrizado projeta apenas id/hash internamente no login e id/expiração/
revogação na consulta. Nenhuma promoção/role/listagem é implementada.

Defesa CSRF usa Origin exata obrigatória para POST; ausente/null é recusado.
Sec-Fetch-Site aceita ausência/same-origin/none; Mode ausência/cors/same-origin;
Dest ausência/empty. SameSite=Lax é defesa adicional. Sem CORS arbitrário.
Hash dummy Argon2id no caminho ausente tem custo equivalente ao hash do cadastro;
erros credenciais uniformes. Não se afirma tempo constante da requisição.

Abuso: 30/min global, 5/min por digest e-mail, Map <=1024 entradas, janela fixa
60s, concorrência <=2, leitura <=4096 bytes/5s. Sem IP/Forwarded arbitrários.
Quota global compartilhada por processo pode causar recusa a outros usuários;
reinícios/múltiplas instâncias não coordenam estado. Produção requer proteção no
ingresso e controle distribuído com limites/monitoramento apropriados. Sem bloqueio
permanente. Logout não lê corpo e compartilha limite de concorrência com sessão/login.

Fontes oficiais consultadas em 29/10/2026: [Next cookies](https://nextjs.org/docs/app/api-reference/functions/cookies),
[Next autenticação](https://nextjs.org/docs/app/guides/authentication),
[OWASP autenticação](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
[OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
[OWASP sessões](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
Aplicação das fontes: verificação servidor, erro genérico/trabalho hash equivalente,
origem confiável e atributos/vida de sessão. Não representam certificação.
