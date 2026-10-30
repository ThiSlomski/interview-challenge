# ADMIN-DELETE-UI-001 — contraste danger, 30/10/2026

Contrato: ajuste visual isolado sobre o estado não commitado de ADMIN-DELETE-001.
Um escritor/orquestrador, sem delegação por escopo pequeno. Produto: somente
app/globals.css nos estados de button.danger; nenhum texto/comportamento/rota/
autorização/schema/grant alterado. Cancelar e seu foco inicial preservados.
QA: helper de aparência no browser administrativo existente, estado real de mouse/
teclado/disabled em1280x900 e390x844, contraste renderizado mínimo4.5:1, foco amarelo.
Capturas permitidas: par06 administrativo e novo par10 de confirmação aberta.
Demais16 capturas e3 referências devem manter SHA256. Testes usam exclusivamente
fixtures descartáveis existentes; nenhuma interação com cadastros persistentes.
Sem commit/push. Uma execução e até duas correções por hipótese nova; revisão
própria, revisão humana pendente. Skills deliver-requirement/verify-delivery.

Baseline incremental (preserva alterações anteriores):
`C:\Users\thiag\AppData\Local\Temp\admin-delete-visual-hNQmx2`.
baseline.json registra hashes de126 fontes/artefatos; globals-before.css,
browser-before.mjs e gallery-before.md preservam os arquivos compartilhados.

Referência de cálculo: [WCAG2.2 SC1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
Luminância relativa sRGB linearizada, razão(Lmaior+.05)/(Lmenor+.05), comparação
sem arredondar com4.5. Cores obtidas por getComputedStyle e rasterização CSS em
canvas1px para resolver color-mix. Inspeção envolve pixels de cores sólidas,
não amostragem antialias do texto. Disabled também será mantido legível acima4.5.

## Reprodução e correção

Antes de alterar CSS, Chromium reproduziu no diálogo texto#ffb4ab sobre#f5c542,
razão1.046820961:1 normal/foco, enquanto hover usava outra combinação legível.
O primeiro cenário falhou como esperado por contraste/padrão incompatível;
cleanup0 e metadados protegidos iguais. appearance-before.json no snapshot
preserva leituras de ambos botões em desktop/celular.

A causa era a combinação da regra global button (fundo amarelo) com .danger
(texto rosa), e de button.secondary:hover no card. Correção só em CSS:
button.danger e seus estados próprios reutilizam tokens existentes; hover/active
declaram também texto claro para vencer a regra secondary anterior. O primeiro
ajuste já passou36/36, mas inspeção do relatório mostrou amarelo no hover do card;
o refinamento igualou texto/fundo dos dois botões em todos estados. Asserts de
igualdade de paleta foram acrescentadas, sem mudar aplicação/fluxo.

| Estado, em ambos botões | Texto renderizado | Fundo renderizado | Contraste |
| --- | --- | --- | --- |
| Normal |#f4f4f2|#281716|15.574619987:1|
| Hover |#f4f4f2|#613835|8.972173280:1|
| Active |#f4f4f2|#442825|12.099501899:1|
| Focus-visible |#f4f4f2|#281716|15.574619987:1|
| Disabled |#a7aaae|#171a1d|7.491432971:1|

Hover usa color-mix sRGB de danger-bg com40% danger-border; active usa20%.
Hex e razões acima são as cores resolvidas em8bits pelo navegador. Border normal
#b66a63, hover/active#ffb4ab; disabled#30343a, sem reduzir opacity (1) e cursor
not-allowed. Foco global amarelo#ffda62,3px,offset5px preservado. Cancelar não foi
estilizado por esta mudança e continua com foco inicial; suas cores são comparadas
com a reprodução anterior. Nenhum token/paleta paralela foi criado.

## Validação e escopo

App alterada nesta etapa: somente app/globals.css. Testes:
tests/admin-delete/browser.mjs importa um cenário visual e
tests/admin-delete/appearance.mjs mede estados renderizados, mouse down/up fora
do botão (sem acionar exclusão), Tab/Shift+Tab/focus-visible, Cancelar inicial,
overflow e pending/disabled. A requisição usada apenas para medir disabled é
interceptada antes de alcançar servidor e retorna503 sintético; uma recarga real
limpa esse aviso antes das capturas. Demais11 cenários funcionais seguem íntegros.
Capturas administrativas usam somente dados sintéticos existentes na fixture.

UI validada em viewports1280x900 e390x844, com mouse e teclado reais do Chromium,
não pseudo-classes forçadas. Não é ensaio em aparelho físico nem outros browsers.
Inspector visual do agente conferiu lista e diálogo em desktop/celular.
Sem modificação de textos, componentes, API, autorização, fluxo, grants, banco
persistente, dependências, CI ou README do desafio. Alterações anteriores preservadas
por snapshot relativo, sem commit/push. Revisão humana/CI remoto do diff pendentes.

Lint e typecheck aprovados. doctor/validate/verify --product aprovados; Harness
parcial/readiness not-assessed, Node62/62. UI36/36 na execução com paleta final,
zero skips/falhas/cancelamentos, cleanup0/metadados/ACLs protegidos iguais.
A execução final gravou as capturas normais após recarga e confirmação com
Cancelar focado por teclado:36/36, zero falhas/skips/cancelamentos. Inspeção visual
posterior confirmou lista sem aviso simulado e foco amarelo no Cancelar, sem
cortes/overflow em ambos viewports. Lint/typecheck finais também passaram.

## Capturas, hashes e preservação

Atualizadas06-area-admin-desktop.png/mobile.png; acrescentadas
10-exclusao-confirmacao-desktop.png/mobile.png, na galeria canônica.
Os demais16 PNGs de aplicação e3 referências estão idênticos por SHA256,
19/19 preservados. [Manifesto completo antes/depois e leituras](admin-delete-visual-hashes.json).
As propriedades renderizadas de Cancelar coincidem integralmente com a reprodução
anterior em ambos viewports. A comparação de126 arquivos só detectou, entre fontes
existentes, globals.css e o hook de teste browser; API/componentes/textos/fluxos/
schema/grants/CI/dependências/README permaneceram iguais ao início desta etapa.
A galeria recebeu apenas as duas alterações06, o novo par10 e seu README.

Hashes finais das imagens administrativas:

| Arquivo | SHA256 |
| --- | --- |
|06-area-admin-desktop.png|13865d1914f2c27da9c2eb1542672ef018dde9d249d4e99b1ef0dae875fab065|
|06-area-admin-mobile.png|31f2e25978f37f15ba86f19bb43d4ca5c2531f52462dc9300280a4c801b64064|
|10-exclusao-confirmacao-desktop.png|2645adf2b7832cda782828cd5edfa42fdb59a8ee3f1f1286d73cd4d7baaa750a|
|10-exclusao-confirmacao-mobile.png|bb2d9c1121f4b7ece550c8e2970820cf1cebb512ac69d1940d547716367c3600|

Diff incremental de CSS versus o estado dirty anterior: visual-css.diff no
diretório de baseline. Não confundir com o diff acumulado da exclusão funcional.
Arquivos desta etapa: app/globals.css; tests/admin-delete/{browser,appearance}.mjs;
os4 PNGs acima e README da galeria; esta evidência e admin-delete-visual-hashes.json;
docs/prompts/2026-10-30-admin-delete-visual.md; docs/AI_PROMPTS.md;
docs/harness/memory/{handoff,project-state,index}.md. Nenhum outro arquivo desta
etapa foi editado e nenhuma alteração anterior foi revertida.
