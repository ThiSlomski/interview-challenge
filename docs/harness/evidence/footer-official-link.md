# FOOTER-LINK-001 — site oficial, 30/10/2026

Contrato: restaurar o acesso oficial na marca completa do único rodapé do
RootLayout. Base main/533b184, Git inicialmente limpo. Reprodução por inspeção:
o link compartilhado apontava para `/`, sem target/rel, e os testes exigiam esse
destino. Escrita de produto apenas em app/layout.tsx e app/globals.css; testes
relacionados e registros do projeto. Sem cabeçalho, navegação, auth, APIs ou banco.

Orquestrador como único escritor; tarefa pequena, sem delegação, autorrevisão
sequencial. Skills deliver-requirement e verify-delivery. Uma execução e até duas
correções com hipóteses novas; orçamento operacional de 20 minutos.

Aceite: URL exata, nova aba, noopener/noreferrer, nome acessível, símbolo/texto
no mesmo link nativo, mouse/toque/teclado, foco visível e hover discreto sem
mudança de geometria. Logo40x40, slogan, copyright, colunas, contraste e layout
responsivo preservados. Testes existentes com matriz pública/autenticada serão
reutilizados sem atualizar capturas anteriores. Novas abas terão destino externo
interceptado localmente: não dependem da disponibilidade do site oficial.

## Implementação e verificação

Link nativo externo no lugar do Link interno, envolvendo a mesma imagem e os
mesmos spans; atributos exatamente conforme pedido. CSS acrescenta apenas a cor
accent-strong no hover/focus-visible, mantendo o contorno global3px/offset5px.
Nenhum tamanho, espaçamento, posição, breakpoint ou token de contraste mudou.
Cursor pointer e touch-action manipulation continuam nativos/compartilhados.

| Verificação local | Resultado |
| --- | --- |
| doctor → validate → verify --product | Aprovados, partial:true/readiness:not-assessed |
| Lint e typecheck sem saída incremental | Aprovados pelo verify |
| Testes Node de produto | 69/69, zero falhas/skips, prova estruturada |
| npm run build | Aprovado; aviso já existente de depreciação React18/Next16 |
| UI com FOOTER_BROWSER_TEST=true e UI_UPDATE_CAPTURES=false | 88/88, zero falhas/skips |
| Chromium produção desktop1440x1000/celular390x844 | Logo40x40 e capturas de foco inspecionadas |
| Comparação visual normal | PNGs idênticos ao restaurar temporariamente no DOM apenas os atributos antigos do link |
| git diff --check | Aprovado após consolidação documental |

O teste novo passou: clique em símbolo e texto, Enter, foco visível3px, cor de
hover/foco e geometria idêntica; toque real em contexto Chromium hasTouch/isMobile
sobre símbolo e texto. As cinco ativações abriram outra página na URL oficial,
com window.opener nulo. Destino interceptado por fixture local, sem acesso externo.
O navegador normaliza a URL de navegação com `/` final; href é exatamente o pedido.

Matriz real do rodapé em home/cadastro vazio/com erros/conclusão/login/área user/
área admin e indisponibilidade:1440x1000,922x2048,1180x820,390x844,320x740,
720x500, mais textos200% em922/390/320px. Um footer/link, sem overflow,
sobreposição, quebra de ordem, centralização incorreta ou saída do fluxo normal.
Diagnósticos UI: zero erros inesperados de console/hidratação/pageerror.
Os88 testes incluem cenários UI, regressões SQL e teste principal, não88 casos
exclusivos do link. Apenas fixture local descartável do runner existente:
cleanup confirmado, recursos remanescentes0, metadados protegidos iguais.
Nenhuma alteração funcional/API/schema/grants persistente.

Capturas novas, sem reescrever evidências anteriores:
[desktop normal](footer-link-captures/desktop-normal.png),
[desktop foco](footer-link-captures/desktop-focus.png),
[celular normal](footer-link-captures/mobile-normal.png),
[celular foco](footer-link-captures/mobile-focus.png).

Logs temporários sanitizados: `%TEMP%/footer-link-ui.log`,
`footer-link-verify.json` e `footer-link-build.log`.
Script visual temporário: `footer-link-visual.cjs`; servidor próprio encerrado.
Não houve falha de produto/correção intermediária. Houve apenas correção de
âncora de patch documental e leitura de JSON UTF16 usando ConvertFrom-Json.

Revisão própria sequencial; revisão humana, dispositivo físico e CI remoto
pendentes. Evidência local não avalia prontidão integral do produto.
Sem commit/push/publicação.
