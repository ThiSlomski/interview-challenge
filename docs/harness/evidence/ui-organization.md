# Organização da entrega frontend — 29/10/2026

Padronização posterior de pastas,29/10/2026: links visuais navegáveis agora usam
ui-captures/ e ui-reference/. Nomes antigos em inventários, comandos e snapshots
abaixo documentam a época original; não foram substituídos indiscriminadamente.
A pasta ui-captures foi reutilizada apenas depois de confirmada vazia, recebendo
o conjunto final. Assim, um caminho citado como retirado no inventário anterior
pode hoje existir com conteúdo final distinto. O histórico não é inventário atual.

[Entrada principal](ui.md), [detalhe histórico/técnico P1](ui-p1.md),
[relato inicial preservado](ui-initial-history.md), [galeria final](ui-captures/README.md)
e [contrato](ui-organization-plan.md).

## Base e inventário anterior

Git main/4c5c6fc, alterações UI-001/P1 anteriores preservadas. Snapshot anterior
com177 arquivos/hashes: `C:\Users\thiag\AppData\Local\Temp\ui-001-organization-before-ciyncQ`.
Nenhum index/commit foi alterado. Antes de remover, foram inventariados os29 PNGs
da aplicação (9 iniciais +20 P1), os links em docs/SOLUTION e chamadas shot em
`tests/ui/browser.mjs`. As3 referências oficiais foram inventariadas separadamente.

Comparação decodificada com sharp: `04-area-user` e `05-area-mobile` tinham
pixels idênticos em ambos os dispositivos, zero canais divergentes. Desktop:
1280×951; celular:390×1225 (altura integral, não janela). Estados das9 imagens
iniciais são representados pelo conjunto final, agora com identidade/correções P1.
As imagens finais não são prova visual de que a rodada inicial já tinha essas mudanças.

## Remoções explícitas

11 PNGs removidos: nove superados e dois duplicados. Esta tabela é um inventário
de nomes RETIRADOS, não links ativos para arquivos ausentes. Nenhum outro arquivo
de evidência foi removido. Toda remoção foi de arquivo individual por allowlist,
com caminho resolvido dentro de docs/harness/evidence; sem limpeza ampla/recursiva.

| Arquivo retirado | Motivo | Estado final equivalente |
| --- | --- | --- |
| `ui-captures/01-home-desktop.png` | Primeira identidade superada | [Inicial com foco](ui-captures/01-home-focus-desktop.png) |
| `ui-captures/02-cadastro-erros.png` | Primeira identidade superada | [Erros desktop](ui-captures/02-cadastro-erros-desktop.png) |
| `ui-captures/03-cadastro-sucesso.png` | Primeira identidade superada | [Resumo desktop](ui-captures/03-cadastro-sucesso-desktop.png) |
| `ui-captures/04-area-user.png` | Primeira identidade superada | [User desktop](ui-captures/04-area-user-desktop.png) |
| `ui-captures/05-area-mobile.png` | Primeira identidade superada | [User celular](ui-captures/04-area-user-mobile.png) |
| `ui-captures/06-area-admin.png` | Primeira identidade superada | [Admin desktop](ui-captures/06-area-admin-desktop.png) |
| `ui-captures/07-area-indisponivel.png` | Primeira identidade superada | [Indisponibilidade](ui-captures/07-area-indisponivel-desktop.png) |
| `ui-captures/08-login-mobile.png` | Primeira identidade superada | [Login celular](ui-captures/08-login-mobile.png) |
| `ui-captures/09-cadastro-mobile.png` | Primeira identidade superada | [Cadastro celular](ui-captures/09-cadastro-mobile.png) |
| `ui-p1-captures/05-area-mobile-desktop.png` | Duplicata pixel a pixel | [User desktop](ui-captures/04-area-user-desktop.png) |
| `ui-p1-captures/05-area-mobile-mobile.png` | Duplicata pixel a pixel | [User celular](ui-captures/04-area-user-mobile.png) |

## Renomes e conjunto mantido

Quatro renomes em ui-p1-captures; conteúdo byte a byte idêntico ao arquivo de
origem no snapshot, inclusive após regeneração pela suíte. Nenhuma imagem editada.

