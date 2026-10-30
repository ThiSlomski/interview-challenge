# UI-001-P1 — evidência, 29/10/2026

Padronização posterior de pastas,29/10/2026: links visuais navegáveis agora usam
ui-captures/ e ui-reference/. Nomes antigos em inventários, comandos e snapshots
abaixo documentam a época original; não foram substituídos indiscriminadamente.
A pasta ui-captures foi reutilizada apenas depois de confirmada vazia, recebendo
o conjunto final. Assim, um caminho citado como retirado no inventário anterior
pode hoje existir com conteúdo final distinto. O histórico não é inventário atual.

Detalhe histórico/técnico da correção executada no P1.
[Relatório final frontend](ui.md) e [roteiro vigente](../../../SOLUTION.md).
As contagens deste documento são execuções P1; não foram repetidas pela organização documental.

Estado: correção e identidade implementadas; revisão final humana pendente.
HEAD main/4c5c6fc7986dccaf88887fa5b1587853fc10c6b1. Alterações UI-001 anteriores
preservadas, sem index/commit. [Contrato](ui-p1-plan.md).

## Base e reprodução antes da edição

Snapshot anterior: `C:\Users\thiag\AppData\Local\Temp\ui-001-p1-before-Op3cBN`.
Manifesto143 arquivos com hashes/HEAD; só arquivos versionados ou não ignorados,
sem .env local, node_modules, build ou segredos. Base exclusiva P1, não o HEAD.

Hipótese: check aguardava permissão e continuava após remove/pagehide; active
permanecia true e checking impedia outra consulta. Antes de editar Area.tsx,
executado `$env:UI_RACE_EXPECT_OLD='true'; node --test tests/ui/race.test.mjs`.
Chromium real executou componente anterior, com Next/PG descartáveis reais.
A interceptação fez route.fetch produzir GET próprio200 real, reteve a resposta,
disparou pagehide SINTÉTICO e só então entregou a resposta. Observado: dados
ocultos no evento voltaram a ficar visíveis. Log sanitizado:
`observedOldReveal:true`, `synthetic-pagehide`, `retained-real-permission-200`.

Esse modo observa o defeito e passou17/17 incluindo checks SQL; não significa
aprovação da proteção antiga. O critério de permanecer oculto foi violado.
Não é evidência de troca real de aba/bfcache pelo sistema operacional, nem de
consulta real posterior à revogação. Após correção, o mesmo cenário exige ocultação
e passou, sem depender somente de aborto do transporte.

## Causa, impacto e correção

A validade da montagem não identifica a operação que ainda pode produzir efeitos.
Uma resposta antiga podia reabrir o DOM, inclusive durante ocultação/logout.
Area agora usa geração, propriedade da operação atual e AbortController, com
prazo total8s por checagem/logout. Toda conclusão após await exige operação atual,
closure ativa, sinal não abortado, página visível/não suspensa e TTL não expirado.
Somente a operação atual pode finalizar seu prazo ou liberar o bloqueio de logout.

Ocultar/pagehide, contexto completo data, desmontagem, expiração e início de
logout invalidam operações anteriores. O layout invalida sincronicamente antes
da pintura e desativa a closure antiga; callbacks antigos de expiração/eventos
não podem ocultar dados novos ou navegar. Retorno permite checagem nova mesmo
com transporte antigo pendente. Nenhum POST recebe nova tentativa automática.

A checagem lê sessão/identidade, executa consulta autorizada existente e reconfere
sessão/identidade antes de revelar. Identidade deve igualar data.own.id; diferença
descarta contexto visual e recarrega /area no servidor. Papel fresco continua
verificado pela API, SSR/projeção/TTL absoluto3600 sem renovação preservados.
Falha/timeout mantém dados ocultos e oferece Verificar acesso novamente.
Logout503 não declara sucesso; checagem válida permite recuperação. Uma consulta
paralela antiga não reabre dados, nem apaga a mensagem ou libera operação nova.

Limite: cliente não recebe notificação instantânea de mudanças no banco. Resposta
válida atesta a consulta no momento em que foi produzida. Não se promete saber
revogação/rebaixamento ocorridos depois da última resposta sem novo sinal/consulta;
polling30s e eventos/requisições continuam a detectar mudanças. APIs sempre
reautorizam acesso, independentemente de dados já exibidos.

## Testes e interceptações declaradas

`node --test tests/ui/race.test.mjs`:27/27 aprovados, sem skips
(11 cenários específicos,15 checks SQL e teste principal).

- Resposta real200 depois de pagehide sintético: permanece oculta.
- Fetch shim controlado remove signal, mas continua usando HTTP/Next/PG reais:
  resposta após visibility hidden não revela, provando guarda de geração.
- Ocultar/retornar com consulta retida inicia nova operação; antiga não revela
  enquanto nova espera, nem libera seu bloqueio.
- Respostas fora de ordem: falha503 simulada nova chega antes do200 real antigo;
  estado oculto e mensagem da operação nova prevalecem.
- Revogação ocorre após servidor produzir200 retido; ocultar/retornar faz uma
  nova checagem real retornar401. O200 antigo não é apresentado como pós-revogação.
- Logout200 real com consulta retida: conteúdo permanece oculto até ir a login.
- Logout503 simulado: antiga não revela; nova checagem autorizada recupera acesso.
- Outra sessão real assume o cookie durante await de permissão: conferência final
  recarrega contexto e mostra somente novo titular.
