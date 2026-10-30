# Arquitetura da solução

## ADMIN-DELETE-001 — exclusão somente user, 30/10/2026

Extensão autorizada além do README, que permanece preservado. DELETE de conta
user por admin autenticado; sem autoexclusão, admin, soft delete/restauração,
alteração de papel, lote ou auditoria persistente. [Contrato](harness/evidence/admin-delete-plan.md),
[evidência](harness/evidence/admin-delete.md). Nenhum efeito no banco persistente.

Um cliente emprestado do pool atende autenticação/autorização inicial e transação.
Papel admin fresco é exigido antes de validar UUID ou consultar/bloquear alvo;
user recebe403 uniforme mesmo para UUID malformado/inexistente. Origem exata e
Fetch Metadata reutilizam controle do perfil; DELETE não recebe corpo/query.
Como Next expõe stream mesmo vazio, lê somente até EOF/primeiro byte com prazo5s,
aceita apenas EOF e cancela conteúdo recusado sem acumulá-lo. Tamanho máximo16KiB para cabeçalho de
comprimento,20 operações/minuto/duas ativas, lock_timeout5s e statement_timeout
do runtime10s preservam orçamento limitado. Respostas no-store/nosniff.

BEGIN e locks SELECT id,role WHERE id=ANY(...) ORDER BY id FOR UPDATE adquirem
users por ordem UUID. Sessão do ator é lida por digest/UUID com FOR SHARE e
expiração/revogação conferidas depois das esperas. Revalida ator admin, proíbe
autoexclusão, exige alvo user e DELETE parametrizado WHERE id/role=user RETURNING
id com cardinalidade exatamente1. Checa TTL novamente; erro/recusa faz rollback,
COMMIT antecede204 sem corpo. Cliente sempre liberado. Sem count de admins,
trava consultiva/global ou coordenação com futuros rebaixamentos.

FK sessions.user_id ON DELETE CASCADE remove todas sessões na mesma transação;
nenhum DELETE explícito em sessions é executado. Se login perde o usuário entre
verificação da senha e INSERT da sessão, a FK recusa e retorna401 genérico sem
cookie. Se login vence, DELETE subsequente remove sessão; cookie já emitido não
autentica após cascade. Demais falhas continuam sanitizadas, sem detalhes SQL.

Schema e índices inalterados, sem migration artificial de ACL. runtimeGrantsSql
concede DELETE users e revoga DELETE sessions; checker exige esse contrato
efetivo incluindo PUBLIC e nega grant option, TRUNCATE/DDL, alterações de
credenciais/papel/identidade/datas de criação e acesso ao histórico. ACL do perfil
por coluna preservada. Antes de aplicar o novo contrato, runtime com guarda nova
recusa ACL antiga: implantação futura precisa grants/check/restart autorizados.
DELETE SQL é privilégio de tabela; autorização por linha/role permanece na API.

GET listagem admin acrescenta role à allowlist pública; consulta individual e
perfil mantêm projeções anteriores. UI não mostra ação para admin, mas isso não
concede autorização. Confirma identidade/efeitos com Cancelar inicial, teclado,
Escape e retorno de foco. Escape pendente fecha apenas o diálogo, mantendo
processamento e logout disponíveis; não cancela/sugere rollback do HTTP.
Requisição pendente não remove otimisticamente;204/404
reconsultam página/cursor e vazio com cursor retorna à primeira. Rede/timeout
causam reconciliação sem alegar falha definitiva. Novas composições válidas são
aceitas e respostas de gerações anteriores não reapresentam usuário removido.
Logout/identidade/TTL/histórico/gate e edição de perfil permanecem protegidos.

Alternativas descartadas: exclusão admin, contador do último admin, trava global,
soft delete e DELETE manual de sessões. Triggers/barreiras usados para testar
corridas existem apenas nas fixtures descartáveis, nunca no produto/persistente.

Limites: leitura já produzida pode continuar em trânsito; a UI invalida respostas
anteriores à mutação, não se promete cancelar retroativamente HTTP confirmado.
Limitador em memória não coordena réplicas. Revisão humana/CI remoto do diff e
HTTPS/múltiplos navegadores não são inferidos de verificações locais.

