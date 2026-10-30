# Entrega frontend — UI-001

Inclui a correção histórica UI-001-P1. Caminhos operacionais de evidência visual:
`ui-captures/` (aplicação) e `ui-reference/` (site oficial).
A padronização anterior das pastas preservou os hashes sem repetir navegador/banco/build.
O ajuste posterior dos campos e sua execução Chromium estão registrados ao final;
os resultados abaixo identificam a rodada correspondente.
A correção funcional posterior de lifecycle e o diagnóstico de hidratação estão
na [seção atual](#correção-funcional-react-e-hidratação--29102026), com base Git80297ad.
Correção vigente da oscilação periódica: [revalidação estável](#revalidação-periódica-estável--30102026).

Entrada principal vigente, consolidada em29/10/2026. Base main/4c5c6fc,
alterações locais sem commit. [Roteiro operacional único](../../../SOLUTION.md#avaliar-o-frontend),
[galeria final:18 capturas](ui-captures/README.md),
[detalhe histórico/técnico P1](ui-p1.md) e
[histórico da implementação inicial](ui-initial-history.md).

## Escopo e rotas

| Rota | Entrega |
| --- | --- |
| `/` | Entrada útil com navegação para cadastro, login e área |
| `/cadastro` | Todos os campos, erros acessíveis, envio e resumo confirmado |
| `/login` | E-mail/senha, estados de erro/carregamento e destino fixo `/area` |
| `/area` | Proteção no servidor, consulta própria e listagem exclusiva de admin |
| `/area?after=UUID` | Paginação administrativa de até100 cadastros e estado vazio |

Não foram implementados clima, recuperação de senha, verificação de e-mail,
alteração de perfil ou novas permissões. A consolidação atual organiza evidências
sem alterar interface, identidade, autenticação, autorização ou banco.

## Implementação e integração

React/Next e CSS existentes, sem biblioteca visual nova. Formulários usam os
POSTs públicos existentes; `shared/registration.mjs` mantém limites, normalização
e contrato obrigatório/opcional no navegador, com servidor como autoridade final.
Nome admite vazio e até150 codepoints; senha ASCII alfanumérica8–35. Labels,
aria-invalid/describedby, resumo de erros e foco após commit orientam correção.
Envio simultâneo bloqueado; POST incerto não recebe nova tentativa automática.

POST `/api/users` não cria sessão e retorna somente id. O resumo usa apenas os
dados confirmados em memória, sem senha/confirmação, armazenamento Web ou query
string. Reload/saída descarta o resumo; a tela informa que ainda é preciso entrar.
Login preserva a senha digitada, recebe cookie HttpOnly pelo navegador e faz
navegação completa para atualizar o servidor, sem redirecionamento externo.

A página `/area` é dinâmica e usa `authenticateSession`, política `mayRead` e
`readUsers/projectUser` existentes, sem HTTP servidor para Host arbitrário.
Sem sessão válida, redireciona antes de renderizar dados protegidos; falha de
infraestrutura fecha acesso e mostra indisponibilidade. User consulta só o próprio
cadastro; admin recebe lista paginada. Papel fresco e projeção mínima são exigidos
no servidor, sem hash/credencial/material de sessão em payloads cliente ou cache
compartilhado. Logout só conclui depois da revogação; erro permite nova tentativa.

## Correção assíncrona P1

A rodada inicial antecedeu essa correção e a identidade Slomski. No P1, Chromium
executou a versão anterior e recebeu uma resposta GET200 real retida, entregue
após pagehide sintético: dados voltaram a aparecer. Isso confirmou a corrida,
sem comprovar troca nativa de aba nem consulta posterior à revogação.

A correção identifica a operação por geração e AbortController, invalida no
layout/contexto/ciclo de vida/logout e confere validade após cada await. Operações
antigas não alteram DOM/estado/mensagens/navegação ou liberam bloqueios novos.
Sessão/identidade são conferidas antes e depois da permissão; identidade diferente
exige novo contexto pelo servidor. Timeout8s ou falha mantém dados ocultos e permite
Verificar acesso novamente. TTL absoluto3600s e autorização servidor preservados,
sem renovação por navegação. Timer/eventos da closure antiga também são inertes.

As11 regressões P1 cobrem respostas atrasadas/fora de ordem, ocultar/retornar,
pagehide, revogação após produção de200, logout sucesso/falha, troca de identidade,
timeout/recuperação, contexto React e desmontagem. Transporte controlado ignora
abort mantendo HTTP real; o harness React existe só na cópia temporária. Respostas
simuladas e eventos sintéticos estão discriminados no [detalhe P1](ui-p1.md).
Revisão independente P1 fechou os achados; revisão humana continua pendente.
A organização documental não reexecuta nem reaprova a correção por si só.

## Identidade Slomski Solutions

No P1, o [site oficial](https://www.slomskisolutions.com.br) foi inspecionado antes
da edição em desktop/celular. [Referência computada](ui-reference/reference.json),
[site desktop](ui-reference/official-desktop.png) e
[site celular](ui-reference/official-mobile.png) são referências externas,
separadas das capturas finais da aplicação.

Paleta confirmada: fundo#08090A, elevado#101214, superfície#171A1D,
texto#F4F4F2, secundário#A7AAAE, borda#30343A, destaque#F5C542 e forte#FFDA62.
Tokens CSS centralizam cores, espaçamento e tipografia. Space Grotesk300–700 e
IBM Plex Mono400/500 em WOFF2 locais via next/font/local, com OFL preservadas;
SVG oficial local mantém geometria, sem hotlink. Linhas/grid discretas, botões
retos e texto escuro sobre amarelo; sem animações ou estilos das demonstrações.
Não foram copiados textos comerciais/métricas/depoimentos.

Rodapé: “Desenvolvido por Slomski Solutions · Desafio técnico Imobilead”.
O link oficial usa target=_blank, rel=noopener noreferrer e aviso acessível de
nova aba. Slomski é identificada como desenvolvedora, sem parceria presumida.
Skip-link ocupa linha própria e move foco para main#conteudo.
Contrastes calculados no P1: corpo18,10:1, secundário8,05:1, botão12,29:1,
erro10,10:1, foco13,82:1 e desabilitado5,59:1; não são auditoria WCAG integral.

## Verificações e resultados

Resultados identificados por rodada. Não somar contagens entre runners:
os15 checks SQL e o teste principal reaparecem nas suítes de integração/UI/corrida.
Os29 resultados Node incluem launchers de registro8/auth11/autorização6;
os testes filhos não são29 casos adicionais. Não há total global único inventado.

| Tipo / comando | Resultado real mais recente | Rodada |
| --- | --- | --- |
| Offline `npm test` | 29/29, sem skips; inclui launchers | P1, histórico preservado |
| HTTP/PG `test:db:integration` | 40/40 =24 HTTP +15 SQL +principal | P1, histórico preservado |
| Chromium `test:ui` | 29/29 =13 cenários UI +15 SQL +principal | Ajuste visual dos campos; consolidação anterior28/28 preservada no histórico |
| Concorrência `race.test.mjs` | 27/27 =11 cenários +15 SQL +principal | P1; não reexecutada nesta organização |
| Focal contexto | 18/18 =2 cenários +15 SQL +principal; subconjunto | P1; não somar à suíte completa |
| lint/typecheck | Aprovados por alteração do CSS/testes | Ajuste dos campos |
| build/audit | Passaram; audit0 vulnerabilidades | P1; não repetidos por organização |
| doctor/validate/diff --check | Aprovados; links/âncoras e UTF-8 conferidos | Consolidação |
| verify --product | Node29 comprovados, partial:true/readiness:not-assessed | P1; não executa browser/build |

Na consolidação anterior, Chromium verificou nomes/enquadramento, preservando
os12 cenários funcionais. O ajuste posterior acrescenta um cenário comportamental
de campos, sem reexecutar a suíte direcionada de todas as corridas. Resultados e
falhas intermediárias reais permanecem nos históricos
[UI inicial](ui-initial-history.md) e [P1](ui-p1.md).

## Evidências, histórico e organização

[Galeria final](ui-captures/README.md): nove pares desktop/celular, com estado
identificado e referência oficial separada. A listagem desktop mostra título e
registro sintético, sem imagem de100 itens. Nenhuma imagem foi editada para
simular estado. A geração não recria capturas antigas ou redundantes.

[Inventário e verificação da organização](ui-organization.md) registra remoções,
renomes, comparação pixel a pixel, snapshot anterior e diffs. Planos
[UI-001](ui-plan.md), [P1](ui-p1-plan.md), [organização](ui-organization-plan.md) e
prompts integrais em [AI_PROMPTS](../../AI_PROMPTS.md) preservados. Imagens retiradas
não são apresentadas como evidência de identidade/correção na versão inicial;
links históricos visuais apontam explicitamente para o estado final equivalente.

## Limitações e pendências

Revisão humana final, clima por REST no navegador(README13.c/d), CI remoto do diff,
HTTPS/produção e outros navegadores não aprovados. Nenhuma prontidão integral
de produto declarada. Cliente detecta revogação por consultas/eventos/polling30s;
não sabe instantaneamente mudança no banco após última resposta válida. API sempre
reautoriza. Limites de abuso locais por processo permanecem conforme AUTH/REG.

Sem conta/senha padrão ou promoção de usuários nesta consolidação. Somente
recursos descartáveis autorizados nos testes; sem leitura de usuários/mutação em
imobilead, bancos remotos, commit, push ou publicação. Limpeza é registrada
no [fechamento da organização](ui-organization.md#verificação-e-limpeza).

## Ajuste visual dos campos — 29/10/2026

Alteração de produção centralizada apenas em app/globals.css. Preservados os tokens
já correspondentes e todos os tamanhos, espaçamentos, fontes, labels e painéis.
Inputs/textarea normais usam fundo#08090A, borda#30343A, texto#F4F4F2, cantos retos;
contorno de foco#F5C542 com3px e offset3px. Erro mantém borda/mensagem próprias
simultaneamente ao contorno de foco. Seleção usa amarelo suave14%, caret amarelo;
desabilitado usa texto secundário/fundo elevado e cursor de espera, sem reduzir
contraste por opacidade. Botões e painéis mantiveram o desenho anterior.

Referências locais fornecidas pelo usuário: src/styles/base.css e tokens.css em
C:\Projetos\SlomskiSolutions\slomski-solutions-web. Valores aprovados para esta
tarefa. Encontrada a regra original institucional em
src/components/contact/ContactForm.module.css: gradiente90deg, amarelo suave e
transparente a58%; reutilizada no foco sobre o fundo principal do desafio. Nenhum
CSS/fonte de produtos incorporado e nenhum arquivo da referência alterado.

Autofill Chromium tem pintura nativa sobre o background. O inset opaco mantém
legibilidade; no foco, mistura86% do fundo com14% de amarelo. Essa adaptação de
autofill é aproximação visual específica do navegador, não reprodução exata do
CSS institucional. O gradiente dos campos comuns foi encontrado no código local.

Verificação efetiva desta rodada: lint/typecheck aprovados; suíte Chromium completa
29/29, zero skips (13 cenários UI +15 SQL compartilhados +principal). Os12 cenários
existentes foram preservados; novo cenário comportamental verifica teclado,
seleção, geometria estável e contorno sem corte por ancestrais/painéis, erro+foco,
autofill e envio desabilitado. Não são testes que apenas repetem declarações CSS.
12 sondagens de foco passaram em desktop1280×900 e celular390×844.

Autofill de endereço executado nativamente via CDP em cadastro, com dados sintéticos
não salvos. No login foi forçado somente o pseudoestado autofill de Blink para
inspecionar pintura/foco: nenhum perfil ou senha salvo. Não é prova de integração
com gerenciador real de senhas. Indisponibilidade do login e envio pendente do novo
cenário usam503 interceptado, conforme os testes; fluxos reais continuam nos demais.

Falha intermediária: a primeira execução passou os12 cenários existentes, mas o
novo cenário não pôde iniciar Autofill.enable no headless shell (27 aprovações,
2 falhas contando o principal). Sondagem confirmou ausência do domínio naquela
variante e disponibilidade no Chromium completo já instalado. Runner UI passou
a usar channel:chromium, sem instalar/atualizar dependências; nova execução29/29.
Preparação da captura aguarda estabilização do feedback antes de focar o campo.

Capturas afetadas atualizadas e inspecionadas: pares02-cadastro-erros (erro+foco),
08-login (preenchido/autofill controlado+foco/503) e09-cadastro (normal/vazio).
As outras12 imagens foram preservadas do snapshot anterior, pois seus estados não
têm campos afetados. Mantidos os18 nomes e nove pares; referências oficiais
ui-reference preservadas por hash. Nenhuma nova galeria ou roteiro criado.

Snapshot anterior: C:\Users\thiag\AppData\Local\Temp\ui-001-fields-before-jYhlJn.
Diff exclusivo para revisão: C:\Users\thiag\AppData\Local\Temp\ui-001-fields.diff.
Autorrevisão sequencial; revisão humana pendente. Sem alteração de validação,
limites, APIs/auth/sessão/banco/proteção, clima ou dependências/fontes externas.
Cada rodada confirmou limpeza descartável e metadados/ACLs protegidos iguais;
Next/Chromium encerrados. Não houve leitura de usuários/mutação em imobilead.

Fechamento do ajuste: lint e typecheck reexecutados após atualização dos testes,
validação documental/âncoras e diff --check aprovados. UTF-8 verificado no patch.
Inventário final sem Next da fixture/Chromium próprios ativos e0 diretórios
imobilead-registration restantes.40 arquivos de código/proteção/referências
conferidos contra snapshot: inalterados. As12 imagens não afetadas são idênticas.
Não foram repetidos build/audit ou integração HTTP separada por esta mudança CSS.

## Correção funcional React e hidratação — 29/10/2026

Pedido funcional posterior ao ajuste visual. Base Git80297ad; alterações anteriores
preservadas no snapshot C:\Users\thiag\AppData\Local\Temp\ui-001-react-before-2p6fNi.
Produção: Area.tsx e metadata.icons do layout. CSS, APIs, autenticação, autorização,
sessão, banco e dependências não foram alterados. Autorrevisão sequencial.

### Reprodução e causa

Antes da correção, instrumentação em Chromium limpo, extensões desabilitadas,
reproduziu4 avisos flushSync em entrada/recarga. Zero hydration/console genérico/
pageerror, atributo estrangeiro ausente. Rodada observacional17/17 inclui15 SQL,
um cenário diagnóstico e principal; não aprova o defeito. O check inicial chamado
por useEffect chegava a close, que forçava flushSync durante lifecycle React.
Todos os caminhos foram conferidos: check inicial/retry/poll/foco/retorno,
hide por visibilidade/pagehide, expiração, falha/timeout, identidade/permissão e
logout. O fechamento também ocorre antes da pintura no layout e em seu cleanup.

close agora fecha o gate DOM imediatamente e usa setVisible normal. hidden é
constante no JSX/SSR: o React não pode reaplicar false de um render antigo.
Somente a operação atual revalidada abre o gate por ref; visible serve ao status
e à apresentação. Não foi introduzido microtask/timer para contornar lifecycle.
Gerações, abortos, invalidation, verificações após awaits, sessão antes/depois da
permissão, deadline8s, expiração absoluta, logout e troca de identidade permanecem.
Teste novo verifica hidden dentro da mesma pilha síncrona de pagehide, antes de
esperar render/paint. Casos existentes retêm respostas reais produzidas, inclusive
transporte controlado que ignora aborto, além de mudança de props/unmount.

### Hidratação e diagnóstico do navegador

Busca anterior à instrumentação não encontrou cz-shortcut-listen no projeto.
Depois da edição, as ocorrências são intencionais nos testes e neste registro.
HTML HTTP e DOM hidratado de perfil temporário limpo não têm o atributo; entrada,
recarga e histórico não geraram hydration mismatch. Contexto separado inserindo
o atributo antes da hidratação reproduziu1 aviso de hidratação esperado, sem
flushSync ou pageerror. Resultado compatível com mutação externa do DOM por
extensão/userscript; não identifica a extensão no navegador do usuário, cujo
perfil não foi inspecionado. Não se adicionou suppressHydrationWarning nem se
desligou SSR. Não houve alteração no body para esconder o diagnóstico.

Monitor compartilhado verifica console.error/warn e pageerror nas duas suítes.
Só persiste categorias/contadores, sem mensagens, URLs, argumentos ou stacks do
navegador. Diagnósticos de recursos das APIs negadas/falhas intencionais são
delimitados por origem/caminho/status. Aviso Chromium de preload não usado de
recurso /_next/ ou da marca SVG local da própria origem é contabilizado como preloadHint, aviso de
desempenho separado; não é ignorado por regex genérica de warning. Demais avisos,
erros de recursos, React/hidratação e pageerror falham a suíte.

A instrumentação revelou resource404 fora da API no Chromium completo; declarar
o ícone existente /brand/slomski-solutions-mark.svg no metadata eliminou o404.
Teste confere link do ícone e resposta200. Não foi adicionado asset/dependência.
Primeiras execuções UI falharam pelo novo monitor, apesar de fluxos passarem:
404 e, após resolvê-lo, aviso de preload. São diagnósticos distintos dos anexos.
Uma tentativa do novo caso de histórico também encontrou ERR_ABORTED durante
redirecionamento legítimo; espera por commit aceita somente esse cancelamento,
mantendo asserções obrigatórias de URL/login e ausência dos dados privados.

### Verificação e entrega

Concorrência: node --test tests/ui/race.test.mjs passou29/29, zero skips
(13 cenários,15 SQL compartilhados e principal). Inclui fluxo real de entrada,
recarregamento, logout/histórico,11 cenários de corrida preservados e diferencial
de mutação externa. A contagem SQL é compartilhada, não deve ser somada como
testes distintos entre suítes. O aviso de hidratação induzido fica isolado do
perfil principal, que exige zero diagnósticos inesperados.

Lint e typecheck aprovados. Doctor/validate e verify --product aprovados na
verificação parcial (29 testes Node offline; sem alegar prontidão integral).
Resultados finais UI, preservação dos artefatos e validação documental abaixo.

Fechamento: npm run test:ui29/29, zero skips (13 cenários UI,15 SQL e principal).
Contadores finais: flushSync0, hydration0, consoleError0, consoleWarning0,
pageerror0; preloadHint1, recurso local de desempenho explicitamente separado.
O ícone local também pode originar o aviso de preload, por isso a categoria
permite somente recursos /_next/ e a marca SVG exata da própria origem. Não foi
alterado preload/priority da aplicação para silenciar otimização do navegador.
Lint/typecheck finais aprovados. Links/âncoras, UTF-8 estrito, fences Markdown,
validação Harness e git diff --check aprovados; diff exclusivo validado por
git apply --check --reverse. Todas18 capturas geradas como efeito da suíte foram
restauradas do snapshot desta rodada:18 PNGs+README e3 referências idênticos por
SHA-256 (22 artefatos). Sem atualização visual ou edição das referências oficiais.
Limpeza confirmada pelos runners:0 recursos restantes, metadados/ACLs protegidos
inalterados. Rodadas diagnósticas intermediárias também limparam as fixtures;
elas não são contadas como aprovação. HTTP/SQL usam somente o banco descartável,
sem execução DML/leitura de usuários no banco original.

Diff exclusivo desta correção: C:\Users\thiag\AppData\Local\Temp\ui-001-react.diff.
Prompts/histórico anteriores preservados; [pedido integral](../../prompts/2026-10-29-react-console.md).
Revisão humana pendente; ajuste visual não continuado. Sem build/audit novo,
CI remoto, commit, push ou publicação. Apenas Next/Chromium e PG descartáveis
locais dos testes existentes; cada rodada registra limpeza e metadados/ACLs
protegidos inalterados, sem ler usuários ou mutar o banco imobilead original.

## Revalidação periódica estável — 30/10/2026

### Contrato e diagnóstico

UI-001, correção funcional explicitamente autorizada pelo pedido atual. Base
main/80297adbc641c5e99c3bc8485bfebe72ab61fd77 com alterações anteriores preservadas
em C:\Users\thiag\AppData\Local\Temp\ui-001-revalidation-before-4385d85b.
Trabalho sequencial pelo orquestrador, sem delegação; autorrevisão, revisão humana
pendente. Escrita: components/ui/Area.tsx, tests/ui/races.mjs e console.mjs, esta evidência,
prompt integral/índice e memória do projeto. Sem continuação visual, alterações
de APIs/banco/dependências, commit/push/publicação. Verificações: regressões
Chromium de concorrência, UI completa, doctor/validate/verify; uma reprodução
prévia e até duas correções por hipótese nova. Fixtures locais descartáveis
existentes, sem leitura de usuários/mutação no imobilead original.

Diagnóstico Network confirmado pelo usuário: sem requisição Document ou navegação
para /area durante o efeito; apenas fetch de Area.tsx, session → usuário → session,
todos HTTP200. Isso descarta refresh real no diagnóstico informado. Causa no
código: o intervalo30s executava check(), que sempre chamava close(), ocultando
e revelando conteúdo durante consultas válidas. Regressão Chromium adicionada
antes da correção reproduziu a ocultação com a primeira sessão200 retida; falhou
na expectativa de visibilidade, como esperado, sem aprovar o defeito. Fixture
limpa ao final,0 recursos restantes e metadados/ACLs protegidos iguais.

runtime.lastError/message channel closed é diagnóstico das extensões do Chrome
informado pelo usuário. Nenhum tratamento/supressão foi adicionado à aplicação.

### Modos e garantias

| Gatilho | Comportamento |
| --- | --- |
| Montagem inicial e retry manual | Restritivo, fecha antes de fetch |
| Intervalo30s | Fundo somente com snapshot validado, gate aberto, página visível, mesma identidade/props e prazo local válido; não substitui operação pendente |
| focus, pageshow e retorno visibilitychange | Restritivo, invalida geração anterior e fecha antes de consultar |
| Afastamento visibilitychange/pagehide | Fecha imediatamente e cancela; sem consulta enquanto oculta |
| Troca de data/identidade | Layout effect cancela e fecha antes da pintura; novo efeito inicia restritivo |
| Expiração local | Timer absoluto fecha/cancela e redireciona, mesmo com fetch pendente |
| Logout | Fecha antes do POST, invalida check pendente e fecha antes do redirect |
| Desmontagem | Fecha, desativa operação e cancela timers/listeners; resposta antiga não revela |

Somente a operação atual pode revelar o gate após sessão inicial, consulta
autorizada e sessão final válidas. Fundo bem-sucedido não escreve hidden nem
altera estado visible; sem layout/foco/scroll/navegação/remount forçados.
401/expiração fecham antes de /login;403 da consulta e identidade divergente
fecham antes de /area (destinos de recuperação já existentes). Outras falhas,
incluindo403 de sessão, JSON inválido, sessão ausente/inconsistente, prazo de
sessão diferente e usuário divergente, fecham e apresentam recuperação restritiva.
Resposta de usuário agora é lida: exige projeção coerente e id visível; para
admin valida sequência de ids/cursor da página visível e consulta a paginação
atual. Mudança dos ids da listagem exige nova validação restritiva do snapshot.
Conferência de sessão final preservada; prazo absoluto não é renovado.
AbortController, geração, descarte após cada await, gate SSR hidden constante,
deadline8s, proteção de histórico e cancelamento em cleanup permanecem.

### Verificações desta rodada

| Verificação executada | Resultado |
| --- | --- |
| node --test tests/ui/race.test.mjs |50/50, zero skips:34 cenários Chromium,15 SQL compartilhados e principal |
| npm run test:ui |29/29, zero skips:13 cenários UI,15 SQL compartilhados e principal |
| doctor, validate, verify --product | Aprovados; verificação parcial, readiness not-assessed;29 Node offline comprovados |
| Lint e TypeScript sem incremental | Aprovados após os ajustes finais dos testes |
| Preservação visual |18 PNGs+README e3 referências:22 artefatos idênticos ao snapshot por SHA-256 |

O sucesso periódico reteve cada uma das três respostas HTTP200 reais e entregou
uma a uma, executando o callback real do intervalo30s capturado pelo transporte
de teste. MutationObserver verificou zero mudanças em hidden; amostragem por
requestAnimationFrame verificou foco, scroll não nulo e geometria durante todo
o ciclo; requisições confirmaram exatamente session → usuário → session, zero
navegações e zero Document dentro desse ciclo. Não houve aceleração do intervalo
no código do produto. A suíte completa de UI também exercitou a revogação com o
intervalo real30s, sem callback manual.

Novos cenários negativos cobrem sessão inicial401/403, ausente/inválida, identidade
divergente, usuário401/403/divergente, resposta inconsistente/JSON inválido,
conferência final503/identidade/expiração/prazo divergentes, expiração local com
transporte pendente, respostas antigas após retorno/foco/pageshow e troca de
identidade, logout antes do POST e da navegação. Transporte ignora abort nos
cenários controlados: geração e validade precisam impedir revelação por si.
Eventos de retorno são sintéticos, enquanto componente/HTTP/Next/PG são reais.
Navigation API do Chromium registra o estado do gate sincronicamente no evento
navigate; regressões confirmam fechamento antes da tentativa de redirecionamento.
Nos novos casos negativos, o listener de teste cancela a navegação nesse evento
para inspecionar o documento de origem e impedir que checks do destino interfiram
na resposta retida. Confere também o destino exato /login ou /area. Essa
instrumentação existe somente nos testes; os redirects reais continuam cobertos
pelos casos anteriores de concorrência e pela UI completa. O caso de usuário
divergente mantém todos os outros campos válidos, isolando a comparação do id.
Expiração pendente executa o callback real do timer com Date.now exatamente no
expiresAt recebido, sem esperar uma hora nem alterar o prazo do produto.

Monitor compartilhado contou console/pageerror e navegações/Document em ambas
as suítes. UI completa: flushSync0, hydration0, consoleError0, consoleWarning0,
pageerror0; preloadHint1 local, contabilizado separadamente como antes;80 eventos
de navegação principal e39 Document durante todos os fluxos deliberados da suíte.
Essas contagens globais incluem entrada/logout/recarga/histórico; não representam
o ciclo periódico válido, que manteve ambos em zero. Cenários principais de
concorrência sem diagnósticos inesperados; a mutação externa controlada já
existente reproduziu1 hydration warning esperado somente no contexto isolado.

Falhas intermediárias não são aprovação: após a reprodução prévia, a primeira
execução funcional encontrou uma corrida de navegação do teste de histórico e
uma inspeção bloqueada pelo redirect pausado na fixture. Encerrado somente seu
Chromium, deixando o runner limpar banco/Next/recursos. Na tentativa seguinte,
a espera incorreta por /login após voltar à home pública foi identificada e
o teardown revelou route.fetch ainda em andamento ao descartar o contexto.
A fixture passou a registrar o gate no evento navigate, permitir navegação,
aguardar load no histórico e drenar rotas antes de fechar o contexto. Nenhum
erro de extensão foi capturado ou suprimido. A execução completa seguinte50/50
confirmou a correção do teste e da aplicação.

Ao fortalecer os casos de id divergente/expiração exata, duas checagens
direcionadas ficaram pendentes na interação de redirecionamento para a mesma
URL com rotas retidas. Não foram consideradas aprovação. Mudança de estratégia:
os novos testes negativos agora inspecionam/cancelam o evento navigate no
documento de origem, enquanto os fluxos existentes mantêm navegação real.
As duas árvores de teste foram encerradas após identificação dos PIDs. Limpeza
específica: bancos/roles próprios identificados pelos client_port das conexões
dos runners (sem consulta de dados pessoais),2 bancos e4 roles removidos,0 desses
recursos restantes;2 diretórios de fixture removidos após conferir fronteira
absoluta em Temp. Metadados/ACLs de relações/schemas protegidos iguais antes e
depois dessa limpeza. Não houve remoção por prefixo nem operação no imobilead.
Após essa mudança de estratégia, a suíte completa de concorrência foi novamente
executada:50/50, zero falhas/skips, incluindo id divergente com payload válido e
timer no prazo exato. Cleanup final confirmado pelo runner,0 recursos próprios,
metadados/ACLs protegidos iguais. Esse é o resultado final da suíte registrado
na tabela; não há checagem direcionada pendente.

Os runners concluídos confirmaram cleanup,0 recursos restantes e metadados/ACLs
protegidos iguais; as tentativas interrompidas tiveram a limpeza específica
descrita acima. Capturas geradas pela UI foram restauradas do snapshot,
preservando o escopo funcional. Build, audit, CI remoto e revisão independente
adicional não executados nesta rodada; revisão humana pendente.

Prompt integral: [registro](../../prompts/2026-10-30-revalidacao-sessao.md#prompt-integral).
Diff exclusivo: C:\Users\thiag\AppData\Local\Temp\ui-001-revalidation.diff, contra
o snapshot anterior desta rodada. Diff acumulado UI-001 atualizado em
C:\Users\thiag\AppData\Local\Temp\ui-001.diff, contra HEAD80297ad (inclui arquivos
novos e alterações anteriores preservadas). Sem staging/commit/push/publicação.
Fechamento: ambos os patches passaram git apply --check --reverse; git diff
--check, UTF-8 estrito dos9 arquivos, links locais, fences Markdown e validate
final aprovados. Inventário de processos sem runner UI/Next de fixture ativo.