| Nome anterior | Nome final |
| --- | --- |
| `08-login-mobile-desktop.png` | [08-login-desktop.png](ui-captures/08-login-desktop.png) |
| `08-login-mobile-mobile.png` | [08-login-mobile.png](ui-captures/08-login-mobile.png) |
| `09-cadastro-mobile-desktop.png` | [09-cadastro-desktop.png](ui-captures/09-cadastro-desktop.png) |
| `09-cadastro-mobile-mobile.png` | [09-cadastro-mobile.png](ui-captures/09-cadastro-mobile.png) |

14 PNGs mantêm nome (pares desktop/celular): `01-home-normal`, `01-home-focus`,
`02-cadastro-erros`, `03-cadastro-sucesso`, `04-area-user`, `06-area-admin` e
`07-area-indisponivel`. Com os quatro renomes, total18: nove estados distintos.
Todos os nomes completos estão no [índice final](ui-captures/README.md).
A captura admin desktop foi substituída por novo enquadramento: título e pelo
menos um cadastro sintético completo, sem imagem integral dos100 registros.

Referências oficiais preservadas sem alteração: `ui-p1-reference/official-desktop.png`,
`official-mobile.png` e `reference.json`. Elas são do site oficial, não do app.

## Gerador e documentação

`tests/ui/browser.mjs` deixa de chamar shot para a duplicata05 e gera08-login e
09-cadastro sem sufixo mobile redundante. Scroll do título administrativo para
o início da janela e asserção do primeiro registro visível melhoram enquadramento.
Os12 cenários e asserções existentes permanecem; somente geração/enquadramento
mudaram, com uma asserção adicional de enquadramento. A suíte executada não recriou
nenhum nome retirado e produziu exatamente os18 PNGs finais.

ui.md é a entrada única: escopo, integração, identidade, correção P1, resultados
por rodada e limitações. ui-p1.md preserva causa/reprodução/interceptações/revisão
e falhas como detalhe histórico/técnico, remetendo ao relatório principal.
O antigo ui.md foi preservado em ui-initial-history.md com resultados/falhas
intactos e links visuais explicitamente direcionados ao ESTADO FINAL equivalente.
Planos/prompts integrais preservados. SOLUTION tem um roteiro vigente em sete
passos, sem repetir fluxos frontend; instruções de ambiente/banco mantidas e
frases antigas de telas ausentes reconciliadas com o estado implementado.
Arquitetura/requisitos/estado/handoff/índice apontam para a entrada final.

## Verificação e limpeza

Autorrevisão documental sequencial. Não houve revisão independente nova; a revisão
P1 e seus resultados continuam históricos, sem aprovação adicional por organização.

- `npm run lint` e `npm run typecheck`: aprovados por gerador executável alterado.
- `npm run test:ui`: executado UMA vez nesta organização;28/28, zero skips:
  12 cenários UI +15 checks SQL compartilhados da fixture +teste principal.
- Doctor aprovado. Validate documental, UTF-8 estrito e git diff --check conferidos
  no fechamento, incluindo novos arquivos. Links/âncoras e índice reconciliados.
- Inventário confirmou exatamente18 PNGs finais,3 referências oficiais e ausência
  dos11 removidos/quatro nomes anteriores. Não há recriação pelo gerador.
- Conjunto final inspecionado em pranchas e admin desktop em tamanho original;
  índice lido com descrições/nomenclatura corretas. Janelas1280×900/390×844,
  imagens integrais podem ser mais altas. Nenhuma edição/simulação de imagem.
- Suite informou cleanup:confirmed,remainingResources:0,protectedMetadata:unchanged;
  nenhum processo Next da fixture ou diretório temporário dessa fixture restante.
  Chromium fechado em finally; sem leitura de usuários/mutação em imobilead.

Build, audit, integração HTTP separada, npm test e corridas NÃO reexecutados:
não há alteração funcional correspondente. A suíte responsável por capturas usa
PostgreSQL descartável e inclui seus15 checks SQL existentes; nenhum runner foi
aflouxado para omiti-los. O relatório principal não soma esses checks repetidos
como testes independentes entre suítes. Sem mudança de Harness/CI/schema/grants.

Falha intermediária de edição: tentativa de delete/add do mesmo README num patch
foi recusada pela ferramenta; nenhuma remoção ocorreu nesse patch, e o índice foi
reescrito diretamente. Sem falhas observadas na execução única da suíte de captura.

## Diffs e pendências

