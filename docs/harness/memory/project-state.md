# Estado do projeto

## REG-001-E1 — correção de comprimento de e-mail, 29/10/2026

Atualização vigente sobre REG-001 abaixo. Os dois exemplos do pedido foram
reproduzidos antes da edição: domínio com label de 64 e local de 65 retornavam
ok:true; achado novo, não coberto pela revisão anterior. Agora exige local <=64,
label <=63 e endereço normalizado <=254 bytes, mantendo ASCII/normalização/sintaxe
e INVALID_EMAIL. ASCII implica igualdade de caracteres e bytes; fonte RFC 5321
§4.5.3.1 e RFC 1035 §2.3.4. Sem DNS/envio/prova de posse ou mudança no banco.
23 arquivos pendentes anteriores foram preservados em snapshot; diff E1 compara
essa base e exclui REG-001 anterior. Resultados atuais e limpeza na
[evidência E1](../evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026).
Tarefa delimitada sem delegação adicional, autorrevisão sequencial e revisão
humana pendente. Sem commit/push/publicação. Próxima etapa será login/sessão,
não iniciada; autorização/GET/logout/telas/clima permanecem pendentes.
QA E1: npm test 27 aprovações (inclui launcher dos 8 testes servidor), servidor
8/8 explícito, integração HTTP/PG 24 aprovações/zero skips, limpeza confirmada e
metadados/ACLs protegidos iguais. Lint/typecheck/build/doctor/validate/verify --product
e diff --check aprovados; Harness parcial. Audit/CI remoto/HTTP produção/revisão
independente adicional não executados. Diff exclusivo E1 no caminho da evidência.

## REG-001 — cadastro API implementado, 29/10/2026

Base main/835537da073c26c89ea546be73e41d1a41085472, árvore limpa no início.
Fase atual autorizada: cadastro pela API. POST /api/users, validação compartilhada
browser-safe, Argon2id, SQL parametrizado/default user, conflito UNIQUE, projeção id,
origem/JSON/corpo/prazo/quota/concorrência implementados, sem sessão automática.
Nenhum schema/grant/runtime principal/Harness/CI alterado. APP_ORIGIN adicionada
ao exemplo; obrigatória em produção. @node-rs/argon2@2.2.2 pinado/lock atualizado.

24 aprovações no npm test, incluindo launcher de oito testes servidor, sem skips;
22 aprovações em cada uma de três execuções PostgreSQL+Next HTTP locais reais.
Limpeza confirmada por catálogo, zero recursos próprios, metadados/ACLs protegidos
iguais; nenhum SQL mutável em imobilead. Build/audit e doctor/validate/verify --product
passaram, assim como diff --check; Harness parcial, sem avaliação de prontidão. Ver fechamento
Harness/diff e falhas intermediárias na [evidência REG-001](../evidence/registration.md).
Revisão Backend independente com dois P2 de e-mail corrigidos/regredidos;
seguimento sem achados pendentes. Revisão humana pendente.

CI aprovado para 835537d conforme usuário, sem confirmação remota pelo agente;
integração local não é cobertura do CI. HTTP real em Next dev/fixture de provider
descartável; não flexibiliza nem comprova conexão HTTP no banco principal.
Limitador local global não coordena instâncias, quota compartilhada pode ser
esgotada; 409 permite inferência de cadastro. Detalhes na arquitetura REG-001.

Sem commit/push/publicação/clima/banco remoto. Próxima etapa sugerida, mediante
autorização: login/sessão, depois consulta autorizada/logout; UI/clima pendentes.
Atualizações anteriores abaixo são históricas e não bloqueiam esta autorização.

## Atualização DB-001-P1 — privilégios efetivos, 29/10/2026

Checker antigo reproduzido aceitando UPDATE(role) adicional somente no
descartável; origem da revisão estática do diff, sem grant indevido demonstrado
em imobilead. Checagem agora verifica contrato fixo de tabelas/colunas/PUBLIC,
USAGE necessário e histórico; preserva guardas administrativas, falha por
ausência/NULL/erro e não aplica GRANT/REVOKE automático.

