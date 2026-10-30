# ADMIN-DELETE-001 — evidência, 30/10/2026

## ADMIN-DELETE-001-L1 — preparação persistente autorizada

Pedido posterior autorizou somente db:inspect, db:grant, db:check, db:inspect e
reinício, no destino exclusivo127.0.0.1:5432/imobilead. Não autorizou exclusão de
usuários/sessões, alteração cadastral, DROP/TRUNCATE, recriação ou commit/push.
Como db:inspect mostra somente destino/inventário, foi explicitamente autorizada
também leitura adicional de ACLs antes/depois, sem cadastros ou valores de segredos.

Execução do agente: primeiro db:inspect confirmou imobilead_migrate no destino
exato; as duas leituras ACL usaram imobilead_app com default_transaction_read_only
e BEGIN READ ONLY, identidade conferida pelo helper canônico. Depois db:grant
(administrador local), db:check (runtime) e db:inspect (migrador) tiveram saída0
e confirmaram o mesmo destino. Inventário antes/depois:9 objetos/6 da aplicação.

| Privilégio efetivo runtime | Antes | Depois |
| --- | --- | --- |
| DELETE imobilead.users | false | true |
| DELETE imobilead.sessions | true | false |
| SELECT/INSERT/UPDATE nas19 colunas de users/sessions | Contrato anterior | Exatamente idênticos |
| TRUNCATE users/sessions | false | false |
| Delegação de direitos de tabela/coluna | false | false |
| CREATE schemas app/public; acesso ao histórico; poderes privilegiados | false | false |

Somente as duas flags DELETE mudaram na comparação das tabelas. Colunas, schemas
e atributos do papel foram comparados integralmente e permaneceram idênticos.
[Snapshots sanitizados completos](admin-delete-acl.json) contêm somente metadados
de privilégios e identidade, sem registros, hashes de senha, cookies ou credenciais.
db:check aprovou o contrato completo de direitos efetivos, inclusive proibições.

Reinício realizado somente nos dois processos Next deste checkout, identificados
antes da parada. Porta3000 liberada e npm run dev ficou Ready, com novo processo
ouvindo3000; aplicação permanece em http://localhost:3000. Aviso de React18
preexistente, nenhum erro de banco/boot observado. Bloco de AGENTS acrescentado
automaticamente por Next foi restaurado aos bytes exatos anteriores, sem alterar
instruções/configuração. Não houve teste de exclusão ou login automatizado no
persistente. Nenhum DELETE/UPDATE cadastral, DELETE manual de sessões, migration,
DROP/TRUNCATE, fixture, commit ou push foi executado nesta preparação.

Esta atualização supera a pendência de grants/restart abaixo exclusivamente
para o destino local autorizado. Teste humano de exclusão continua pendente e
requer conta sintética e autorização explícita; usuários existentes não são alvos.

## Histórico da implementação isolada

