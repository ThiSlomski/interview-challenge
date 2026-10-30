## PROFILE-001 — edição própria, 30/10/2026

Base main/5ff4fc5, árvore inicialmente limpa. Pedido atual autorizou somente
perfil: GET/PATCH /api/profile, e-mail imutável, campos de texto com regras
compartilhadas do cadastro e profile_version integer/default1 transportado como
número. Transação revalida sessão/papel após lock, compara versão/If-Match e
atualiza colunas fixas; rollback/release/TTL preservados. UI integra editor às
gerações/gate existentes, atualiza dados frescos e mantém draft no polling.

QA local final: Node61/61; HTTP/PG52/52; perfil UI31/31; UI existente49/49;
corridas56/56; zero falhas/skips. Lint/tipos/build e doctor/validate/verify
aprovados; Harness parcial/readiness not-assessed. Cleanup0 e metadados/ACLs
protegidos iguais. Falhas intermediárias/correções e revisão Backend independente
sem achados materiais na [evidência](../evidence/profile.md). Revisão humana e
CI remoto do diff pendentes. README/workflow/dependências/lock preservados.

Migration/grants preparados e testados apenas no descartável; banco persistente
não migrado/não recebeu grants. Antes de usar o novo runtime, seguir SOLUTION
para aplicar migration/grants/check e reiniciar, sem repetir provisionamento.
Nenhum commit/push/publicação. Dois commits funcionais planejados, primeiro
perfil; segundo exclusão somente user, nunca admin, com bloqueio/revalidação
ator/alvo e sem contagem/trava global. Exclusão/containerização não iniciadas;
não avançar para elas sem novo pedido. Histórico anterior abaixo preservado.

## CI-001 — pipeline obrigatório, 30/10/2026

Fase1 autorizada sobre main/b98c2f4042a014fc57bfdfdd8ecdfe742e9fb716, árvore
inicial limpa. quality/postgres-integration/security bloqueantes, Node22.13.1,
npm ci/cache, actions oficiais por SHA, PG18 efêmero e SCA high/critical.
Banco-base do serviço chamado imobilead apenas por contrato da guarda; nunca
conecta ao banco persistente local. Variáveis sintéticas restritas ao passo.
Produto/UI/schema/guardas/dependências/lock preservados; UI segue local.
Autorrevisão sequencial; revisão humana pendente; nenhum commit/push/publicação.

QA local atual: npm ci isolado aprovado após EPERM na raiz (binário em uso);
dependências recompostas sem encerrar processos. Lint/typecheck/build aprovados,
Node55/55, HTTP/PG40/40, zero falhas/skips, cleanup0 e metadados protegidos iguais.
Audit high: zero vulnerabilidades. YAML/bash aprovados; Harness validate/verify
aprovados, parcial/readiness not-assessed, Harness27/27 e Node55/55.
Fixture Harness inclui .github para validar os novos links. Docker Linux
também40/40 sem falhas/skips, npm ci Linux405 pacotes, PG18.6/SCRAM e cleanup0;
contêiner PostgreSQL próprio removido. Limpeza de diretórios temporários npm
bloqueada pela revisão automática, pendência separada do cleanup de banco.
Resultados finais e diff exclusivo
na [evidência](../evidence/ci.md). CI remoto da base confirmado verde
(run41009122441); novo diff não executado. Fase2 aguarda aprovação humana,
commit/push pelo usuário e três jobs verdes. Histórico abaixo preservado.

## Refinamento visual do clima — 30/10/2026