16 offline e 16 aprovações integração PostgreSQL real (15 subtestes+principal),
lint/typecheck/build passaram. db:check de leitura em imobilead passou sem ajustes.
Revisão independente concluída com correção de USAGE e seguimento sem novos
achados; falha intermediária de restauração do teste registrada na evidência.
Limpeza confirmada, zero bancos/papéis descartáveis remanescentes; metadados/ACLs
de imobilead preservados. Sem novas migrations, dependências, CI, funcionalidades
ou commits. [Evidência e limites](../evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).
Não invalida testes anteriores nem conclui autorização da API/segurança exaustiva.
Revisão humana e próximas funcionalidades seguem pendentes.

QA P1: doctor/validate/verify --product e diff --check passaram; agregador
comprovou 16 offline, integração e build executados separadamente. Diff exclusivo
da rodada em C:\Users\thiag\AppData\Local\Temp\db-001-permissions-review.diff,
comparado à cópia prévia, preservando as alterações anteriores do checkout.

## Atualização DB-001-I1 — integração real, 29/10/2026

Autorização descartável explícita recebida. Runner revisado e preflight local
READ ONLY aprovado. O agente executou `npm run test:db:integration` uma vez:
código 0, 1 teste aprovado, zero falhas/skips, PostgreSQL real. Passaram os casos
de migrations 1/0, e-mail único concorrente, nome/papel, sessões e restrições de
permissão previstos pelo runner. São casos específicos, não validação exaustiva
nem testes de autenticação/autorização/API/UI.

