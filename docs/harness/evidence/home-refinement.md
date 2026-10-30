# HOME-UI-001 — composição da home, 30/10/2026

Complemento posterior autorizado: [rodapé compartilhado F1](home-footer-refinement.md).
O registro abaixo retrata a primeira entrega. O complemento supera a restrição
ao shell exclusivo da home e atualiza a galeria/hashes atuais, preservando o hero.

## Contrato e baseline

Pedido atual: refinar somente a composição da página inicial. Base limpa
`main/b231c0c69a4b7cbfd025d4cc1574a779c58313a2`. Orquestrador como único
escritor, execução e autorrevisão sequenciais, sem delegação por escopo delimitado.
Skills resume-project, deliver-requirement e verify-delivery.

Produto: app/page.tsx e regras da home em app/globals.css. Shell vertical
restrito à home usando body:has(> .home), preservando composição das outras rotas.
Remover card redundante, acrescentar painel sem interação com três benefícios
do pedido e SVGs locais. Duas colunas >=1100px; uma coluna abaixo desse limite.
Sem nova dependência, imagem externa, movimento ou lógica funcional.

Aceite: Chromium desenvolvimento e build de produção local com TLS, estados
público/autenticado em desktop1440x1000, tablet922x2048/1180x820,
celular390x844/320x740 e layout equivalente a zoom200%720x500. Teclado,
skip-link/foco, links reais, overflow, rodapé, console/pageerror. Regressões UI
existentes, lint/tipos/build, doctor→validate→verify e diff --check.
Somente fixtures PostgreSQL descartáveis do runner existente; nenhum cadastro
ou sessão persistente acessado. Uma execução e até duas correções por hipótese
nova. Revisão humana e CI remoto do diff pendentes. Sem commit/push/deploy.

Capturas autorizadas: quatro PNGs 01-home normal/foco desktop/mobile. Demais
16 PNGs e referências preservados por SHA256. Manifesto antes/depois acompanha
esta evidência. Capturas adicionais de tablet/zoom e diff exclusivo ficam em:
`C:\Users\thiag\AppData\Local\Temp\home-refinement-8f440b9e96df4ea595b6d4169a86d1c2`.

## Resultados

Chromium reproduziu antes da alteração, em922x2048: footerBottom1050.015625,
card redundante presente e nenhum overflow. Captura anterior no diretório
temporário acima. Após a alteração, rodapé no fim do documento e nunca acima
da base da viewport, painel abaixo dos botões em922px e colunas preenchidas
em1440/1180px. Sem altura fixa/overflow oculto ou alteração do layout compartilhado.

| Verificação local | Resultado |
| --- | --- |
| `node --test tests/ui/home.test.mjs` | 58/58, zero falhas/skips;34 cenários home +23 contratos SQL +principal |
| `UI_UPDATE_CAPTURES=false npm run test:ui` | 51/51, zero falhas/skips;27 cenários UI/clima +23 SQL +principal |
| Chromium dev e produção HTTPS local | Público e sessão real em todas as dimensões; consoleError0/pageerror0 |
| Zoom200% real | API chrome.tabs.setZoom/getZoom confirma2 em ambos modos, público e autenticado;720px CSS a partir de1440px |
| Fonte200% | 1440/922/390/320px nos dois modos/estados; sem overflow |
| Teclado | Ordem de tabulação, contorno visível, skip-link→main, botões e Minha área reais aprovados |
| Lint / TypeScript | npm run lint/typecheck e checks do Harness aprovados; lint do helper final também aprovado |
| Build | npm run build aprovado (Turbopack); cópia de produção também compilada via Webpack |
| Harness | doctor/validate/verify --product aprovados;62/62 Node, partial:true/readiness:not-assessed |
| Capturas | Somente quatro PNGs01-home atualizados; outros16 PNGs +3 referências iguais por SHA256 |
| Banco | Cleanup confirmado, zero recursos próprios; metadados/ACLs protegidos iguais |

Inspeção visual: desktop, celular, tablet retrato/paisagem e foco na home.
Contraste calculado com os tokens sRGB existentes: texto do painel8.05:1,
título17.05:1 e botão principal12.29:1. Ícones decorativos ocultos da árvore
acessível, seção nomeada, lista de benefícios e títulos sem controles novos.
Nenhuma dependência/imagem externa/animação adicionada. Arquivos funcionais de
cadastro/login/sessão/logout/autorização/APIs/banco/clima/área/admin intactos.

## Correções da verificação e limites

Primeira rodada: o teste novo esperava redirecionamento de /login com sessão,
mas a página existente permanece em /login; expectativa corrigida sem mudar
produto. A suíte antiga clicava no link removido e agora usa Minha área no
cabeçalho, preservando o cenário de histórico/logout. Rodadas intermediárias
ficam nos logs temporários, não contam como aprovação.

A injeção de font-size no atributo de html causava diagnóstico de hidratação
no desenvolvimento. Trocada por folha de estilo, com console0 na rodada final.
Proxy TLS do teste corrigido para não reenviar cabeçalhos ao fechar conexão.
Fixture nova passou a remover suas duas contas sintéticas antes das asserções
SQL herdadas (as sessões eram sobras da própria fixture, nunca persistentes).
Após esses ajustes,58/58 e51/51 passaram integralmente.

Zoom real é verificado por fator de zoom, viewport/overflow/geometria e sessão;
captura auxiliar usa o layout CSS equivalente720x500. A captura fullPage do
Playwright com zoom do browser recorta a superfície e não é evidência visual
válida; esse PNG temporário foi descartado. As quatro capturas oficiais usam100%.

Aviso preexistente do build: suporte React18 depreciado no Next16. Não houve
mudança de stack. Sem CI remoto ou revisão independente nesta rodada;
autorrevisão sequencial e revisão humana pendente. Não declara prontidão integral.

Logs locais: home-test-final-all.log, ui-regression-final.log, build.log,
validate.log e verify.log no diretório temporário do contrato. [Manifesto](home-refinement-hashes.json)
registra SHA256 antes/depois. Diff exclusivo completo (inclui novos arquivos e
PNG binário) em home-refinement.diff nesse mesmo diretório; baseline limpa, sem
alterações anteriores. Sem commit, push ou deploy.

## Inventário dos17 arquivos alterados

- Produto: app/page.tsx; app/globals.css.
- Testes: tests/database/integration.test.mjs; tests/ui/browser.mjs;
  tests/ui/home.mjs; tests/ui/home.test.mjs.
- Documentação: docs/AI_PROMPTS.md; docs/prompts/2026-10-30-home-refinement.txt;
  docs/harness/evidence/home-refinement.md;
  docs/harness/evidence/home-refinement-hashes.json;
  docs/harness/evidence/ui-captures/README.md;
  docs/harness/memory/handoff.md; docs/harness/memory/project-state.md.
- Capturas em docs/harness/evidence/ui-captures/:01-home-normal-desktop.png,
  01-home-normal-mobile.png,01-home-focus-desktop.png,01-home-focus-mobile.png.