WeatherIcon local/declarativo, grupos WMO com fallback, decorativo e sem animação.
Composição pontual no sucesso; aviso ambíguo do resumo removido, sem alterar
resumo em memória, cadastro persistido, API/banco/auth ou módulo/ciclo REST/CSP.
Unitários26/26 e Harness Node55/55; lint/typecheck/build aprovados. UI completa,
hashes, documentos e diff incremental na [evidência](../evidence/ui.md#refinamento-visual-do-clima--30102026).
UI final43/43, zero falhas/skips/diagnósticos inesperados; persistência sintética
conferida, cleanup0/metadados principais iguais. Documentos/links/UTF-8/diff passaram.
Somente par03 atualizado;16 PNGs e3 referências preservados por hash.
Nomes antigos de configuração apenas como citação do usuário no prompt integral,
nenhum uso funcional. Autorrevisão; revisão humana pendente. Sem commit/push/
publicação; alterações anteriores preservadas. Histórico abaixo.

## Revisão da configuração de clima — 30/10/2026

Complemento autorizado: removidos os dois placeholders de clima do exemplo de
ambiente após busca confirmar ausência de consumidores/validadores. Open-Meteo
sem credencial neste uso, endpoints oficiais em constantes internas; nenhuma
variável pública. SESSION_TTL_SECONDS=3600 e CSP com self/dois hosts preservados.
SOLUTION/arquitetura/requisitos/tabela e registros atualizados. Verificações
atuais na [evidência](../evidence/ui.md#revisão-da-configuração-de-clima--30102026).
QA deste complemento: clima14/14, Harness parcial com Node43/43, lint/typecheck/
build/documentos/links/UTF-8/diff aprovados. Busca legada sem ocorrências.
Sem acesso ao banco/reexecução UI/commit/push; alterações anteriores preservadas.
Autorrevisão; revisão humana pendente. Histórico abaixo.

## WEATHER-001 — previsão no sucesso, 30/10/2026

Implementação explicitamente autorizada de README 13.c/d em main/a640fa6,
inicialmente limpo. Open-Meteo REST no navegador, geocodificação avaliada e
previsão do segundo dia no fuso local, sem chave/dependência/proxy/persistência.
Resumo em memória, cadastro/API/auth/banco/admin/revalidação preservados.
Somente connect-src adicionado aos dois hosts exatos e self; antes não havia CSP.
Estados acessíveis, validação JSON, cancelamento/geração/prazo/retry implementados.

QA local: clima unitário14/14, Node43/43 comprovados pelo Harness, servidor de
cadastro8/8, UI isolada28/28, UI completa43/43 e HTTP/PG40/40; zero falhas/skips
nos resultados finais. Falhas intermediárias dos testes e correção StrictMode
registradas na evidência. Lint/typecheck/build/documentos/Harness parcial passaram.
Fixtures locais autorizadas via TEST_ADMIN_DATABASE_URL: cleanup0 e metadados
principais preservados, sem leitura de cadastros reais/escrita em imobilead.
Par03 atualizado;16 capturas e3 referências preservadas por hash.

[Decisão](../../ARCHITECTURE.md#weather-001--previsão-no-navegador-30102026),
[evidência/hashes/diff](../evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).
Autorrevisão sequencial; revisão humana/CI remoto/HTTPS/múltiplos navegadores
pendentes. Serviço externo real não exercitado; testes interceptam Open-Meteo.
Sem commit/push/publicação; nenhuma próxima etapa iniciada. Histórico abaixo.

## Refinamento administrativo — 30/10/2026

UI-001-A autorizado sobre main/4725e00 inicialmente limpo. User mantém cadastro
próprio; admin recebe cabeçalho distinto e cadastro único na listagem, marcador
somente próprio, paginação contextual e CEP visual. Cabeçalho raiz preservado
pela ausência de estado compartilhado e para manter páginas públicas estáticas.
APIs/banco/sessão/autorização e efeitos de revalidação intactos. Evidência,
verificações, hashes e diffs na [UI canônica](../evidence/ui.md#refinamento-administrativo--30102026).
Sem commit/push/publicação; autorrevisão sequencial, revisão humana pendente.
Esta etapa substitui a pausa visual da rodada anterior; clima não foi iniciado.
QA local: UI31/31, concorrência50/50, HTTP/PG40/40, auth11/11, autorização6/6;
zero skips. Build/lint/typecheck/documentos/Harness parcial aprovados. Par06
atualizado;16 PNGs+3 referências preservados por hash; cleanup0 confirmado.

## Revalidação periódica estável — 30/10/2026

Correção funcional autorizada: intervalo30s usa fundo apenas para snapshot já
validado/visível e não vencido; não escreve hidden no sucesso. Montagem, retry,
foco/retorno/pageshow e troca de props permanecem restritivos. Falhas fecham;
sessão inicial/final, identidade/usuário, geração/abortos/logout/expiry preservados.
Concorrência50/50 e UI29/29, zero skips; lint/typecheck, doctor/validate e
verify --product parcial aprovados (29 Node). Ciclo válido: zero mutações hidden,
navegações/Document e alterações de foco/scroll/layout. UI completa sem erro
inesperado;1 preloadHint local separado.22 artefatos visuais preservados por hash.
Runners confirmaram cleanup0 e metadados/ACLs protegidos iguais. Sem continuação
visual/commit/push/publicação. Autorrevisão; revisão humana pendente.
[Evidência, limites e diffs](../evidence/ui.md#revalidação-periódica-estável--30102026).
Histórico anterior preservado abaixo.

## Correção funcional React e hidratação — 29/10/2026

Prioridade funcional concluída em Area.tsx: sem flushSync no lifecycle; gate DOM
fecha na mesma pilha, hidden constante impede reabertura por render antigo.
Gerações/abortos, sessão, identidade, expiração e logout preservados. Metadata
reutiliza a marca local como ícone, eliminando recurso404 encontrado pelo monitor.
Concorrência29/29 e UI29/29, sem skips; zero erros/avisos React, hidratação ou
pageerror inesperados. UI registrou1 preloadHint local de desempenho separado.
Perfil sem extensões/HTML sem cz-shortcut-listen; injeção externa reproduziu1
hydration warning esperado. Extensão do usuário não identificada.
Lint/typecheck, doctor/validate/verify parcial, links/âncoras/UTF-8/Markdown e
diff --check aprovados.18 PNGs, README e3 referências preservados por hash.
Fixtures limpas, metadados/ACLs originais iguais; revisão humana pendente.
Sem continuação visual/commit/push/publicação. [Causas, testes e diff](../evidence/ui.md#correção-funcional-react-e-hidratação--29102026).
Histórico anterior preservado abaixo.

## Organização dos registros de prompts — 29/10/2026

Rodada exclusivamente documental: textos integrais em docs/prompts/, índice
cronológico resumido em [AI_PROMPTS](../../AI_PROMPTS.md) e verificações na
[evidência](../evidence/prompt-organization.md). 24 registros anteriores
preservados, 17 blocos integrais idênticos, cinco arquivos reutilizados e nove
novos, incluindo o pedido atual. Prompts 1/4 só têm resumo; Prompt 1 sem data.
Doctor/validate documental, links/âncoras, UTF-8/Markdown e diff --check aprovados;
verify/suítes funcionais/navegador/banco/build não executados nesta rodada.
Implementação anterior preservada; fase funcional não mudou. Revisão humana
pendente. Diffs exclusivo/acumulado e limites na evidência; histórico abaixo.

## Ajuste visual vigente dos campos — 29/10/2026

Apenas CSS compartilhado de inputs/textarea: fundo/borda oficiais, cantos retos,
foco3px/offset3px, gradiente local e legibilidade de autofill. Ver detalhes e
limitações em [UI-001](../evidence/ui.md#ajuste-visual-dos-campos--29102026).
UI29/29 (13 cenários +15 SQL +principal),12 sondagens de foco sem deslocamento/corte
por painéis. Cadastro autofill nativo; login pseudoestado controlado, sem perfil salvo.
Seis capturas afetadas atualizadas,12 preservadas; referências oficiais inalteradas.
Sem mudanças funcionais/auth/banco/clima. Histórico abaixo preservado.
## Padronização de caminhos visuais — 29/10/2026

Pastas operacionais: [ui-captures](../evidence/ui-captures/README.md) e
[ui-reference](../evidence/ui-reference/reference.json). UI-001-P1 permanece como
identificador histórico da correção e dos testes. Nesta padronização não houve
browser/banco/build nem nova captura;22 arquivos movidos, conteúdo das18 imagens
e3 referências preservado por SHA-256. Somente README/links/gerador foram atualizados.
Resultados de execução abaixo pertencem às rodadas anteriores identificadas.
## Consolidação documental vigente — 29/10/2026

Entrada frontend: [ui.md](../evidence/ui.md). Detalhe histórico/técnico:
[ui-p1.md](../evidence/ui-p1.md). [Histórico inicial](../evidence/ui-initial-history.md),
[galeria final18 imagens](../evidence/ui-captures/README.md) e
[inventário da organização](../evidence/ui-organization.md).
SOLUTION contém um único roteiro vigente. Nesta organização: lint/typecheck e
uma execução test:ui28/28 sem skips; nomes finais/enquadramento administrativo,
sem alteração funcional/identidade. Corridas27/27, HTTP40/40, Node29/29 e build/audit
citados abaixo são resultados históricos P1, não reexecuções desta consolidação.
Revisão humana/clima/CI remoto/HTTPS continuam pendentes. Histórico abaixo preservado.

## UI-001-P1 — fechamento vigente, 29/10/2026

Corrida assíncrona reproduzida antes da edição no Chromium com resposta real
retida e pagehide sintético. Corrigida por operação/geração, AbortController,
invalidação no layout/contexto/ciclo de vida/logout, identidade antes/depois da
permissão, deadline8s e recuperação explícita. Sem renovar sessão ou alterar APIs.

Identidade institucional Slomski Solutions aplicada após inspeção do site oficial
em desktop/celular: paleta confirmada, SVG oficial e Space Grotesk/IBM Plex Mono
locais com OFL, sem dependências novas/hotlink. Footer acessível requerido e skip-link
sem sobrepor marca. Telas funcionais preservadas, clima fora desta rodada.

QA27/27 concorrência(11cenários), UI28/28(12cenários), Node29/29 e HTTP/PG40/40;
sem skips. Lint/typecheck/build passaram. Revisão independente fechou achados de
contexto/identidade/callback antigo; regressões com transporte que ignora abort e
harness React somente temporário. Revisão humana final pendente.
Recursos descartáveis limpos, metadados/ACLs protegidos iguais. Nenhuma leitura de
usuários/mutação em imobilead, remotos, Harness/CI/schema/grants, commit/push/publicação.
Snapshot Temp/ui-001-p1-before-Op3cBN preserva a base anterior; diffs P1/acumulado
em Temp/ui-001-p1.diff e ui-001.diff. [Evidência P1](../evidence/ui-p1.md),
[contrato](../evidence/ui-p1-plan.md), [capturas](../evidence/ui-captures/README.md).
Estado anterior UI-001 abaixo é histórico. Clima/CI do diff/HTTPS/revisão humana
continuam pendentes; nenhuma prontidão integral de produto declarada.

## UI-001 — estado vigente, 29/10/2026

Base real main/4c5c6fc7986dccaf88887fa5b1587853fc10c6b1, árvore limpa inicial.
CI-base aprovado conforme usuário; nenhum CI remoto do diff disparado/consultado.
Pedido UI-001 autorizou /, /cadastro, /login e /area; supera pendências históricas.
Cadastro shared/feedback acessível/resumo só memória, login cookie HttpOnly,
proteção servidor com auth/policy/projeção existentes, user próprio/admin100+cursor,
logout confirmado e gate contra restauração de cache implementados. Clima pendente.
Senha intacta, sem armazenamento Web/query string. Falha de infraestrutura fecha acesso.

12 cenários Chromium reais aprovados; runner UI28/28 (12 UI,15 SQL e principal),
zero skips. Revogação com dados visíveis detectada no polling30s, expiry/refresh,
voltar/avançar/cliente e regressão cache exercitados. Screenshots sintéticas9.
Node29/29; launchers incluem registro8/auth11/autorização6. Lint/typecheck/build,
audit zero vulnerabilidades, doctor/validate/verify --product e diff --check aprovados.
Harness parcial/readiness not-assessed; browser/build executados separadamente.
Revisão independente encontrou snapshot cliente, corrigido e regredido; seguimento
sem novo risco material no escopo. Revisão humana pendente.

Cada rodada confirmou0 recursos DB próprios, metadados/ACLs protegidos iguais,
Next/Chromium/fixtures encerrados. Nenhuma leitura de dados pessoais existentes
ou DML em imobilead, banco remoto, mudança de APIs/migrations/grants, commit/push
ou publicação. Playwright1.64.1 exato/lockfile; sem biblioteca visual nova.
Responsabilidades/consolidação e falhas intermediárias na evidência.
[Plano](../evidence/ui-plan.md), [evidência](../evidence/ui.md),
[execução](../../../SOLUTION.md), [requisitos](../../REQUIREMENTS.md).
Próximo requisito: clima por REST no navegador, não autorizado/iniciado nesta rodada.
HTTPS/produção, CI do diff, múltiplos navegadores e revisão humana não comprovados.
Histórico abaixo preservado.

## AUTHZ-001 — estado vigente, 29/10/2026

Base real main/012f9caa2ef9513feca0b9bbca64b87dbf312eb7, árvore limpa inicial;
CI-base aprovado conforme usuário, nenhum CI remoto desta rodada. Pedido atual
autoriza API/consulta e procedimento admin, supera pendências AUTH-001 abaixo.
GET /api/users admin paginado100/cursor UUID; GET /api/users/[id] próprio/admin.
401 sem sessão;403 sem permissão antes da consulta-alvo;admin UUID inválido400,
ausente404. Papel fresco no banco, projeção explícita/no-store; POST público intacto.
Procedimento db:promote-admin por UUID com ADMIN_DATABASE_URL local/superuser,
transação exatamente1; testado somente descartável, não executado em imobilead.
[Plano](../evidence/authorization-plan.md) e [evidência](../evidence/authorization.md).
Revisão Backend independente sem achados de segurança; lacuna de falhas por fase
corrigida/testada. Revisão humana pendente. Testes offline29 (launchers incluem
registro8/auth11/autorização6), autorização explícita6/6; Next+PG real40/40 sem skips.
Limpeza0 recursos, metadados/ACLs protegidos iguais; processos/fixtures encerrados.
Lint/typecheck/build/audit/doctor/validate/verify --product e diff --check aprovados;
Harness parcial/readiness not-assessed, conforme evidência.
Sem mudança de schema/grants principais/dependências/Harness/CI, DML principal,
remotos, commit/push/publicação. Telas de cadastro/login, página protegida e clima
permanecem pendentes; não iniciar próxima etapa sem pedido. HTTPS/navegador de
produção e integração em CI não exercitados. Histórico abaixo preservado.

﻿# Checkpoint para retomada

## AUTH-001 — estado vigente, 29/10/2026

Base real main/1c96acb; DB-001 e REG-001 versionados. CI-base aprovado conforme
usuário; nenhum CI remoto do diff. Alteração prévia de AI_PROMPTS preservada.
Pedido atual autorizou login/sessão/logout e supera restrições históricas abaixo.
Implementados POST /api/auth/login, GET /api/auth/session, POST /api/auth/logout,
função central servidor, cookie/digest, TTL absoluto3600 sem renovação e CSRF/abuso.
[Plano](../evidence/authentication-plan.md) e [evidência](../evidence/authentication.md)
registram falha intermediária HTTP, correção P2 e revisão independente sem achados
pendentes; revisão humana pendente. QA: npm test28 pass (launchers cadastro8/auth11),
auth explícito11/11, integração final Next+PG33/33 sem skips, limpeza0 recursos e
metadados/ACLs protegidos iguais. Build/audit/doctor/validate/verify --product e
lint/typecheck/diff --check passaram, Harness parcial/readiness not-assessed.
Navegador/HTTPS produção não exercitados. Limites locais exigem controles produção.
Sem mudança de schema/grants principais/Harness/CI/dependências, DML principal,
remotos ou commit/push/publicação. Roles/listagem403/página protegida/telas/clima
pendentes. Não iniciar etapa nova nem repetir mutações por memória.
## REG-001-E1 — estado vigente, 29/10/2026

Comece por Git e project-state; a árvore já tinha os 23 arquivos REG-001 pendentes
no início da correção E1. Snapshot temporário preservado, sem index/commit. E1
corrige omissão de comprimento reproduzida nesta rodada: local <=64, cada label
<=63, endereço normalizado <=254 bytes, após ASCII, mesmo erro de campo. Sintaxe
e normalização preservadas; achado não coberto pela revisão independente anterior.
[Contrato](../evidence/registration-plan.md#reg-001-e1--correção-de-comprimento-29102026)
e [evidência atual](../evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026)
registram reprodução, fontes oficiais, testes, limpeza e fechamento. Instância HTTP
separada verifica os seis casos de comprimento sem esgotar quota do cenário padrão;
controle de abuso e caso 429 preservados. Banco principal, grants/migrations,
dependências, Harness e CI inalterados nesta correção. Próxima etapa login/sessão
não iniciada; sem commit/push/publicação. Revisão humana pendente.
Fechamento E1: 27 aprovações npm test, oito servidor explícitos, 24 na integração
real sem skips; limpeza/catalogação confirmadas. Lint/typecheck/build e Harness
incluindo verify --product passaram; diff --check aprovado. Não iniciar a próxima
etapa só por este checkpoint nem repetir efeitos mutáveis pela memória.

## DB-001-P1 — divergências de privilégios detectadas, 29/10/2026

Origem: revisão estática do diff compartilhado. Reprodução PostgreSQL descartável
confirmou checker antigo aceitando UPDATE(role) adicional; não foi demonstrado
grant indevido em imobilead. Checker ampliado para ACLs efetivas fixas users/
sessions/history, inclusive tabela/coluna/PUBLIC, USAGE necessário e falha fechada
por ausência/NULL/erro. Somente diagnostica; nenhum reparo automático.

Final: 16 testes offline e 16 aprovações Node de integração real (15 subtestes+
principal), lint/typecheck/build passaram. db:check leitura em imobilead com
imobilead_app passou; nenhum grant/migration/provisionamento repetido nesse banco.
Falha intermediária de restauração INSERT do teste foi diagnosticada antes de
correção; revisão independente apontou USAGE, corrigido e confirmado em seguimento.
Cleanup confirmado após execuções: zero bancos/papéis descartáveis remanescentes,
metadados/ACLs protegidos de imobilead inalterados. Preservar histórico anterior.
[Evidência, comandos e limites](../evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).
Não implica auth/API prontas ou segurança exaustiva. Revisão humana pendente;
nenhuma próxima funcionalidade iniciada, sem commit/push.

## DB-001-I1 — integração PostgreSQL real aprovada, 29/10/2026

Usuário autorizou banco/papéis exclusivos descartáveis em 127.0.0.1:5432.
Após revisão das proteções e preflight READ ONLY, o agente executou uma vez
`npm run test:db:integration`: código 0, 1 teste aprovado, zero falhas/skips.
Asserções de migrations inicial/repetida, e-mail concorrente, nome/papel,
sessões/FK/tempos e permissões previstas pelo runner passaram em PostgreSQL real.
Esta execução do agente é distinta da sequência manual informada em M1 abaixo.

Limpeza do próprio runner concluída: catálogo antes/depois sem bancos/papéis
descartáveis remanescentes; nenhuma limpeza adicional por prefixo. Metadados
de schemas/relações/ACLs e atributos dos papéis fixos de imobilead permaneceram
iguais; SQL mutável do runner limitado ao banco/papéis exclusivos. Sem leitura
de valores pessoais ou modificação de imobilead, remotos, implementação ou commits.

A integração deixa de estar pendente para os casos executados, sem afirmar
validação exaustiva de constraints/permissões ou auth/API/UI. Próxima tarefa
funcional depende de autorização específica; não repetir ações por memória.
[Comando, revisão, resultados e limpeza](../evidence/database.md#db-001-i1--integração-local-autorizada-29102026).
Revisão humana pendente; registros abaixo são históricos.

## DB-001-M1 — atualização manual informada, 29/10/2026

O usuário informou execução manual bem-sucedida, nesta ordem: db:inspect;
db:migrate (applied:1); db:migrate (applied:0); db:grant; db:check, confirmando
127.0.0.1:5432/imobilead com imobilead_app. Atribuição exclusiva ao relato do
usuário, sem repetição ou confirmação independente pelo agente nesta rodada.
Migrations/grants/conexão runtime passam a constar como execução manual informada,
superando as pendências correspondentes de D2 abaixo, mantido como histórico.

Integração em banco descartável continua pendente. Essa sequência não comprova
constraints, concorrência, sessões e permissões integralmente testadas, nem
funcionalidades concluídas. Não repetir comandos pela memória; a próxima tarefa
depende de autorização específica. Sem implementação ou commits nesta rodada.
[Evidência e limites](../evidence/database.md#db-001-m1--execução-manual-informada-pelo-usuário-29102026).

## DB-001-D2 — correção e provisionamento confirmados, 29/10/2026

`host(inet_server_addr()) AS address` e igualdade com `expected.host` aplicados;
banco/porta/usuário preservados. 12 testes controlados, lint/typecheck/diff passaram.
Preflight PostgreSQL READ ONLY aprovou identidade administrativa integral no
destino exclusivo. `npm run db:provision` executado uma vez, código 0; catálogo
posterior confirmou papéis imobilead_migrate/imobilead_app e schemas
imobilead/imobilead_meta, ownership e direitos de schema esperados, sem tabelas.
Não repetir provisionamento. Nenhuma senha foi definida/redefinida e `.env.local`
não foi alterado; não foram executadas migrations ou testes descartáveis.
Próximo passo depende de autorização específica: senhas locais dos novos papéis
e posterior migrations/grants/check da aplicação. Não iniciá-lo pela memória.
[Resultados e limites](../evidence/database.md#db-001-d2--contrato-da-correção-autorizada-29102026).
Autorrevisão desta correção; revisão humana pendente. Registros abaixo históricos.

Atualização DB-001-D1, 29/10/2026: usuário relatou falha de identidade em
`db:provision`. Diagnóstico somente de leitura confirmou divergência apenas em
`address`: cast inet para text inclui máscara; correção para `host(...)` e
igualdade exata com host está proposta, ainda não aplicada. Não repetir o
provisionamento antes da correção autorizada. `.env.local` agora existe; conexão
administrativa no destino exigido foi verificada sem expor valores. Catálogo
atual sem papéis/schemas/relações previstos pelo provisionamento. A conexão da
aplicação continua sem comprovação. Ver [diagnóstico e QA](../evidence/database.md#db-001-d1--diagnóstico-de-identidade-29102026).
Doctor/validate/verify --product e diff --check passaram nesta rodada, escopo
parcial. Nenhuma alteração de objetos ou permissões e nenhuma correção funcional.

## DB-001 — checkpoint atual, 29/10/2026

Base real reconciliada: main, HEAD 2ee16c787dd77b23da02353d1667ab7568258941,
árvore limpa no início; alterações desta etapa ainda sem commit. O pedido atual
supera a restrição temporária de “somente Harness” dos checkpoints abaixo.

Leia [estado](project-state.md), [evidência DB-001](../evidence/database.md) e
[SOLUTION](../../../SOLUTION.md), depois confira Git. Implementados em arquivos:
pg/node-pg-migrate, migration users/sessions, papéis separados/grants por coluna,
configuração servidor, CLI sanitizada e testes. Backend acordou sessões antes da
tabela e fez revisão independente delimitada; detalhes/correções na evidência.
Revisão humana permanece pendente.

Usar exclusivamente 127.0.0.1:5432/imobilead. Não acessar conexões remotas/Sillage
nem extrair credenciais salvas no VS Code. O usuário criou imobilead no DBeaver e
informou conexão na extensão; isso não comprova a aplicação. Inspeção delimitada
do arquivo HBA do serviço encontrou zero trust/includes, sem mudar autenticação;
a leitura não prova configuração carregada no processo. Não recriar trust.

Próxima ação: credenciais locais em `.env.local` ignorado, preservando existente,
sem ler/exibir valores ou pedi-los no chat. Usuário informou que preencheria nesta
etapa; só confirmar presença/disponibilidade e usar os comandos sanitizados.
Provisionamento ADMIN -> senhas de papéis por psql \password -> MIGRATION/DATABASE
URLs -> db:inspect -> db:migrate duas vezes -> db:grant -> db:check. Conferir
identidade e inventário efetivos antes de mutação. Em colisão, parar e relatar,
sem reset/drop/truncate do banco existente. Não repetir operações pela memória.

Testes offline 4/4, lint/typecheck/build/audit e harness passaram conforme evidência;
migrations/permissões reais ainda não comprovadas. Integração preparada usa banco
separado descartável e exige autorização de destino compatível; não executá-la sob
a restrição exclusiva atual. Cluster efêmero foi cancelado antes de implementação.

Próxima etapa funcional recomendada após fechar essa lacuna: cadastro/auth com
allowlist de entrada/saída, hashing Argon2id definido/testado, sessões e controle
user/admin no servidor. Não iniciar telas/endpoints/login/logout/clima pela
sugestão deste checkpoint. Sem CI, commit/push/publicação/deploy nesta etapa.

## Checkpoints históricos do Harness

## H-002 — estado atual, 28/10/2026

Origem: Prompt 6; correções dos cinco achados. Revisão humana pendente.
Branch main, revisão-base f1b6f437756eb3c86c141986818c34bb720ab9c8, sem commit novo.
O início desta tarefa já tinha os artefatos H-001 e o nome de prompt ajustado pelo
usuário; preservar essas alterações. Novas correções ficam em scripts/harness/,
docs/harness/ e log de prompts; não há mudança funcional/dependência/CI.

Confira [evidência H-002](../evidence/corrections.md) e o resultado atual de Git.
O checkpoint executável agora distingue clean/dirty de erro e não gera proposta
válida se uma consulta Git falhar. Revisão independente concluída com ajuste de
placeholder; rodada final deve ser consultada na evidência, nunca inferida daqui.
Próxima ação: revisar resultados do Harness; depois planejar contrato funcional
somente quando autorizado. Hook real, seleção nativa e retomada limpa continuam
não demonstrados; [procedimentos](../validation-gaps.md). Timeout da árvore QA foi
demonstrado em Windows. Não repetir efeitos externos pela memória.

## H-001 — checkpoint histórico

28/10/2026 · origem H-001 / checkpoint explícito · status proposta consolidada
pelo orquestrador responsável por esta documentação; revisão humana pendente.

Branch main, revisão-base f1b6f437756eb3c86c141986818c34bb720ab9c8. Nenhum hash novo:
o Harness está sem commit. Alterações: docs/AI_PROMPTS.md e docs/ARCHITECTURE.md;
novos AGENTS.md, SOLUTION.md, .codex/, .agents/skills/, scripts/harness/,
docs/REQUIREMENTS.md, docs/HARNESS.md, docs/harness/ e docs/prompts/.

Tarefa atual: H-001, construção/verificação do Harness. Confira resultados reais
em [demo](../evidence/demo.md), decisões em [índice](decisions.md) e lacunas no
[estado](project-state.md). Não usar este resumo como comprovação de testes.

Retomada: `git status --short`, `git branch --show-current`, `git rev-parse HEAD`;
compare com o acima e execute `node scripts/harness/harness.mjs doctor`.
Carregue `resume-project` e leia só o necessário. Divergência implica reconciliar,
sem reset/clean nem repetição automática de ações com efeitos externos.

Próximo passo recomendado: revisão humana do Harness; depois contrato funcional
dos requisitos 1,4,5–10 e 14–15 mediante autorização. Nenhuma publicação, mudança
de confiança ou implementação funcional foi autorizada pelo checkpoint.
# REG-001 — retomada, 29/10/2026

Comece por Git e estado atual. Base desta rodada main/835537d, árvore limpa no
início; implementação e documentos desta rodada sem commit. CI do commit-base
aprovado conforme relato do usuário, sem novo CI remoto. Cadastro POST /api/users
concluído no escopo autorizado: validação/hash/SQL/user/erros/origem/corpo/abuso,
sem sessão. Runtime continua exclusivamente imobilead_app no destino original.

Leia [evidência REG-001](../evidence/registration.md),
[plano](../evidence/registration-plan.md), [SOLUTION](../../../SOLUTION.md) e
arquitetura REG-001 conforme necessário. Testes controlados, HTTP Next dev com
provider de fixture e PostgreSQL real distinguidos; limpeza confirmada e banco
principal preservado. Dois P2 de e-mail da revisão independente corrigidos e
seguimento concluído. Revisão humana pendente; consulte fechamento para Harness.

Não repetir migrations/provisionamento/grants/testes mutáveis pela memória.
Quota é global por processo, 409 revela conflito e não há verificação de e-mail;
APP_ORIGIN precisa configuração exata em produção. Próximo escopo depende de
autorização: login/sessão e depois autorização/GET/logout. Telas e clima ausentes.
Sem Git mutável/publicação/remotos nesta rodada. Checkpoints abaixo históricos.

QA complementar UI-001: integração HTTP/PostgreSQL40/40 sem skips em execução
separada; browser UI28/28. Cleanup confirmado em ambas e metadados protegidos iguais.

QA P1 final: doctor/validate/verify --product e audit(0 vulnerabilidades) passaram.
Harness parcial/readiness not-assessed; browser/build/SQL separados. Limpeza e
inventário de processos confirmados; diffs exclusivos preservam UI-001 anterior.