Limpeza confirmada: zero bancos/papéis descartáveis após execução, conforme
inventário inicial vazio. Sem limpeza adicional por prefixo. Metadados protegidos
de imobilead coincidiram antes/depois; sem SQL mutável direcionado a esse banco.
Sem alterações de implementação/configuração local ou commits. Essa integração
não está mais pendente no escopo executado. M1 abaixo permanece como relato manual
separado. [Evidência](../evidence/database.md#db-001-i1--integração-local-autorizada-29102026).
Revisão humana e funcionalidades futuras continuam pendentes; nenhuma próxima
etapa funcional iniciada ou autorizada por esta memória.

QA I1: doctor/validate/verify parcial do harness e diff --check passaram.
Integração real executada separadamente do agregador; build não executado.

## Atualização DB-001-M1 — relato manual, 29/10/2026

Prevalece sobre as pendências de execução dos checkpoints anteriores. Usuário
informou sucesso manual em db:inspect, db:migrate (applied:1), db:migrate
(applied:0), db:grant e db:check; este confirmou o destino exclusivo
127.0.0.1:5432/imobilead com imobilead_app. Registrar migrations, grants e conexão
runtime como **execução manual informada pelo usuário**, sem atribuição ao agente
ou confirmação independente nesta rodada. Nenhum desses comandos foi repetido.

Testes de integração em banco descartável seguem **pendentes**. Constraints,
unicidade concorrente, sessões e permissões não estão integralmente testadas por
essa sequência. Cadastro/auth/API seguem pendentes. Somente documentação/memória
atualizadas; sem funcionalidades ou commits. [Evidência](../evidence/database.md#db-001-m1--execução-manual-informada-pelo-usuário-29102026).

QA documental M1 pelo agente: doctor/validate/verify parcial do harness e
diff --check passaram; sem comandos de banco, testes de produto ou build.

## Atualização DB-001-D2 — 29/10/2026

Esta atualização prevalece sobre o checkpoint inicial abaixo. Corrigida
representação de address via host(inet_server_addr()) e igualdade exata com
expected.host, preservando banco/porta/usuário. 12 testes controlados, lint,
typecheck e diff --check passaram. Preflight READ ONLY com PostgreSQL real
confirmou identidade administrativa; uma execução de db:provision, código 0,
criou papéis imobilead_migrate/imobilead_app e schemas imobilead/imobilead_meta.
Leitura posterior confirmou atributos, ownership e direitos de schema esperados.
Não repetir provisionamento. Sem tabelas/migrations, definição de senhas, mudança
de .env.local ou testes descartáveis. Runtime e permissões de tabelas ainda não
verificados. Próxima ação somente mediante autorização específica para as etapas
pendentes. [Evidência](../evidence/database.md#db-001-d2--contrato-da-correção-autorizada-29102026).
Revisão humana pendente; sem commit/push.

QA final D2: doctor/validate/verify --product e diff --check passaram. Harness
parcial com 12 testes controlados comprovados; build não executado nesta correção.

## DB-001 — estado atual, 29/10/2026

- Base reconciliada: `main`, HEAD `2ee16c787dd77b23da02353d1667ab7568258941`, árvore
  limpa no início. Harness V1 commitado; registros abaixo de Harness sem commit
  são históricos. Nenhum commit/push/publicação desta etapa foi autorizado.
- Fase vigente: banco explicitamente autorizado pelo pedido DB-001. Preparados:
  PostgreSQL, pg/node-pg-migrate, schema users/sessions, provisionamento de papéis,
  grants mínimos, conexão servidor e testes offline/integração separados.
- Destino exclusivo: `127.0.0.1:5432/imobilead`. Não acessar Sillage, conexões
  remotas ou credenciais da extensão VS Code. Banco criado no DBeaver pelo usuário;
  conexão VS Code informada por ele não comprova conexão da aplicação.
- Decisões atuais: SQL explícito versionado; sessão opaca com digest SHA-256 de
  token de 32 bytes, uma hora absoluta e revogação; admin futuro por promoção
  administrativa explícita de usuário existente, sem conta/seed padrão.
- Runtime users somente SELECT/INSERT por colunas sem role; sessões DML. Sem
  ownership/DDL/memberships/poderes administrativos. Não alterar PUBLIC CONNECT/
  TEMP globais ou outros bancos; não se promete isolamento absoluto entre bancos.
- QA: testes offline 4/4, lint, typecheck, build, audit zero vulnerabilidades e
  harness validate/verify --product passaram conforme [evidência](../evidence/database.md).
  Harness é parcial; testes de configuração não comprovam SQL/permissões reais.
- Conexão da aplicação, inventário, provisionamento/migrations/permissões reais
  continuam sem comprovação. Credenciais locais ainda dependem do preenchimento
  pelo usuário; ele informou que faria isso nesta etapa. Não ler nem registrar
  valores. Verifique presença do arquivo sem ler segredos, execute CLI sanitizada
  e atualize evidências apenas se houver execução efetiva.
- Integração descartável preparada, não executada: exige credenciais locais e
  autorização compatível de banco separado. O destino exclusivo atual não permite
  executá-la automaticamente. Não reset/drop/truncate de imobilead.
- Produto permanece parcial: cadastro/API, login/cookies, autorização, logout,
  telas/clima e testes funcionais README ainda ausentes. CI não alterado/disparado.
- Revisão Backend inicial/final delimitada de leitura e revisão humana pendente.
  Consulte o resultado final e correções na evidência, sem inferir aprovação.
- Próxima ação: preencher credenciais localmente, conferir destino/inventário e
  concluir validação real da persistência. Depois propor etapa cadastro/auth, sem
  iniciá-la pela memória. [SOLUTION](../../../SOLUTION.md),
  [requisitos](../../REQUIREMENTS.md), [arquitetura](../../ARCHITECTURE.md).

## Histórico H-001/H-002

- Data: 28/10/2026. Origem: Prompt 5 e inspeção H-001.
- Fato verificado: branch inicial main, HEAD f1b6f437756eb3c86c141986818c34bb720ab9c8,
  árvore limpa antes desta etapa; alterações do Harness ainda sem commit.
- Concluído nesta etapa: ferramentas/scripts, seis skills, quatro definições,
  workflows e memória; resultados e limites em [demo](../evidence/demo.md).
- Produto: apenas esqueleto; cadastro, banco/migrations, auth/papéis, logout,
  telas/clima e testes funcionais continuam pendentes ([matriz](../../REQUIREMENTS.md)).
- Decisões abertas: banco/ORM, sessão, admin e runner; não escolhidos pelo Harness.
- Limitações: seleção nativa dos especialistas e disparo real dos hooks não
  demonstrados; confiança de hook e revisão humana ainda pendentes.
- Próxima ação: revisar o Harness e, após autorização funcional, produzir contrato
  conjunto Banco/Backend para README 1,4,5–10 e testes 14–15, alinhando Frontend.
- Não iniciar implementação funcional só por esta sugestão. Não repetir efeitos
  externos pela memória; reconciliar branch, HEAD e diff antes de agir.

Atualização H-002, 28/10/2026, origem Prompt 6: cinco correções implementadas e
revisadas independentemente; testes/verificações reais e falhas intermediárias
em [correções](../evidence/corrections.md). O estado H-001 acima é histórico.
Timeout de pai/descendente QA demonstrado em Windows. Hook real, seleção nativa
e retomada em sessão limpa seguem não demonstrados. Produto e revisão humana
permanecem pendentes; nenhuma escolha de banco/auth/runner da aplicação foi feita.
