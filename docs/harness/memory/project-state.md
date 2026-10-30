## ADMIN-UI-002 — perfil administrativo e complementos, 30/10/2026

Base main/d32c6d0 inicialmente limpa. Próprio perfil de loadArea.own no topo,
sem dependência do cursor; GET próprio na revalidação. Contas user e outros admins
separados visualmente, sem alteração de API/consulta/cursor. Editor substitui
card no mesmo slot/largura, sem duplicação; foco/draft/versão preservados.
Clique perdido reproduzido na corrida window.focus/pointerdown/click; admin
visível usa revalidação de fundo, demais gates/identidade/TTL mantidos. Diálogo
ignora continuação de duplo clique nativa; nenhuma exclusão ao abrir.
UI admin41/41, perfil34/34, UI51/51, corridas58/58, HTTP/PG65/65; zero skips/falhas
finais, cleanup0/metadados protegidos iguais. Lint/tipos/build/doctor/validate/
verify --product aprovados; Harness62/62, parcial/readiness:not-assessed.
Somente pares06/10 atualizados;16 PNGs+3 referências iguais por SHA256.
Autorrevisão sequencial; humana e CI remoto pendentes. Sem commit/push/deploy,
sem uso de contas persistentes ou alterações em banco/grants/auth/API/rodapé.
[Evidência, falhas, resultados e diff](../evidence/admin-profile-separation.md).

## HOME-UI-001-F1 — home e rodapé compartilhado, 30/10/2026

Rodapé único do RootLayout reformulado e shell vertical compartilhado, com marca
local, slogan/copyright exatos e2026 estático. Três áreas >768px; empilha <=768px.
Hero/painel e autoria prévia da home preservados; sem alterações funcionais.
Chromium dev/produção, público/auth, zoom200% e páginas curtas/longas:64/64;
UI51/51/admin36/36. Console/hidratação sem erros inesperados. Lint/tipos/build e
Harness aprovados (Node62/62,partial:true/readiness:not-assessed).20 PNGs afetados
atualizados, três referências iguais por hash. Cleanup0/metadados protegidos iguais.
[Evidência e diffs](../evidence/home-footer-refinement.md); snapshot incremental
preserva os17 arquivos anteriores e crédito Thiago Slomski já existente.
Sem commit/push/deploy; autorrevisão, humana/CI remoto pendentes. Restrição anterior
de shell/rodapé exclusivo da home superada somente por este complemento.

## HOME-UI-001 — composição da home, 30/10/2026

Refinamento visual autorizado concluído, base limpa main/b231c0c. Produto restrito
a app/page.tsx e regras da home em app/globals.css: card redundante substituído
por painel estático, duas colunas >=1100px e uma abaixo, rodapé ao final da
viewport sem altura fixa. Nenhum fluxo funcional ou outra página alterado.
Chromium dev/produção e sessões descartáveis, zoom real/fonte200%/teclado:
58/58; regressão UI51/51; lint/tipos/build/doctor/validate/verify aprovados.
Home console/pageerror0; Harness Node62/62, parcial/readiness:not-assessed.
Capturas01-home quatro atualizadas;16 PNGs/3 referências iguais por SHA256.
Cleanup0/metadados protegidos iguais. [Evidência](../evidence/home-refinement.md)
e [manifesto](../evidence/home-refinement-hashes.json). Sem commit/push/deploy;
autorrevisão sequencial, humana/CI remoto do diff pendentes.

## Recuperação documental dos prompts 1 e 4 — 30/10/2026