- Prazo real8s com resposta retida: erro seguro/ocultação; retry recupera e entrega
  atrasada não altera operação atual.
- Harness React controlado muda data com mesmo id durante consulta: antiga não
  revela; nova mostra contexto correto. Captura/invocação controlada do callback
  antigo de expiração comprova que ele não navega depois da troca de contexto.
- Navegação cliente desmonta área com consulta pendente; resposta tardia é inerte.

O context harness existe SOMENTE na cópia temporária Next via prepareFixture,
nunca no app de produção. Esperas de interceptação limitadas15s; retenções liberadas
no finally. A suíte completa mantém histórico/cache, expiração e rebaixamento.

Resultados completos por tipo, sem soma entre runners, na
[tabela da entrada principal](ui.md#verificações-e-resultados).
A regressão específica P1 executou27/27 (11 cenários,15 SQL e principal),
sem skips; esta organização não reexecuta nem reaprova essa correção.

Browser completo após identidade e novamente após endurecimento de callbacks:
ambos28/28. A suite direcionada progrediu de1 para9 e11 cenários conforme achados,
sem falhas observadas após correção. Sem dependências alteradas em P1;
Playwright/lockfile existentes preservados. Build usa fontes locais.

## Revisão independente

Backend, somente leitura, skills review-security/verify-delivery. Encontrou dois
P2: invalidação apenas passiva/contexto parcial e troca de identidade durante await
de permissão. Ambos corrigidos e regredidos. Seguimento apontou callback antigo
de expiry ainda ativo entre layout e cleanup passivo; closure agora desativada,
com teste de callback antigo e confirmação final independente de leitura.
Não restou achado material nessa revisão delimitada. Execução dinâmica e inspeção
visual foram da raiz. Não substitui revisão humana nem auditoria integral.

## Referência visual e capturas

A adoção institucional ocorreu no P1, após a rodada inicial. Elementos,
contrastes calculados no P1, fontes e SVG locais estão descritos na
[entrada principal](ui.md#identidade-slomski-solutions). A evidência oficial
consultada antes da edição permanece separada em
[referência computada](ui-reference/reference.json),
[site desktop](ui-reference/official-desktop.png) e
[site celular](ui-reference/official-mobile.png).

Historicamente foram produzidas20 capturas P1 e preservadas9 iniciais.
A organização posterior retirou as iniciais e duas duplicatas P1;
[a galeria atual tem18 capturas finais](ui-captures/README.md).
Ela mostra o estado FINAL; os resultados de execução abaixo continuam históricos.

## Operação, falhas intermediárias e entrega

Frontend teve propriedade dos arquivos visuais; raiz Area/testes/documentos;
Backend revisão sem escrita. Sem conflito de escritores. Helpers de teste incluem
public na cópia isolada para servir SVG real e callback explícito para o harness
React temporário. Não houve mudança de Harness/CI/API/schema/grants.

Falhas de ferramentas: web open inacessível resolvido por Chromium; Python ausente
para prancha de inspeção, usado sharp já disponível sem instalar pacote. Achados
intermediários da revisão acima não foram ocultados nem chamados de reproduções
dinâmicas adicionais. Não houve necessidade de enfraquecer verificações.

Todas as execuções PostgreSQL confirmaram cleanup:confirmed,remainingResources:0,
protectedMetadata:unchanged. Somente fixtures/bancos/papéis descartáveis próprios;
sem leitura de usuários ou mutação em imobilead e sem banco remoto. Next/Chromium
encerrados e diretórios temporários das fixtures removidos; snapshot e diffs
solicitados permanecem disponíveis para revisão.

Diff exclusivo P1: `C:\Users\thiag\AppData\Local\Temp\ui-001-p1.diff` contra snapshot.
Diff acumulado UI-001: `C:\Users\thiag\AppData\Local\Temp\ui-001.diff` contra HEAD.
Incluem novos assets/capturas/documentos; excluem segredos, node_modules/build e
pranchas temporárias de inspeção. Sem index/commit/push/publicação.

Pendentes: revisão humana final, clima(13.c/d), CI remoto do diff, HTTPS/produção,
outros navegadores e prontidão integral do produto. UI-001 pronta para essa revisão,
sem alegar que esses requisitos estão aprovados.

QA de fechamento P1: doctor/validate/verify --product aprovados; Harness preserva
partial:true/readiness:not-assessed e comprova apenas Node29/29. Build/navegador/
integração executados separadamente. Audit adicional retornou zero vulnerabilidades,
mesmo sem dependências novas em P1. Inventário final sem Next de fixture ou Chromium
Playwright ativos e0 diretórios temporários das fixtures. Pranchas diagnósticas
removidas após inspeção; capturas/snapshot/diffs solicitados preservados.

Verificação focal adicional: `$env:UI_RACE_CASE='React context'; node --test
tests/ui/race.test.mjs`18/18, zero skips. O filtro registra somente o cenário
selecionado mais pagehide/SQL; não representa a suíte completa. Captura exige
callback de nome expired e pelo menos dois timers do contexto, evitando prova
vazia por timer do framework. Callback antigo não navegou após troca de data.

Check do patch completo encontrou um espaço final na linha21 das duas licenças
OFL obtidas da fonte oficial; normalizado somente whitespace, preservando integralmente
palavras, avisos e condições. Check de novos arquivos reexecutado após esse ajuste.
