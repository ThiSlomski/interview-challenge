# REG-SUCCESS-UI-001 — largura da conclusão, 30/10/2026

## Contrato da etapa independente

Base main/75da9731ad7c8a63d163e580eb46c2fbfcb1a7fd, árvore inicialmente limpa.
Pedido atual: padronizar largura/alinhamento/responsividade da conclusão com o
cadastro e investigar o foco amarelo sem remover o anúncio acessível.
Orquestrador único escritor, sem delegação: tarefa pequena; autorrevisão sequencial.
Skills resume-project, deliver-requirement, verify-delivery e record-decision.
Tempo operacional 30 minutos; uma execução e até duas correções com hipótese nova.

Escrita: RegistrationForm.tsx, globals.css, testes UI diretamente relacionados,
capturas do sucesso, pedido/evidência e referências documentais da etapa.
Aceite: mesmo contêiner registration-content de 920px, shell/breakpoints existentes,
título/descrição/resumo/clima alinhados e cartões de largura idêntica; sem overflow
em desktop/tablets/celulares. Foco no h1 preservado, Tab alcança login com indicador
visível; resumo sem senha e previsão preservados; rodapé em fluxo e ao final.
Excluídos: lógica de cadastro/Zod/clima/auth/sessão, APIs, banco/migrations,
dependências, cabeçalho/rodapé. Sem commit/push/publicação.
Runner existente usa somente fixtures PostgreSQL descartáveis locais e clima
interceptado. Não usar cadastros persistentes nem executar migrations persistentes.

## Evidências e resultados

[Pedido integral](../../prompts/2026-10-30-registration-success-layout.txt).

Reprodução antes da edição do produto em Chromium/Next:1440px, formulário com
x260/largura920; introdução do sucesso x140/largura760 e cartões x140/largura840.
O estado de sucesso retornava fragmento fora de registration-content, aplicando
os limites antigos de page-heading/form-card. Baseline corrigido29/29, zero skips.
Primeiro probe falhou por localização sintética divergente da fixture meteorológica;
correção só no teste para locationInput compartilhado. Cleanup0/metadados protegidos
iguais nas duas execuções; nenhuma mudança funcional para resolver a fixture.

Solução: o fragmento do sucesso passa a ser div.registration-content, exatamente
como o formulário. Nenhuma regra de largura nova:100%/max-width920px/margens auto,
page-heading/form-card100% sem limite próprio, shell32px laterais ou16px até640px.
Record segue duas colunas e uma até640px. Desktop1440:920px/x260; tablet922:858px/
x32; celular390:358px/x16. Resumo e Weather mantêm conteúdo e organização interna.

Contorno: useEffect e requestAnimationFrame já focam h1 tabIndex=-1 após o cadastro;
o seletor global :focus-visible usa3px amarelos/offset5px. Sua exibição depende da
modalidade anterior (baseline por clique:sem outline). Mantidos ref/tabIndex e ambos
os focos; regra restrita a h1 programaticamente focável dentro da introdução do
cadastro remove somente outline, preservando a semântica de heading e destino de
foco. Links/campos/botões mantêm indicadores globais. Testes novos submetem por
teclado, conferem h1 focado sem outline e Tab para login com outline visível, depois
retorno ao início. Anúncio real por leitor de tela requer avaliação humana.

Nove viewports:1440×1000/2400,922×2048,768×1024,700×900,390×844,320×740,
720×500 (layout equivalente a zoom200%) e390×420 (área reduzida). Comparação direta
formulário→sucesso de todas as extremidades e larguras, sem overflow; rodapé após
clima e ao final do documento/viewport, senha ausente, ícone visível e links corretos.
Esses nove testes interceptam POST201 e REST meteorológico; o runner geral preserva
cadastro HTTP/PostgreSQL real em fixture descartável e regressões do clima.

[Desktop](registration-success-captures/desktop.png),
[tablet](registration-success-captures/tablet.png) e
[celular](registration-success-captures/mobile.png) inspecionados visualmente.

Build, lint, typecheck e Harness doctor→validate→verify --product aprovados.
Harness permanece partial:true/readiness:not-assessed, Node69/69 comprovados;
isso não é avaliação integral do produto. Regressão UI87/87 aprovada, zero falhas/
skips, incluindo nove cenários novos e regressões do clima (timeout/cancel/retry).
Console/hydration/pageerror0; preload hints registrados separadamente. Cleanup
confirmado, zero recursos próprios restantes e metadados protegidos iguais.
[Resultados sanitizados](registration-success-results.json) e
[hashes](registration-success-hashes.json): somente par03 alterado,26 PNGs
anteriores idênticos e três novas capturas. Links locais e diff --check aprovados.

Arquivos de produto:components/ui/RegistrationForm.tsx e app/globals.css.
Testes:tests/ui/browser.mjs e novo registration-success-layout.mjs. Documentação:
este contrato/evidência, resultados/hashes, pedido integral, AI_PROMPTS,
REQUIREMENTS, ARCHITECTURE, referências em ui.md/galeria e checkpoints do projeto.
Ferramenta Python indisponível para hashes; cálculo feito com Node/crypto local.
Extração inicial do relatório falhou duas vezes pela codificação UTF-16 dos logs
PowerShell; leitura corrigida por BOM, sem repetir testes. Validate intermediário
apontou JSON ainda ausente; após sua geração, validate final e diff --check passam.

Revisão própria sequencial. Revisão humana, leitor de tela, zoom real, teclado
virtual físico, outros navegadores e CI remoto não executados. Sem commit/push/
publicação ou alteração persistente de banco. Nenhuma próxima etapa iniciada.
