# HOME-UI-001-F1 — complemento compartilhado, 30/10/2026

## Contrato e baseline incremental

Pedido atual incorpora rodapé compartilhado ao refinamento da home, superando
somente a restrição anterior de não reformular o rodapé. Base Git continua
main/b231c0c69a4b7cbfd025d4cc1574a779c58313a2;17 arquivos anteriores pendentes
preservados. Snapshot pré-complemento (inclui fontes alteradas, PNGs e referências):
`C:\Users\thiag\AppData\Local\Temp\home-footer-refinement-NeHKTl`.
baseline.json e before/ registram exatamente esse estado. Não é baseline limpa.

Escrita: app/layout.tsx e app/globals.css no produto; testes de UI/capturas e
documentação/evidência/memória do projeto. Um escritor/orquestrador, execução e
autorrevisão sequenciais, sem delegação por escopo delimitado. Skills de entrega
e verificação mantidas. Nenhuma mudança em autenticação/APIs/banco/autorização,
clima ou demais fluxos. Sem commit/push/deploy. Revisão humana/CI remoto pendentes.

Footer único no RootLayout: mesma marca local do header, slogan exato e copyright
estático2026. Três áreas acima de768px; empilhamento centrado abaixo/igual768px.
Corpo flexível mínimo100dvh e main expansível compartilhados, sem fixed/altura
fixa. Home mantém seu hero e painel; textos/controles das outras páginas intactos.
Um link no fim da sequência de foco, no lugar do link anterior do rodapé;
marca leva à home com nome acessível e imagem de alt vazio.

Aceite: home/cadastro/confirmado/login/user/admin, páginas curtas/longas, desktop,
tablets922x2048/1180x820, celulares390/320px, zoom200%, fonte ampliada e teclado.
Sem overflow/sobreposição/vazio abaixo do rodapé; console/hidratação/pageerror0,
lint/tipos/build e doctor→validate→verify, diff --check. UI usa fixtures locais
descartáveis existentes; nenhuma conta persistente acessada. Uma execução e até
duas correções por nova hipótese; depois mudar estratégia ou registrar limite.

Capturas: atualizar somente PNGs que mostram o rodapé alterado; preservar por
SHA256 as demais capturas e referências. Estados/fixtures/foco existentes serão
reutilizados, sem esconder conteúdo da aplicação. Diff incremental F1 e diff
acumulado home+rodapé serão produzidos no diretório temporário acima.

## Resultados

| Verificação local | Resultado |
| --- | --- |
| `node --test tests/ui/home.test.mjs` | 64/64, zero skips:34 home +6 páginas de produção +23 SQL +principal |
| `npm run test:ui` com matriz/capturas do footer | 51/51, zero skips; home, cadastro vazio/erros/concluído, login, user/admin e indisponibilidade |
| `npm run test:admin-delete:ui` | 36/36, zero skips; estados de mouse/teclado, modal e rodapé administrativo |
| Chromium desenvolvimento e produção HTTPS | Rodapé único, textos exatos, logo local, páginas curtas/longas e sessões reais |
| Desktop/tablets/celulares | 1440x1000,922x2048,1180x820,390x844,320x740 e720x500; sem overflow/sobreposição |
| Zoom200% | Zoom real Chromium confirmado em dev/produção, público/autenticado; layout720x500 nas demais páginas |
| Texto ampliado | Textos do rodapé a200% em922/390/320px; home também com fonte global200% |
| Teclado | Skip-link/ordem existente preservados; um link no rodapé, nome acessível, contorno visível |
| Contraste sRGB | Slogan18.10:1; copyright8.54:1; marca12.29:1 |
| Lint / typecheck / build | Aprovados; build raiz Turbopack e cópia real de produção Webpack |
| Harness | doctor/validate/verify --product aprovados,62/62 Node;partial:true/readiness:not-assessed |
| Capturas | 20 PNGs atualizados, incluindo rodapé atrás dos diálogos; três referências iguais por SHA256 |
| Banco/processos | Cleanup confirmado, zero recursos próprios; metadados/ACLs protegidos iguais |

Console/hidratação/pageerror: zero erros inesperados em todas as suítes; home
e zoom real com contagem absoluta0. Os testes negativos existentes mantêm suas
respostas HTTP sintéticas esperadas, sem ocultar erros de aplicação/React.
O rodapé termina na base do documento e nunca acima da base da viewport;
seu topo fica após o main mesmo com textos longos. Inspeção visual de home,
tablet retrato, cadastro concluído, login, indisponibilidade e modal administrativo.
Sem novos recursos externos, bibliotecas ou animações.

## Ajustes da verificação

A primeira sondagem de fonte alterava todos os rem da aplicação em320/390px e
atingia botões/skip-link de outras telas fora do escopo. A verificação extra foi
delimitada aos textos do rodapé; zoom200% continua validado de forma independente.
Nenhum formulário/botão foi modificado para adaptar esse teste. Uma verificação
intermediária da data meteorológica sintética falhou; a repetição completa passou
sem alterar clima. Falhas intermediárias não são contabilizadas como aprovação.

Para capturar06/10 nos mesmos estados históricos, a primeira conta-alvo da
fixture recebeu UUID máximo: ordem estável próprio→alvo. O diálogo é aberto por
teclado no final do documento, mantendo o rodapé visível ao fundo. Só código de
testes/fixtures mudou; nenhuma exclusão ou promoção em banco persistente.

As capturas01 preservam o hero aprovado. Os pares02/03/04/06/07/08/09/10 são
regerados pelos mesmos runners/estados de origem, com o rodapé novo. O par08
mantém autofill/foco e503 sintético;03 mantém clima sintético e mensagem escapada.
O [manifesto](home-footer-refinement-hashes.json) compara o snapshot pré-F1 com
os arquivos atuais, incluindo as três referências intocadas. O manifesto da
primeira entrega da home continua histórico, sem sobrescrita.

## Preservação, diffs e limites

app/page.tsx não foi alterado neste complemento. Já continha no snapshot anterior
o crédito “Desenvolvido por Thiago Slomski”; essa edição prévia foi preservada.
O diff incremental footer-only.diff compara before/ ao estado final. O diff
acumulado home-footer-exclusive.diff usa HEAD mais esse crédito prévio como
baseline, reunindo somente home+rodapé e respectivos testes/documentação/PNGs.
Ambos ficam no diretório temporário do contrato; incluem arquivos novos/binários
e passam em git apply --check --reverse. Nenhum diff inclui segredos/env local.

Fontes funcionais de cadastro/login/sessão/logout/autorização/APIs/banco/clima/
área/admin e dependências intactas. A navegação da marca do rodapé para a home
é a substituição visual explicitamente autorizada; fluxos funcionais preservados.
Logs: ui-footer-final.log, footer-production-final.log, admin-footer-captures-final.log,
build.log e verify.log no snapshot. Aviso React18/Next16 preexistente preservado.
Autorrevisão sequencial; revisão humana e CI remoto do diff pendentes. Nenhuma
prontidão integral declarada; sem commit, push ou deploy.
