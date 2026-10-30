# REG-UI-001 — centralização do cadastro, 30/10/2026

## Contrato

Base main/c10747ae160dd8734656272fc503f3ba426b3b3c, árvore inicialmente limpa.
[Pedido integral](../../prompts/2026-10-30-registration-refinement.txt).
Orquestrador único escritor, sem delegação: alteração pequena, autorrevisão
sequencial. Skills resume-project, deliver-requirement, verify-delivery e
record-decision. Tempo operacional30min; uma execução e até duas correções
com hipóteses novas. Revisão humana e CI remoto pendentes.

Produto: somente wrapper do estado de formulário em RegistrationForm e CSS
específico no globals.css. Lógica, sucesso/resumo/clima, APIs, banco, grants,
autenticação, dependências, header/footer e validações preservados.
Testes: registration-layout.mjs, integração e seleção de capturas browser.mjs.
Documentação: pedido, evidência e referências canônicas/checkpoints do projeto.

Aceite: bloco centralizado até920px com introdução/cartão de mesma largura;
início após cabeçalho, sem centralização vertical. Duas colunas confortáveis
acima720px; uma abaixo/igual720px. Campos largos e botão móvel acessível.
Rodapé compartilhado em fluxo, sem sobreposição/altura artificial.
Verificar desktop normal/alto, tablets,320/390px, largura equivalente a zoom200%
e viewport reduzida; erros locais/remotos, Enter, Tab, foco, busy e duplicação.
Sucesso real/REST clima usam runner existente e somente fixtures descartáveis.
Nenhuma conta persistente deve ser usada. Capturas alteradas limitadas aos
pares02/09 e três novas vistas normais. Teclado virtual real requer QA manual.

## Evidências

Reprodução anterior à edição em Chromium/Next real:1440×1000, introdução x140/
largura760 e cartão x140/largura840; centro do cartão560 contra centro da tela720.
Altura natural1543px. Baseline24/24, cleanup confirmado0/metadados iguais.

Implementação: wrapper somente no return do formulário,920px/100%/margens auto;
introdução/cartão ocupam a largura comum. Grid minmax(0,1fr) em duas colunas,
uma até720px, botão total até640px. Tokens e estilos compartilhados reutilizados,
sem modificar funções/validações/estado de sucesso. Capturas normais desktop,
tablet e celular inspecionadas visualmente pelo agente.

Rodada UI1:67/72, zero skips; nove geometrias aprovadas. Dois testes novos
falharam por seletor global role=alert incluindo o announcer Next e texto409
presumido. Correção limitada ao teste: alerta do main e texto existente exato.
Outras duas falhas: diagnóstico hydration1 no cenário legado de mensagens de
login/captura cadastro; sua limpeza removeu interceptações necessárias ao cenário
seguinte de campos, que também falhou. Não houve alteração funcional para
encobrir o diagnóstico; nova rodada limpa para verificar reprodutibilidade.
Cleanup da rodada1 confirmado0 e metadados protegidos iguais.

Doctor/validate/verify --product aprovados;62/62 Node, lint/tipos aprovados.
Harness permanece partial:true/readiness:not-assessed.
Rodada UI2:69/72, zero skips; os11 novos testes de cadastro passam. Mesmo
diagnóstico hydration1 no cenário35 e falha em cascata no36. Cleanup0/metadados
iguais. Probe isolado capturando09 reproduziu o diagnóstico: diff React aponta
style={{caret-color:...}} nos inputs/textarea. Playwright oculta caret por padrão
e modifica estilos inline enquanto a página está hidratando. Correção exclusiva
do teste: caret:'initial' na captura09 e nas novas capturas normais; nenhum
suppressHydrationWarning, espera arbitrária ou mudança funcional no produto.
Probe pós-correção e rodada final concluídos abaixo.

Build de produção aprovado após a alteração de produto.

Probe pós-correção24/24, sem avisos de hidratação/console/pageerror. Cleanup0 e
metadados protegidos iguais. Instrumentação temporária removida; lint final
aprovado. A configuração caret afeta somente capturas, não a UI em execução.

## Verificações e limites

| Verificação local | Resultado |
| --- | --- |
| doctor → validate → verify --product | Aprovados;62/62 Node; lint/TypeScript aprovados |
| npm run build | Aprovado |
| npm run lint após correções nos testes | Aprovado |
| Prompt integral | SHA256 idêntico ao anexo |
| validate final e git diff --check | Aprovados |
| npm run test:ui final |72/72; zero falhas/skips;11 cenários novos |
| Capturas/referências por SHA256 |Somente pares02/09 alterados;18 outros PNGs idênticos |

[Resumo sanitizado das rodadas](registration-refinement-results.json),
[Harness](registration-refinement-harness.json) e
[manifesto de hashes](registration-refinement-hashes.json).
Rodada final: console/hydration/pageerror0, três hints de preload registrados
separadamente.12 casos de foco/teclado no runner de campos, autofill nativo e
controlado aprovados. Sucesso real, resumo escapado, ausência de sessão automática,
clima e suas falhas/recuperação aprovados. Cleanup confirmado0/metadados protegidos
iguais em todas as rodadas; Next/Chromium próprios encerrados pelo runner.

Capturas normais: [desktop](registration-captures/desktop.png),
[tablet](registration-captures/tablet.png), [celular](registration-captures/mobile.png).
Estados com erros permanecem no par02 da galeria; formulário no par09.
Desktop1440px: cartão920px centralizado com margens260px. Tablet922px:
largura858px/margens32px. Celular390px:358px/margens16px e botão total.
O conteúdo começa64px após o cabeçalho no desktop e32px no celular. Altura
natural, sem espaçador ou centralização vertical. Em telas altas, espaço restante
vem somente do shell flex mínimo100dvh existente, que mantém o rodapé ao final.

Geometria verificada em nove viewports;720×500 representa apenas layout
equivalente a zoom200%,390×420 simula redução de área disponível. Zoom real,
teclado virtual físico e navegadores adicionais não foram executados.
Erros400/409/503 e retenção de envio são interceptados; cadastro válido real,
sessão, sucesso e clima são cobertos pelo runner existente com contas sintéticas
em PostgreSQL descartável e REST externo determinístico. Não constituem prova
de conexão operacional ao provedor climático real.

Autorrevisão sequencial: diff de produto limitado ao wrapper do formulário e CSS
escopado. Handlers, validações, API, hashing, banco/migrations/grants, auth,
header/footer, sucesso/resumo/clima e dependências intactos. Revisão humana e
CI remoto pendentes. Sem commit/push/deploy ou acesso a contas persistentes.