## PROFILE-001 — edição própria, 30/10/2026

Contexto: extensão solicitada além da criação/consulta exigidas pelo README.
Implementação limitada ao perfil; exclusão/containerização fora desta etapa.
[Contrato e responsabilidades](harness/evidence/profile-plan.md),
[evidências e limites](harness/evidence/profile.md).

Decisão: GET/PATCH /api/profile sempre derivam o alvo da sessão central. A leitura
retorna a projeção pública já existente e profileVersion numérico em metadado
separado; os GETs de usuários mantêm exatamente a projeção anterior. PATCH parcial
aceita expectedVersion e somente name/address/city/state/country/postalCode/message.
E-mail, senha, papel, UUID, datas e campos desconhecidos são recusados. O validador
de textos foi extraído do cadastro para ser compartilhado, sem mudar suas regras
ou criar limites novos. Corpo de16KiB/5s, origem exata/Fetch Metadata, JSON UTF-8,
no-store/nosniff e orçamento local de20 escritas/minuto/duas ativas preservam os
controles adotados no cadastro/auth. Sem CORS entre origens.

Migration aditiva introduz profile_version integer NOT NULL DEFAULT1 com CHECK
positivo; limite2147483647 tratado como conflito sem overflow ou reset. A versão
é número em JSON. PATCH exige expectedVersion e If-Match na forma
`"profile:<uuid>:<versão>"`; ETag é precondição de recurso, não credencial nem
autorização. Um formulário da identidade A não escreve na identidade B após
troca de cookie, mesmo se ambas estiverem na versão1. Não se transporta token,
hash de sessão ou segredo na precondição.

Transação usa Pool.connect e um único cliente: BEGIN, lock_timeout5s, usuário
FOR UPDATE por UUID da sessão, sessão FOR SHARE por digest/usuário/não revogada/
expiração, papel user/admin fresco, comparação de versão, UPDATE com mapa fixo
de colunas, incremento e updated_at monotônico. Confere expiração novamente após
UPDATE; falha implica rollback, inclusive se prazo venceu durante a instrução.
Logout concorrente aguarda o lock de sessão ou é observado antes da escrita.
Uma sessão revogada antes de obter o lock não pode escrever. COMMIT precede200;
falhas/recusas fazem rollback e release. Nenhuma renovação de sessão.

Grants users: SELECT, INSERT anterior (sem role nem profile_version), UPDATE
apenas campos editáveis/updated_at/profile_version. DELETE/TRUNCATE/DDL, UPDATE
email/password_hash/role/id/created_at e grant option continuam negados. Checker
verifica14 colunas e privilégios efetivos/PUBLIC; novas ACLs são aplicadas pelo
fluxo administrativo versionado existente, não pela API nem automaticamente.
Reinício após migration/grants; guarda falha fechada em instalação não preparada.

UI mantém gate síncrono, gerações, TTL, abortos e validação inicial/final da sessão.
Perfil é carregado ao abrir editor, sem acrescentar dependência ao gate inicial.
Polling incorpora campos frescos na leitura sem substituir draft. A mutação
invalida leituras pendentes; resposta antiga não desfaz um save. Editor somente
em memória, e-mail readonly, estados/erros associados/foco,409 exige recarga
explícita; hidden/logout/troca de contexto descartam editor. Admin edita a própria
conta inclusive fora da página atual da listagem, sem duplicar detalhes próprios.

Alternativas descartadas: alteração de e-mail/senha, versão bigint/string,
last-write-wins, limites distintos do cadastro e UPDATE irrestrito de tabela.
Sem nova dependência nem alteração de README/workflow/guardas de destino.

Limites: runtime compartilhado autoriza escrita por coluna, não isolamento por
linha no PostgreSQL; autorização de identidade permanece na API. Limitador em
memória não coordena múltiplas instâncias. Commit pode ocorrer e a resposta se
perder; conferir versão atual antes de tentar novamente. Não se promete cancelar
requisições já confirmadas após logout. HTTP/PG/UI usam fixtures descartáveis;
CI remoto, HTTPS de produção e revisão humana não são comprovados por testes locais.