Base main/0dfc215417f6bfb9ded9d668e90034f1d053c538, árvore inicialmente limpa.
Perfil publicado em origin/main no mesmo SHA e CI-base concluído success:
[run41016344730](https://github.com/ThiSlomski/interview-challenge/actions/runs/41016344730),
confirmado por Git/API antes de implementar. CI do novo diff não executado.
[Contrato](admin-delete-plan.md), [pedido integral](../../prompts/2026-10-30-admin-delete.md).

## Escopo e responsabilidades

Endpoint DELETE admin para alvo user,204 sem corpo após commit e cascade;
401/403/400/409/404/503 sanitizados. Corpo/query não são identidade, rejeitados.
Locks users em ordem UUID, sessão FOR SHARE, papel/TTL revalidados e cardinalidade1.
Sem contagem de admins, trava global, DELETE sessions ou migration artificial.
Runtime ganha DELETE users e perde DELETE sessions no mecanismo canônico, apenas
testado no descartável. Nenhum grant/schema/cadastro persistente foi alterado.

Frontend escreveu Area/dialog/Record/messages/CSS/browser específico. Backend
escreveu HTTP/PG específico e ajustes da projeção administrativa em testes de
autorização; orquestrador escreveu API/ACL/auth/Node/agregador/docs. Ownership e
ganho registrados antes da delegação. Especialistas não executaram testes contra
banco persistente. Revisão humana permanece pendente.

Login recebeu somente tratamento genérico da FK de sessão quando exclusão vence
a corrida após conferir senha;401 INVALID_CREDENTIALS sem cookie, sem órfão.
Projeção administrativa acrescenta role; GET individual/perfil continuam anteriores.
Diálogo confirma identidade/efeito, Cancelar inicialmente, teclado/Escape/mobile,
sem remoção otimista, refetch/paginação/cursor e proteção por gerações.

## Verificações

| Comando/verificação local | Resultado final |
| --- | --- |
| npm test e Harness structured Node report |62/62; zero falhas/skips/cancelamentos |
| Launchers em npm test |12 exclusão,12 auth,6 autorização,11 perfil,8 cadastro comprovados separadamente em subprocessos; não somar novamente ao total TAP |
| npm run test:db:integration |65/65, Next HTTP/PostgreSQL reais, inclui11 cenários novos de exclusão/concorrência |
| npm run test:admin-delete:ui |35/35:11 cenários Chromium+23 PG+agregador |
| npm run test:profile:ui |33/33:9 cenários perfil+23 PG+agregador |
| npm run test:ui |51/51:27 cenários existentes incluindo clima+23 PG+agregador |
| node --test tests/ui/race.test.mjs |58/58:34 cenários existentes+23 PG+agregador |
| npm run lint / tsc --noEmit --incremental false | Aprovados |
| npm run build | Aprovado; aviso preexistente de depreciação React18 |
| npm audit --audit-level=high | Zero vulnerabilidades |
| doctor / validate / verify --product | Aprovados; Harness parcial, readiness not-assessed |
| UTF-8, links/âncoras locais e git diff --check | Aprovados |
| CI remoto do novo diff / revisão humana / HTTPS / outros navegadores | Não executados / pendentes |

Todas execuções finais PG/UI/corridas confirmaram cleanup0 e metadados/ACLs
protegidos iguais. Sem skips/cancelamentos nas execuções finais. Monitor Chromium
manteve zero diagnósticos inesperados de React/hidratação/pageerror. A regressão
existente de mutação externa do body reproduz um aviso de hidratação esperado,
separado de execução limpa. O novo cenário404 usa opt-in de diagnóstico de
recurso API404; o monitor das suítes antigas mantém seu contrato anterior.

## Concorrência e falhas intermediárias

HTTP/PG comprovou duas exclusões simultâneas por admins distintos: exatamente
204/404; promoção do alvo durante espera:409 sem exclusão; rebaixamento do ator:
403; revogação e logout reais durante espera:401. Login do alvo foi retido por
trigger BEFORE INSERT exclusivamente na fixture; exclusão venceu, login retornou
401 sem cookie e nenhuma sessão órfã permaneceu. Outro caso demonstra rollback
de usuário e de suas três sessões após falha transacional induzida, seguido de
exclusão confirmada/cascade e preservação das demais contas/sessões.

UI provou polling/resposta anterior já produzida sem reaparecimento, rede perdida
depois de commit com consulta nova, timeout8s/DELETE atrasado, envio único sem
remoção otimista, Escape antes/durante processamento, foco/Tab em desktop/mobile,
promoção após abrir diálogo,404, logout durante DELETE e paginação100 com reposição
de registro e retorno à primeira página quando a última fica vazia.

Primeira integração65:55 pass/10 fail, zero skips/cancelamentos. Nove subtestes
DELETE e agregador falharam porque o handler tratava a stream vazia do Next como
corpo. Correção: consumir somente EOF/primeiro byte sob prazo/concorrência,
recusar conteúdo e incluir regressão Node de EOF/dois leitores/timeout sem DML.
Segunda integração65/65 confirmou correção, sem flexibilizar contrato do payload.

Primeira UI34:2 pass/31 fail/1 cancelled, zero skips; a falha400 do servidor
propagou-se por callbacks assíncronos de interceptação e encerrou o pai antes do
cleanup dos subtestes. Corrigida a causa no servidor e o harness: asserções ficam
no corpo aguardado do teste, callbacks capturam erros, gates/rotas são liberados
em finally e falha interrompe a suíte. Nenhuma assert204 foi removida. A suíte
final35/35 acrescentou Escape durante DELETE, sem cancelamento da transação.
Mesmo as primeiras execuções confirmaram limpeza e metadados protegidos iguais.

Revisão Backend independente de leitura (review-security) não encontrou achado
material em autorização, CSRF, SQL, locks, rollback, cascade ou ACL. Seguimento
específico da leitura vazia confirmou preservação de401/403/400 e limites. A
prova de stream lento é controlada em Node, não um transporte HTTP lento real.
Revisão humana não substituída por essa avaliação.

Snapshot de preservação/diff exclusivo fora do checkout:
`C:\Users\thiag\AppData\Local\Temp\admin-delete-001-8aFXdZ`.
baseline.json contém SHA-base e hashes SHA256 de25 arquivos: README, CI, lockfile,
capturas/referências oficiais. Nenhum segredo ou dado de usuários existentes.

SHA256 confirmou25/25 arquivos preservados, incluindo18 capturas oficiais,
3 referências (2 PNG+JSON), README da galeria, README do desafio, CI e lockfile.
Nenhuma captura oficial foi alterada; a suite nova não grava capturas no repo.
O manifesto final preservation.json e admin-delete.diff no mesmo diretório
permitem conferir hashes e diff exclusivo versus a base limpa, incluindo novos
arquivos sem staging. Nenhum arquivo adicionado ao índice Git.

## Arquivos alterados

API/transação: app/api/users/[id]/route.ts; server/users/index.ts,
repository.mjs, delete-handler.mjs e delete-repository.mjs; server/auth/handler.mjs.
Privilégios: scripts/database/provision.mjs; server/db/config.mjs.
UI: components/ui/Area.tsx, Record.tsx, messages.ts, DeleteUserDialog.tsx;
app/globals.css. Configuração de testes: package.json.
Testes: tests/admin-delete/{server.test,server-runner.test,http-postgres,browser,
ui.test}.mjs; tests/auth/{server.test,server-runner.test}.mjs;
tests/authorization/{server.test,http-postgres}.mjs; tests/database/integration.test.mjs;
tests/ui/console.mjs (opt-in404 sem mudar defaults existentes).
Documentação: SOLUTION.md; docs/{ARCHITECTURE,REQUIREMENTS,AI_PROMPTS}.md;
docs/prompts/2026-10-30-admin-delete.md;
docs/harness/evidence/admin-delete{,-plan}.md;
docs/harness/memory/{handoff,project-state,index,decisions}.md.

## Aplicação futura e teste humano

Não aplicar nesta etapa. Depois de revisão/autorização para o persistente:
db:inspect antes, db:grant, db:check, db:inspect depois e reinício, conforme SOLUTION.
Sem db:provision, reset ou migration nova. Enquanto os grants não forem aplicados,
o checker novo recusa o contrato antigo (fail closed); não usar a nova versão
no persistente antes dessa preparação. Os testes usam portas/roles/bancos próprios.

Nenhum cadastro persistente existente pode ser usado como alvo. Para revisão
humana posterior, o usuário deverá criar conta sintética exclusiva, por exemplo
nome Usuário Temporário para Exclusão e e-mail exclusao-manual-<timestamp>@example.test,
anotar seu UUID e entrar como user para abrir sessões. Depois entrar como admin,
conferir a identidade e somente após autorização explícita excluir essa conta.
Verificar204, ausência na listagem e401 das sessões anteriores, preservando as
demais contas. Criar esse cadastro e excluí-lo não foram executados pelo agente.

## Limites

Autorização por linha reside na API; privilégio SQL DELETE é de tabela. Quem
possui a credencial runtime fora da API pode contornar regras de negócio.
Limitador local ao processo não coordena réplicas. Requisição autorizada de
leitura já produzida antes da exclusão não pode ser desfeita no servidor; a UI
descarta gerações anteriores à mutação. Login que venceu antes do DELETE pode
emitir cookie que ficará inválido após cascade; jamais permanece sessão órfã
utilizável. Sem auditoria/soft delete/restauração/lote, por escopo.

CI remoto do novo diff, HTTPS/múltiplos navegadores e revisão humana não comprovados.
Sem commit, push, publicação, grants no persistente ou exclusão de cadastros reais.