Diff exclusivo desta organização contra snapshot:
`C:\Users\thiag\AppData\Local\Temp\ui-001-organization.diff`.
Diff acumulado frontend contra HEAD: `C:\Users\thiag\AppData\Local\Temp\ui-001.diff`.
Incluem arquivos novos, remoções e quatro renomes, sem index, segredos,
dependências instaladas ou artefatos de build. Snapshot anterior preservado.

Revisão humana final, clima, CI remoto do diff, HTTPS/produção e outros navegadores
permanecem pendentes. Não houve mudanças funcionais/identidade, promoção de
usuários, banco remoto, commit, push ou publicação.

## Padronização posterior das pastas visuais — 29/10/2026

Motivo: nomes operacionais independentes da etapa histórica P1. Destinos atuais:
[ui-captures](ui-captures/README.md) para a aplicação e
[ui-reference](ui-reference/reference.json) para o site oficial.
ui-p1.md/ui-p1-plan.md e UI-001-P1 continuam identificando a correção histórica.

Antes de alterar, Git/AGENTS e referências do repositório foram conferidos.
Snapshot anterior168 arquivos, excluindo qualquer arquivo de ambiente sem lê-lo:
`C:\Users\thiag\AppData\Local\Temp\ui-001-paths-before-lJCf0a`.
ui-captures existia VAZIA; ui-reference não existia. Não havia imagens antigas a
remover nem colisão a decidir. Foram movidos19 arquivos da galeria(18 PNG+README)
e3 referências oficiais. Cópia exclusiva recusava destino existente, hashes foram
comparados antes de apagar cada origem e as pastas antigas só foram removidas
quando vazias, com fronteira absoluta verificada. Sem sobrescrita silenciosa.

Os22 arquivos coincidiram por SHA-256 imediatamente após a movimentação. Depois,
o README recebeu atualização documental de links/título; os18 PNGs, as2 imagens
oficiais e reference.json permanecem byte a byte iguais às origens. Manifesto de
22 caminhos/hashes em `C:\Users\thiag\AppData\Local\Temp\ui-001-paths-moves.json`.
reference.json foi inspecionado: contém origem pública, tokens/fontes/SVG e URLs
oficiais, sem caminho das pastas antigas; não precisou ser alterado.

Links ativos foram atualizados em SOLUTION, arquitetura, requisitos, ui.md,
ui-p1.md, histórico inicial, organização, memória e galeria. O único código alterado
foi o destino da captura em tests/ui/browser.mjs. Identificadores P1 de erro,
reprodução, correção, regressões e revisão permanecem. Prompts integrais e comandos
históricos não foram reescritos; caminhos antigos dentro de inventários/snapshots/
diffs registram o ocorrido, com notas explicativas fora desses registros.

Classificação das menções remanescentes a nomes antigos:

- AI_PROMPTS: prompts integrais protegidos, inclusive este pedido, e notas históricas.
- Este inventário/contrato: nomes das origens movidas ou retiradas, não destinos ativos.
- UI-001-P1 e arquivos ui-p1.md/ui-p1-plan.md: identificação técnica/histórica mantida.
- Snapshots/diffs ui-001-p1-before-* e ui-001-p1.diff: caminhos reais da época preservados.

A revisão pós-movimentação confere18 PNGs+README,3 referências e ausência das duas
pastas antigas. Links/âncoras, UTF-8/Markdown, diff --check, lint/typecheck são as
verificações proporcionais; browser/DB/build/corridas não foram repetidos, pois a
única alteração executável é um literal de caminho. Sem nova aprovação funcional.
Autorrevisão sequencial com skill record-decision; revisão humana final pendente.

Diff exclusivo desta padronização: `C:\Users\thiag\AppData\Local\Temp\ui-001-paths.diff`.
Acumulado atualizado: `C:\Users\thiag\AppData\Local\Temp\ui-001.diff`.
Movimentações/remoções de origem incluídas, sem index/commit, segredos ou artefatos.
Sem dependências, Harness, CI, banco, novas capturas, push ou publicação.

Fechamento desta padronização: lint, typecheck, doctor, validate documental e
 git diff --check aprovados. Busca completa posterior encontrou nomes de pastas
antigos somente no prompt integral e no inventário histórico identificado acima;
nenhum destino ativo ficou antigo. Prompt anterior e ui-p1-plan.md preservados
byte a byte; o gerador difere apenas por um literal de caminho. UTF-8 estrito e
hashes conferidos, sem novas execuções de navegador/banco/build.