Plano posterior ADMIN-DELETE-001: somente user, nunca admin; bloquear/revalidar
ator/alvo na transação. Removidos do plano anterior contagem do último admin,
trava consultiva global e coordenação com futuros rebaixamentos. Não implementado.

## CI-001 — pipeline bloqueante, 30/10/2026

Decisão vigente para CI; referências abaixo a Node20/report-only/integração
futura são históricas. [Contrato](harness/evidence/ci-plan.md),
[evidência](harness/evidence/ci.md) e [execução local](../SOLUTION.md#ci-e-próxima-etapa).

Três jobs independentes quality/postgres-integration/security com Node22.13.1,
npm ci/cache, Ubuntu24.04 e timeouts15/20/10min. Quality executa lint, tipos,
testes offline/servidor e build. PG18 é um serviço efêmero sem volume persistente,
acessível pelo runner em127.0.0.1:5432 após health check limitado. A guarda já
existente exige banco-base chamado imobilead: no CI esse nome identifica apenas
o banco vazio do serviço, jamais o banco persistente local. Assim não se altera
a guarda de produção nem se introduz conexão remota para viabilizar os testes.

Administrador/URL exclusivamente sintéticos no workflow, sem repository secrets.
As três variáveis do contrato de testes são TEST_ADMIN_DATABASE_URL, DB_TRUST_REMOVED=true e
DB_DISPOSABLE_TEST_AUTHORIZED=true. O runner cria banco/papéis próprios aleatórios,
migra e testa ACLs/constraints/sessões/HTTP cadastro/auth/autorização; limpa em
finally e falha se limpeza/verificação falhar. Não se promete finally em kill
forçado; o serviço e runner efêmeros limitam resíduos no CI. Em execução local,
examine somente recursos próprios identificados se cleanup falhar, sem remoção
por prefixo ou escrita no banco principal.

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

Referência: [rede entre contêineres Docker](https://docs.docker.com/engine/network/#container-networks).

SCA obrigatório: `npm audit --audit-level=high`, sem supressão; high/critical
bloqueiam. Low/moderate continuam no relatório e não bloqueiam por esse limite.
Zero findings atuais é fotografia do registro consultado, não ausência de falhas
de código nem garantia futura. Sem instalação corretiva/force no pipeline.
UI permanece local: navegador não provisionado, CDP/autofill/capturas e
portabilidade Linux ainda não comprovados. HTTP/PG roda sem iniciar Chromium.

Mínimo privilégio contents:read, checkout sem credencial persistida, sem escrita
remota nem secrets, concorrência workflow/ref e cancelamento de execução antiga.
Pinagem SHA imutável de actions oficiais verificada via GitHub API, com versões
legíveis; política remota permite todas as actions e não exige SHA, mas adotamos
pinagem. PostgreSQL18 usa tag major explícito (patches mutáveis, sem digest).

Consulta read-only: repositório público, Actions habilitado, CodeQL default setup
not-configured. Não se demonstrou configuração avançada de CodeQL; optou-se
pelo SCA obrigatório neste escopo sem ampliar permissões/configurações remotas.
Não há garantia de branch protection: jobs falham sem mascaramento, mas tornar
os checks obrigatórios para merge é configuração remota fora desta entrega.

Fontes oficiais: [serviços PostgreSQL](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers),
[pinagem de actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions).
Autorrevisão sequencial; revisão humana e CI remoto do diff pendentes (fase2).

## WEATHER-001 — previsão no navegador, 30/10/2026

README 13.c/d implementados no sucesso do cadastro. Esta decisão substitui apenas
as indicações históricas de clima pendente abaixo. O resumo continua somente
em memória e é descartado ao recarregar/sair; senha, contrato do POST, banco,
sessão, autorização e revalidação administrativa permanecem preservados.

Open-Meteo foi escolhida por oferecer geocodificação e previsão diária REST
diretamente no navegador, sem chave neste uso gratuito do desafio, sem dependência
nova, embed, proxy, Server Action ou endpoint interno. Consulte os termos do
serviço para outro uso comercial. Fontes oficiais consultadas em 30/10/2026:
[geocodificação](https://open-meteo.com/en/docs/geocoding-api) e
[previsão/WMO](https://open-meteo.com/en/docs).

Fluxo: sucesso confirmado → Weather cliente recebe somente city/state/country →
GET geocoding-api.open-meteo.com/v1/search → validação/seleção → GET
api.open-meteo.com/v1/forecast com coordenadas → validação → seção acessível.
shared/weather.mjs reúne validação, seleção, URLs, tradução WMO, formatação e
coordenação HTTP; weather.d.mts descreve os campos externos consumidos e os
resultados validados. components/ui/Weather.tsx controla ciclo de vida e exibição.

A geocodificação pede 5 resultados em português. name combina cidade+estado,
ou cidade+país sem estado, ou cidade sem ambos. Brasil/Brazil/BR adicionam
countryCode=BR, sem tabela de países. A seleção normaliza acentos, espaços e
maiúsculas; prioriza nome exato, região administrativa e país/código, com ordem
da API como desempate estável. Rejeita nomes alheios e país incompatível com BR.
Prefixos compatíveis são aceitos conforme busca do serviço. Homônimos, grafias,
abreviações de estado e traduções podem continuar ambíguos; a localidade resolvida
é exibida, sem afirmar validação postal/endereço ou pedir geolocalização do usuário.
Não há busca adicional por endereço/CEP nem tabela global de países.

A previsão pede somente weather_code, temperature_2m_max/min e
precipitation_probability_max, timezone=auto e forecast_days=2. Usa o índice1
do calendário devolvido no fuso da localização, sem calcular amanhã no fuso do
navegador. Valida objeto, fuso, unidades, dois dias consecutivos, arrays,
números finitos, mínima ≤ máxima e percentual 0–100; chuva ausente/null é omitida.
A data civil é formatada em UTC ao meio-dia para não deslocar o dia por fuso.
Códigos WMO conhecidos têm rótulos PT-BR; código inteiro desconhecido tem texto
neutro. Textos externos são nós React, nunca HTML executável.

Somente cidade/estado/país entram na busca; somente coordenadas e opções fixas
entram na previsão. URLs usam URL/URLSearchParams. Ambas as chamadas são GET
com credentials=omit, referrerPolicy=no-referrer, cache=no-store e redirect=error;
sem nome, e-mail, endereço/CEP, mensagem, UUID, senha, cookies, tokens ou sessão.
Não há persistência de previsão, chave ou variável de ambiente nova.
Na revisão de configuração desta etapa, os dois placeholders legados de clima
foram removidos de `.env.example`: não tinham consumidores no código ou nos
validadores. Open-Meteo não exige credencial para o uso adotado. As URLs oficiais
são constantes privadas do módulo, sem versões públicas de variáveis de ambiente
ou configuração de host em runtime. `SESSION_TTL_SECONDS=3600` foi preservado
por pertencer à autenticação; a CSP continua restrita aos mesmos dois hosts e self.

Na base a640fa6, next.config.mjs não configurava CSP/headers; foi acrescentado
somente Content-Security-Policy: connect-src 'self'
https://geocoding-api.open-meteo.com https://api.open-meteo.com. Não há curingas
nem alteração em outra diretiva/header. Isso delimita conexões, sem afirmar uma
CSP completa para scripts/styles ou demais riscos fora desta etapa.

Confirmação/resumo aparecem imediatamente. Clima tem loading anunciado por
role=status/aria-live, sucesso, ausência de cidade sem requisição, localização
ausente, resposta inválida, falha HTTP/rede e botão de retry. AbortController
cancela ao desmontar ou tentar de novo; geração e signal descartam respostas
antigas, inclusive transporte que ignora abort. Prazo de 12s torna rede travada
recuperável. Cancelamento de desmontagem é silencioso porque a seção já saiu.
Falha externa nunca transforma cadastro confirmado em erro e não revela detalhes
internos. Atribuição legível abre Open-Meteo com noopener/noreferrer e aviso
acessível de nova aba. Sem console com dados ou respostas externas.

Unitários Node e browser Chromium interceptam o serviço; nenhuma execução depende
de disponibilidade real. O cadastro principal da suíte continua real em PostgreSQL
descartável; cenários isolados de clima interceptam POST 201 sem inserir usuários.
Aceite, hashes, resultados e limites na [evidência UI](harness/evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).
Autorrevisão sequencial; revisão humana e CI remoto permanecem pendentes.

## Estado atual — UI-001 (29/10/2026)

Cadastro/login/área protegida e logout integrados, com listagem administrativa.
A seção UI-001 ao final descreve decisões vigentes; descrições anteriores de telas
pendentes são históricas. Clima permanece pendente. Evidências e limites em
[UI-001](harness/evidence/ui.md).


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

## AUTHZ-001 — autorização e consulta, 29/10/2026

Decisão implementada, revisão humana pendente. README2,7,8,10,14–18.
[Contrato](harness/evidence/authorization-plan.md), [evidência](harness/evidence/authorization.md)
e [execução/contrato HTTP](../SOLUTION.md#consulta-e-autorização-authz-001).

server/users/policy.mjs contêm a regra pura: identidade UUID completa, admin
consulta/lista, user consulta somente o próprio UUID. handler.mjs autentica pela
função central existente, busca id/role novamente no banco e verifica política
antes da consulta-alvo em repository.mjs. Nenhuma autorização depende de UI ou
middleware; nenhuma confiança em identidade/papel de entrada. Papel desconhecido,
linha ausente ou identidade divergente falham fechados. Sessão mínima e TTL3600
absoluto sem renovação permanecem inalterados. Não há cache de papel administrativo.
Uma promoção/rebaixamento concorrente após a leitura do papel pode afetar a próxima
requisição; não se promete cancelamento de requisição já autorizada em andamento.

Escolha mínima para ambiguidade de caminhos do README: preservar POST /api/users
e acrescentar GET /api/users exclusivo admin, mais GET /api/users/[id] próprio/admin.
User recebe403 para qualquer alvo diferente inclusive malformado/inexistente,
antes de verificar existência. Admin recebe400 inválido/404 inexistente. Ambos401
sem sessão; falhas de banco/config503 genérico e diagnóstico fixo, sem dados pessoais.
Query desconhecida400 após autorização, body e cabeçalhos de identidade ignorados.
GET não muda estado, não habilita CORS entre origens; política de mesma origem
do navegador impede leitura por outro site. Respostas pessoais no-store.

SQL parametrizado e colunas explícitas, com allowlist adicional de projeção JSON:
id e campos do cadastro sem senha/confirmação. role/datas/material de sessão não
são necessários ao consumidor desta consulta. UUID identifica o recurso, não
prova autorização. O runtime mantêm exatamente os grants anteriores.
Lista usa limite fixo100 mais um registro para nextCursor, UUID ascendente/after.
Permite percorrer todos os registros com memória limitada; não oferece snapshot
estável sob inserções/exclusões concorrentes nem limite de bytes por campo textual
(o schema anterior permite textos livres). Sem migração/índice/dependência novos.

Promoção administrativa: CLI local em scripts/database/admin-user-cli.mjs,
ADMIN_DATABASE_URL separada, destino fixo local/identidade/superuser conferidos;
função compartilhada transacional em admin-user.mjs. SELECT id FOR UPDATE e UPDATE
parametrizados, cardinalidade exatamente1; ausente/erro faz rollback. Sem seed padrão,
endpoint ou grant runtime. Superuser ? escolha conservadora compatével com
provisionamento administrativo local existente, não necessidade de executar app
com privilégio. Nenhum papel foi alterado no banco principal nesta rodada.

Revisão independente Backend somente leitura não encontrou IDOR/escalada/vazamento.
Lacuna de teste de falhas após autenticação foi corrigida: exceções em sessão, papel
e projeção verificadas separadamente. Resultado real Next+PostgreSQL40/40 e seis
casos controlados de autorização; não substituem revisão humana ou HTTPS/navegador
de produção. UI/página protegida/clima permanecem fora desta entrega.

## UI-001 — decisão de interface, 29/10/2026

O pedido UI-001 autoriza as telas antes pendentes. Rotas simples: `/` orienta,
`/cadastro` registra, `/login` autentica e `/area` consulta com proteção no servidor.
Reutilizamos React, Next e CSS; nenhuma biblioteca visual foi adicionada.
Validação compartilhada permanece a fonte dos limites e da normalização;
servidor é autoridade final. A senha segue intacta no login.

O resumo existe somente no estado do formulário após POST confirmado. Nenhum
UUID público, armazenamento Web ou parâmetro de URL recupera cadastro; reload
retorna ao formulário e o usuário precisa entrar para consultar seu registro.
Não há sessão automática e a previsão de amanhã segue para a próxima etapa.

A página protegida reutiliza autenticação central e consulta autorizada interna,
com projeção existente, sem HTTP servidor para Host arbitrário. Dados pessoais
não entram em cache compartilhado. Falhas de infraestrutura fecham o acesso.
O cliente revalida a sessão sem renovação e esconde conteúdo no ciclo de saída
para impedir que voltar ou expiração detectada reapresente dados autenticados.
Logout só navega após confirmação da API; falhas permitem nova tentativa.

Playwright `@playwright/test@1.64.1` (versão exata e lockfile) adiciona Chromium real
para UI, teclado, viewport e screenshots. Justificativa: os testes HTTP existentes
não executam React/navegação/layout. `test:ui` roda separadamente, não muda o
adaptador Node do Harness nem promete cobertura de browser em CI. A fixture
mantém API/páginas e adapta somente provider DB para destino descartável validado,
sem copiar credenciais locais ao Next. Evidência e limitações em
[UI-001](harness/evidence/ui.md); contrato em [plano](harness/evidence/ui-plan.md).

## UI-001-P1 — invalidação assíncrona e identidade institucional

Decisão29/10/2026: active de montagem não representa propriedade de operação.
A reprodução Chromium anterior mostrou200 real retido revelando dados depois de
pagehide sintético. Cada operação agora tem geração/controller/prazo8s; as antigas
não finalizam bloqueios novos ou alteram DOM/estado/navegação. Layout e contexto data
completo desativam closures antes da pintura, inclusive callbacks antigos de expiry.
Visibilidade/ciclo/logout invalidam; retorno pode iniciar consulta nova. Falhas
mantêm ocultação e oferecem recuperação explícita. Sessão/identidade conferidas
antes e depois da permissão; troca recarrega contexto no servidor. TTL3600 absoluto
sem renovação e autorização/projeção existentes preservados.

A checagem final reduz a janela de troca de identidade durante a permissão; não
cria notificação instantânea de revogação após a última resposta. APIs reautorizam
sempre, UI detecta por nova consulta/polling30s/eventos. Interceptações e limites
separados de reprodução nativa estão na [evidência P1](harness/evidence/ui-p1.md).

Identidade principal do site oficial Slomski, inspecionado em Chromium antes da
edição, foi aplicada via tokens CSS: preto/superfícies escuras/texto claro/amarelo.
Marca SVG oficial local, Space Grotesk e IBM Plex Mono WOFF2 locais via next/font/local
com OFL. Retirado next/font/google, eliminando fetch de fontes no build e runtime.
Sem lib visual/dependência nova. Grid decorativa discreta, sem animação/cópia de
comerciais ou estilos dos produtos. Contexto Imobilead secundário, Slomski como
desenvolvedor; footer externo com aviso acessível. Skip-link em linha própria ao
foco move para main#conteudo. Formulários/CSS reorganizados para leitura.

Testes P1 adicionam runner direcionado, transporte controlado que ignora aborto
mantendo HTTP real e harness React exclusivamente na cópia descartável Next.
Não são rotas de produção nem mudanças do contrato público. Cópia inclui public
para SVG; sem .env local. [Referência computada](harness/evidence/ui-reference/reference.json)
e [galeria final](harness/evidence/ui-captures/README.md). Revisão humana pendente.

## Documentação frontend consolidada — 29/10/2026

A entrada principal é [ui.md](harness/evidence/ui.md); o
[detalhe P1](harness/evidence/ui-p1.md) preserva reprodução/correção/regressões,
e o [relato inicial](harness/evidence/ui-initial-history.md) preserva a primeira
rodada. O roteiro operacional único está em SOLUTION.md. A galeria foi reduzida
a18 imagens finais, sem mudança de arquitetura/código funcional/identidade.
Esta organização não reaprova a correção assíncrona; contagens e rodadas estão
separadas no relatório principal e no inventário documental.

## Gate privado e lifecycle React — 29/10/2026

O fechamento do gate DOM é síncrono, sem flushSync. O atributo hidden tem valor
inicial constante no JSX/SSR; React não recebe um hidden=false de render antigo.
Somente a operação atual, ativa, visível e revalidada antes/depois da permissão
pode abrir o gate por ref. O estado visible serve à apresentação. Mantidos layout
cleanup, gerações, abortos, prazos, identidade e logout; não há novo adiamento.
Diagnósticos passam a ser conferidos nas suítes Chromium, com contadores
sanitizados e teste diferencial de mutação externa antes da hidratação.
Sem supressão de hidratação ou mudança de SSR. Detalhes em
[UI-001](harness/evidence/ui.md#correção-funcional-react-e-hidratação--29102026).

## Apresentação administrativa — 30/10/2026

A área usa o papel já autorizado pelo servidor para distinguir Meu cadastro de
Painel administrativo. A lista mantém a semântica de todos os usuários e identifica
somente id === own.id; não consulta nem expõe papéis alheios. Duplicação removida
no JSX, sem filtrar registros. hasAfter deriva do cursor já validado e controla
somente o retorno à primeira página; nextCursor controla avanço. CEP ganha hífen
apenas no componente de apresentação compartilhado.

O layout raiz permanece estático e sem consulta redundante de sessão. Não recebe
o snapshot de /area; ocultar links de cadastro/login exigiria ampliar coordenação
de estado/rotas. A alternativa autorizada foi preservar a navegação atual.
Decisões e verificações em [UI](harness/evidence/ui.md#refinamento-administrativo--30102026).
Sem alteração de contratos API, banco, autorização ou efeitos de segurança.

## ADR-CONTAINER-001 — produção local isolada (30/10/2026)

Decisão: Node22.13.1 bookworm-slim oficial por digest, dependencies/build/runtime,
Next standalone + static/public e imagem distinta de ferramentas db-init. Runtime
não root, read-only/tmpfs, capacidades removidas, no-new-privileges e init para sinais.
PostgreSQL18.6 SCRAM e volume próprio; initializer provisiona somente estado vazio,
migra como imobilead_migrate, aplica grants como compose_admin e confere o contrato
como imobilead_app. Aplicação não recebe credenciais admin/migration. Privilégios
por coluna e DELETE users/cascade, sem DELETE sessions direto, permanecem intactos.

Guarda127.0.0.1 preservada tanto na URL quanto em host(inet_server_addr()). Compose
network_mode service:db coloca app/init/gateway no namespace do PostgreSQL; nunca
host network. Só HTTPS é publicado no db, dono da rede, em127.0.0.1. PG e Next
escutam apenas loopback. Nenhuma conexão ao PostgreSQL persistente do Windows.

Produção exige origem HTTPS e cookie Secure: gateway Caddy2.10.2 por digest, CA
interna efêmera, porta3443, admin API desativada, usuário1000, read-only/tmpfs e
cap_drop ALL. Remove-se a file capability do binário oficial no build, porque a
porta alta não a exige. Essa imagem adicional evita alterar a política de sessão.
A confiança no certificado local é explícita e precisa ser renovada após restart.
Compartilhar rede acopla ciclo de vida e impede escalar app independentemente;
ambiente local reproduzível, não arquitetura de cluster/produção pública.

Health app é liveness HTTP401, PG pg_isready, gateway HTTPS; init confere migrations
e ACLs reais antes de liberar app. Smoke autentica e testa persistência/roles via
HTTPS real; Chromium usa respostas REST sintéticas para clima. Imagens runtime
não incluem env/fixtures/Git; credenciais sintéticas são injetadas pelo Compose,
nunca ARG/ENV de build. Nenhum secret real consultado, nenhuma imagem publicada.

[Operação](../SOLUTION.md#compose-local-de-produção--container-001),
[digests, correções e resultados](harness/evidence/containerization.md).

## ADMIN-UI-002 — refinamento administrativo, 30/10/2026

Perfil próprio independente, usuários comuns e outros administradores separados; edição no mesmo espaço e abertura da confirmação no primeiro clique. [Pedido integral](prompts/2026-10-30-admin-profile-separation.txt) e [evidência](harness/evidence/admin-profile-separation.md).

Complementos integrais: [modal no primeiro clique](prompts/2026-10-30-admin-profile-complement-1.txt) e [edição no mesmo cartão e largura](prompts/2026-10-30-admin-profile-complement-2.txt).

## PROFILE-UI-003 — edição compartilhada, 30/10/2026

Uma seção e um profile-slot alternam cartão/editor para ambos os papéis; diferenças limitadas a títulos, selo e apresentação administrativa. Operações e contratos preservados. [Pedido integral](prompts/2026-10-30-shared-profile-edit.txt) e [evidência](harness/evidence/shared-profile-edit.md).

## LOGIN-UI-001 — layout do login, 30/10/2026

O main do login usa flex e o shell vertical compartilhado existente para considerar
as alturas naturais do cabeçalho e rodapé. Um único bloco de até520px mantém os
textos alinhados ao cartão. Padding fluido e limitado cria leve viés superior;
o conteúdo cresce no fluxo quando a altura disponível é pequena. Ações empilham
até480px, com alvos de toque de pelo menos48px. LoginForm e contratos de segurança
permanecem intactos. [Pedido](prompts/2026-10-30-login-refinement.txt) e
[evidência](harness/evidence/login-refinement.md). Revisão humana pendente.
## REG-UI-001 — contêiner do cadastro, 30/10/2026

Wrapper exclusivo do estado de formulário centraliza introdução/cartão em920px,
reutilizando shell, espaçamentos, campos e ações compartilhados. Grade com duas
colunas iguais acima720px; uma coluna abaixo/igual720px, botão total até640px.
Fluxo vertical natural e rodapé compartilhado preservados. Sucesso/resumo/clima
permanecem fora do wrapper. Nenhuma alteração nos contratos funcionais.
[Pedido](prompts/2026-10-30-registration-refinement.txt) e
[evidência](harness/evidence/registration-refinement.md). Revisão humana pendente.
## REG-ESSENTIAL-001 — schemas Zod e essenciais, 30/10/2026

Zod4.6.7, antes somente transitivo dev do ESLint, passa a direto runtime.
shared/schemas.mjs centraliza registrationSchema/profilePatchSchema e textos
comuns strict. Wrappers usados por UI/API convertem safeParse em códigos públicos
controlados; nenhuma issue/input/stack é retornada. Regras manuais concorrentes
removidas. Nome/cidade/estado/país obrigatórios com trim; PATCH omitido preservado,
endereço/CEP/mensagem opcionais. EmailASCII/limites, senha8–35/confirm/hash,
transação/versão/auth/layout/clima preservados. Refinamentos when agregam erros
independentes apesar de outro tipo inválido. Original item3 exige validação
cliente/servidor sem mencionar Zod nominalmente; biblioteca foi pedido adicional.

Migration aditiva3, preflight0 incompatíveis, aplicada por autorização explícita
somente local; quatro NOTNULL/CHECKnonblank, sem reescrever registros. README/CI
ficam para outra rodada; fixture/count do smoke Compose mantidos por autorização,
sem nova execução de containers. [Decisão, auditoria e verificações](harness/evidence/required-profile-fields.md).
