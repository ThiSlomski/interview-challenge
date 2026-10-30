# LOGIN-UI-001 — centralização do login, 30/10/2026

## Contrato e base

Base main/37a7b8f3a3f02e1e1037186806a2c145cb2efbd6, árvore inicialmente limpa.
Pedido atual autoriza somente refinamento visual do login e verificações/capturas
diretamente relacionadas. Orquestrador único escritor; autorrevisão sequencial,
sem delegação por ser alteração pequena. Skills resume-project,
deliver-requirement, verify-delivery e record-decision.

Escrita de produto: app/login/page.tsx e regras específicas do login em
app/globals.css. Testes: tests/ui/login.mjs e integração/captura seletiva em
tests/ui/browser.mjs. Evidência, pedido integral, índice de prompts, referências
na arquitetura/requisitos e checkpoints de memória do projeto serão consolidados.
Não alterar LoginForm, API, autenticação, cookies, sessão, validação, mensagens,
rate limiting, header, footer, bibliotecas ou consultas de sessão.

Aceite: bloco 520px/100%, centralização horizontal e vertical com leve viés
superior, fluxo normal sem altura fixa/posição absoluta, ações amplas e
empilhadas em celular, rodapé existente no final. Medir desktop alto/normal,
tablet retrato/paisagem, celular320/390, viewport reduzida e zoom de layout200%.
Preservar erros, loading, teclado, Enter, foco, autofill, sessão/redirecionamento.
Uma execução e até duas correções por hipótese, tempo operacional30min.
Prontidão integral, CI remoto e revisão humana não são inferidos dos testes.

## Reprodução e implementação

O teste de viewport reduzida
simula espaço disponível com teclado; teclado virtual de dispositivo físico
exige verificação manual e não pode ser declarado comprovado por Chromium desktop.

Reprodução anterior à edição, Chromium/Next real na fixture descartável:
922×2048, header bottom105, cartão x32/largura520/top342.78. A posição esperada
horizontal era x201. Baseline24/24 inclui somente a coleta e as guardas SQL;
esse código0 não aprovou o layout anterior.

Produto restrito a markup do main/wrapper e CSS do login. Bloco520px/100%, textos
alinhados à borda do cartão, h1 limitado48px, main flex centralizado com padding
fluido limitado e viés superior. O flex expansível do body considera header e
footer naturais. Sem translate, posição absoluta, altura fixa ou override do
rodapé; conteúdo excedente segue rolável. Botão principal mínimo160px, ambos
alvos com mínimo48px, ações empilhadas até480px. LoginForm intacto, inclusive
labels/autocomplete e handler Enter/sending/feedback/redirecionamento.

Primeira rodada:53/61 aprovados, oito falhas contabilizadas (sete subtestes e
agregador). Cinco asserções comparavam topo de ações com alturas distintas apesar
do alinhamento central correto; duas selecionavam também o anúncio de rota Next.
Correção1: comparar centros e restringir alerta ao main. Segunda rodada preservada
em log temporário: duas asserções ainda pressupunham foco automático imediato no
alerta; mensagem estava visível, mas foco inativo. Isso não é atribuído ao CSS.
Correção2: testar a capacidade existente de focar o alerta acessível explicitamente;
navegação Tab/Shift e foco visível nos controles são testados separadamente.
Não alteramos nem declaramos comprovado o timing de autofocus do LoginForm.

Fixtures de erros401/503/429 são respostas interceptadas; envio fica retido para
testar busy, campos/botão desabilitados e guarda contra submit duplicado.
O cenário existente de login real cobre senha inválida e sucesso por Enter,
sessão HttpOnly, área protegida, expiração, revogação, histórico e logout.
Sucesso/erro de credenciais reais usam somente contas sintéticas descartáveis.

Capturas adicionais do estado normal: [desktop](login-captures/desktop.png),
[tablet alto](login-captures/tablet-portrait.png) e
[celular](login-captures/mobile.png). Par08 da galeria preserva seu cenário
503/autofill controlado. Inspeção visual do agente, sem edição das imagens.
Nenhuma outra captura/referência existente deve mudar.

## Resultados finais

| Verificação local | Resultado |
| --- | --- |
| npm run test:ui, rodada final |61/61; zero falhas/skips; dez cenários novos de login |
| doctor → validate → verify --product |Aprovados;62/62 Node; lint e TypeScript aprovados |
| npm run build |Aprovado; nenhuma mudança de tsconfig |
| npm run lint após correções dos testes |Aprovado |
| git diff --check |Aprovado |

[Resultados sanitizados das três rodadas](login-refinement-results.json),
[relatório Harness](login-refinement-harness.json) e
[hashes](login-refinement-hashes.json). Rodada intermediária2:58/61, duas falhas
de foco presumido e agregador. Todas as rodadas confirmaram limpeza0 e metadados
protegidos iguais; processos Next/Chromium próprios encerrados. Nenhum dado de
conta persistente lido ou alterado, nem mutação em imobilead. Console/hidratação/
pageerror0; três hints de preload no runner existente, sem erro de aplicação.

Geometria final: desktop1440×1000, bloco x460/largura520, footer bottom1000;
tablet922×2048, bloco x201/largura520, footer bottom2048. Sem scroll vertical
nesses casos. Celular390×844 tem largura358/margens16 e altura natural1031px:
rolagem acomoda header, bloco de ações empilhadas e rodapé completo. Viewports
menores mantêm controles alcançáveis pelo foco/scroll, sem recorte horizontal.
O teclado físico/Tab/Enter foi automatizado; viewport390×420 simula redução
de área. Teclado virtual real, navegadores adicionais e zoom real do navegador
não executados (720×500 é apenas o layout equivalente a200%).

Somente par08 alterado na galeria;20 outros PNGs da galeria/referências iguais
por SHA256. Três novas capturas normais inspecionadas visualmente. Produto
limitado a app/login/page.tsx e CSS específico do login; LoginForm, RootLayout,
server/API/shared/dependências intactos. Pedido integral em
[docs/prompts](../../prompts/2026-10-30-login-refinement.txt).

Autorrevisão sequencial, revisão humana e CI remoto do diff pendentes.
Harness mantém partial:true/readiness:not-assessed; sem avaliação integral de
segurança/prontidão. Sem commit, push, deploy ou etapa funcional adicional.