Mensagens originais de 28/10/2026 recuperadas das transcrições reais do Codex;
uma correspondência por prompt em 40 sessões pesquisadas de 28–30/10, com
respostas seguintes compatíveis. [Originais, datas e hashes](../../prompts/2026-10-28-estabilizacao.md#registro-1)
e [índice](../../AI_PROMPTS.md). Resumos, decisões e âncoras preservados.
As antigas observações de texto/data ausente são históricas, superadas somente
para esses dois prompts. Sem reconstrução, alteração funcional, banco, CI,
Docker, commit ou push. Autorrevisão sequencial; revisão humana pendente.
QA: igualdade literal/SHA-256 com origem e preservação dos resumos/decisões e
blocos2/3 confirmadas; UTF-8/Markdown,191 links/87 âncoras,doctor/validate e
diff --check aprovados. Apenas quatro documentos; verify/testes funcionais não
executados nesta recuperação documental.

## CONTAINER-001 — 30/10/2026, estado vigente

Pedido atual autoriza containerização, superando restrições históricas desta etapa.
Base main/0c8e682 limpa. Dockerfile multi-stage Node22.13.1 por digest, standalone,
PostgreSQL18.6/SCRAM/volume e db-init idempotente migra→grant→check. Namespace
service:db preserva URL e identidade127.0.0.1; nunca usa banco Windows. App só
runtime, sem admin/migration, não root/read-only/tmpfs/cap_drop/no-new-privileges.
Gateway TLS local mantém HTTPS/cookie Secure de produção, com CA efêmera e confiança
explícita no navegador. Nenhuma funcionalidade/guarda/schema/README alterada.

QA: build sem cache, health3/3, init0, smoke completo com restart/recreate e sessão/
perfil persistidos; Chromium produção1/1 (REST clima sintético), Node62/62,
integração PG/HTTP65/65 sem skips. Audit0, lint/tipos, Harness doctor/validate/verify
aprovados; Harness parcial/readiness not-assessed. YAML/UTF-8/links/âncoras e
diff --check conferidos. Job container-smoke bloqueante independente; três jobs
anteriores preservados. Equivalente local passou; CI remoto não executado.

Limpeza dos projetos Compose descartáveis confirmada por nomes/labels/inventário
vazio; nenhuma leitura de segredos/conexão ao banco persistente. Imagens base/cache
Docker preservados, sem prune. Autorrevisão sequencial; revisão humana pendente.
Sem commit/push/publicação/deploy. [Evidência](../evidence/containerization.md),
[contrato](../evidence/containerization-plan.md), [operação](../../../SOLUTION.md#compose-local-de-produção--container-001).
Histórico abaixo preservado; não repetir execução por memória.

## ADMIN-DELETE-UI-001 — apresentação danger, 30/10/2026

Ajuste isolado CSS, sem alteração funcional: texto claro/vermelho escuro, hover/
active/disabled legíveis, foco amarelo e Cancelar inicial preservados. Contraste
normal15.57,hover8.97,active12.10,disabled7.49:1, em ambos botões/desktop/mobile.
UI36/36, Node62 via Harness, lint/tipos/doctor/validate/verify aprovados; cleanup0
e metadados/ACLs protegidos iguais. Capturas06+novo10, demais16 PNGs/3 referências
inalterados por hash. [Evidência](../evidence/admin-delete-visual.md). Sem banco
persistente/commit/push; alterações anteriores preservadas, humana/CI pendentes.

## ADMIN-DELETE-001-L1 — preparação persistente aplicada, 30/10/2026

Com autorização específica, executados db:inspect/grant/check/inspect e restart
em127.0.0.1:5432/imobilead. Resultado0 e destino confirmado antes/depois. ACLs
READ ONLY autorizadas comprovam só DELETE users false→true e DELETE sessions
true→false; grants19 colunas/schema/papel preservados, sem TRUNCATE/delegação/CREATE.
Runtime imobilead_app aprovado por db:check; aplicação Ready em localhost:3000.
[Evidência/snapshots](../evidence/admin-delete.md#admin-delete-001-l1--preparação-persistente-autorizada).
Sem usuário/sessão excluído pelo agente, alteração cadastral, migration, fixture,
DROP/TRUNCATE, commit/push. Teste humano futuro de exclusão somente com conta
sintética e autorização explícita. Pendências de grants/restart abaixo são
históricas para esse destino; não inferir autorização para excluir qualquer conta.

## ADMIN-DELETE-001 — estado vigente, 30/10/2026

Implementação/testes locais sobre main/0dfc215 limpo inicial, perfil publicado e
CI-base success confirmado. DELETE /api/users/[id] somente admin→user, sem self/
admin, transação única/locks determinísticos/sessão revalidada/cascade. UI modal
acessível, sem remoção otimista e com refetch/paginação/gerações. Perfil preservado.
Sem schema novo: mecanismo canônico concede DELETE users/revoga DELETE sessions,
checker mínimo atualizado, sem aplicar esse contrato ao persistente.

Node62/62, HTTP/PG65/65, exclusão UI35/35, perfil UI33/33, UI completa51/51,
corridas58/58; zero falhas/skips/cancelamentos finais. Cleanup0/metadados protegidos
iguais. Lint/tipos/build/audit0/doctor/validate/verify aprovados, Harness parcial.
Revisão Backend independente sem achados materiais, humana e CI do novo diff
pendentes. [Evidência](../evidence/admin-delete.md) contém falhas/correções,
hashes preservados25/25, inventário, diff e roteiro humano sintético.

Nenhum cadastro persistente excluído ou grant aplicado; aplicação futura exige
nova autorização para db:grant/db:check/restart. Checker novo recusa ACL antiga.
Teste humano somente conta sintética com autorização explícita de exclusão.
README/CI/lock/capturas inalterados; sem commit/push/publicação/containerização.
Restrições anteriores de não iniciar exclusão eram da etapa do perfil; histórico
mantido abaixo, sem autorizar alterações persistentes nesta etapa.

## PROFILE-001-L1 — persistente local, 30/10/2026

Migration/grants/check/restart explicitamente autorizados e executados pelo
agente por comandos canônicos. Destino127.0.0.1:5432/imobilead confirmado antes/
depois; applied:1, grant/check aprovados; runtime sem UPDATE de identidade/
credenciais/papel nem DELETE users. App reiniciada por npm run dev na porta3000.
Sem operação destrutiva, fixtures no persistente ou DML de cadastro pelo agente.
HTTP200 de login/área/sessão/consultas observados após entrada de credenciais
pelo usuário; usuário confirmou sucesso nos dois papéis/telas. Confirmação visual
manual separada da observação HTTP; conector browser indisponível.
Doctor/validate passaram; sem commit/push. [Evidência L1](../evidence/profile.md#profile-001-l1--aplicação-persistente-local-autorizada).
Pendências de aplicação local abaixo são históricas; exclusão/containerização
continuam não iniciadas e CI remoto/revisão humana do diff seguem pendentes.

## PROFILE-001 — edição própria, 30/10/2026

Estado vigente: implementação local do perfil sobre main/5ff4fc5 inicialmente
limpo; sem commit/push. User/admin editam somente próprios textos, com e-mail
imutável; mesmas regras do cadastro, versão integer/número e conflito explícito.
API usa cliente transacional único, locks usuário/sessão, papel fresco e UPDATE
restrito. UI mantém gate/gerações e atualiza campos sem sobrescrever draft.

Node61/61, HTTP/PG52/52, perfil UI31/31, regressão UI49/49 e corridas56/56;
zero falhas/skips nos resultados finais. Lint/tipos/build/doctor/validate/verify
passaram; Harness parcial/readiness not-assessed. Cleanup0, metadados/ACLs
protegidos iguais. Revisão Backend independente sem achados materiais; humana
e CI remoto do diff pendentes. [Evidência e falhas intermediárias](../evidence/profile.md).
README byte-preservado; workflow/lock/dependências intactos.

Migration e grants do perfil ainda não aplicados ao banco persistente; testes
usaram somente recursos descartáveis. Uso real exige preparação/reinício descritos
em SOLUTION. Próxima entrega apenas planejada: exclusão só user (admin proibido),
ator/alvo bloqueados/revalidados, sem contagem de admins/trava global/rebaixamentos.
Não iniciada, assim como containerização. Pedido atual não autoriza avançar.
Histórico anterior preservado abaixo.

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

Etapa pontual autorizada: SVGs React locais por código WMO e remoção do aviso
de descarte do resumo. Mensagem principal, persistência, resumo sem senha e
descarte em memória preservados; sem mudança em endpoints/validação/dia/descrições/
timeout/abort/retry/CSP ou outras páginas. Sem dependência/animação/asset externo.
Unitários26/26, Harness parcial Node55/55, lint/typecheck/build aprovados;
UI completa/documentos/hash/diff na [evidência](../evidence/ui.md#refinamento-visual-do-clima--30102026).
UI final43/43, zero falhas/skips/diagnósticos inesperados; cadastro sintético
persistido, cleanup0/metadados principais iguais; documentos/links/UTF-8/diff aprovados.
Par03 atualizado; demais16 PNGs e3 referências preservados. Citação dos nomes
legados somente no prompt integral; nenhuma configuração funcional reintroduzida.
Autorrevisão; revisão humana/CI remoto/HTTPS/outros navegadores pendentes.
Sem commit/push/publicação; alterações anteriores preservadas. Histórico abaixo.

## Revisão da configuração de clima — 30/10/2026

Configuração legada removida do exemplo; busca confirmou nenhum consumidor no
código ou validador. Open-Meteo sem credencial no uso adotado; dois endpoints
oficiais fixos em constantes internas, sem variáveis públicas. Sessão absoluta
SESSION_TTL_SECONDS=3600 e CSP self/dois hosts intactos. Documentação/tabela
alinhadas, com QA na [evidência](../evidence/ui.md#revisão-da-configuração-de-clima--30102026).
QA atual: clima14/14, Node43/43 pelo Harness parcial; lint/typecheck/build,
documentos/links/UTF-8 e diff aprovados; busca legada sem ocorrências.
UI/HTTP/PG da entrega abaixo não reexecutados neste complemento; sem banco,
commit/push/publicação. Revisão humana pendente; histórico preservado.

## WEATHER-001 — estado vigente, 30/10/2026

README 13.c/d implementados por pedido explícito, substituindo clima pendente
dos históricos. Base main/a640fa6 limpa. Previsão no sucesso: client recebe só
localização do resumo, geocodifica e consulta segundo dia com timezone=auto.
Sem credencial/dependência/endpoint interno/SSR/persistência; connect-src limitado
a self e dois hosts Open-Meteo, sem mexer em outros headers/diretivas.
Cadastro/resumo/auth/admin/schema/revalidação permanecem preservados.

QA final: unitários clima14/14; Harness comprovou43 Node; cadastro servidor8/8;
UI clima28/28; UI completa43/43; HTTP/PG40/40. Zero falhas/skips finais;
lint/typecheck/build/documentos/doctor/validate/verify parcial aprovados.
Fixtures autorizadas somente locais descartáveis: cleanup0, metadados/ACLs
principais iguais, nenhum dado real lido/alterado. Somente par03 atualizado,
demais16 PNGs e3 referências preservados. Falhas intermediárias dos testes
StrictMode, limites, hashes e diff na [UI canônica](../evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).

Autorrevisão sequencial; revisão humana, CI remoto, HTTPS/produção e múltiplos
navegadores pendentes. Open-Meteo real não testada; respostas externas simuladas
deterministicamente. Sem commit/push/publicação ou próxima etapa autorizada.
Histórico abaixo preservado.

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

Fase autorizada atual concluída: correção funcional da oscilação no intervalo30s
da área protegida. Sucesso em fundo mantém snapshot verificado visível; demais
gatilhos continuam restritivos. Falhas, identidade/usuário divergente, sessão
final, expiração local e logout fecham; gerações/abortos/cleanup preservados.
Concorrência50/50 e UI29/29 sem skips; ciclo válido sem mudança de hidden, foco,
scroll/layout ou navegações/Document. Lint/typecheck/doctor/validate/verify parcial
aprovados;29 Node offline.22 artefatos visuais preservados por SHA-256.
Cleanup confirmado,0 recursos próprios e metadados/ACLs protegidos iguais.
Autorrevisão e revisão humana pendente. Sem continuidade visual, commit/push ou
publicação. [Evidência e diffs](../evidence/ui.md#revalidação-periódica-estável--30102026).
Histórico abaixo preservado; não iniciar próxima etapa pela memória.

## Correção funcional React e hidratação — 29/10/2026

Prioridade funcional concluída: close sem flushSync, gate DOM síncrono com hidden
constante no JSX; apenas operação atual revalidada pode abrir. Proteções de
concorrência/sessão/logout/identidade/expiração preservadas. Ícone usa SVG local.
Concorrência29/29; UI29/29; lint/typecheck, doctor/validate/verify parcial e
validação documental aprovados. Monitor: zero diagnósticos inesperados;1 aviso
de preload local de desempenho contabilizado. Mutação externa controlada produz1
aviso de hidratação esperado; atributo ausente em HTML/DOM limpo. Sem prova da
extensão específica no perfil do usuário.18 capturas/README e3 referências
preservados por hash. Limpeza confirmada; dados/metadados protegidos preservados.
Revisão humana pendente, ajuste visual pausado; sem commit/push/publicação.
[Detalhes e diff](../evidence/ui.md#correção-funcional-react-e-hidratação--29102026).
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

﻿# Estado do projeto

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

QA complementar UI-001: regressão separada `npm run test:db:integration`40/40,
zero skips, cleanup confirmado, metadados/ACLs protegidos iguais. UI28/28 separado.

QA P1 final: doctor/validate/verify --product aprovados, audit0 vulnerabilidades;
Harness parcial, Node29 comprovados, demais runners separados. Recursos descartáveis
limpos, sem Next/Chromium próprios ativos. Revisão humana final permanece pendente.
