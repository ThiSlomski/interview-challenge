# H-002 — correções da revisão do Harness V1

28/10/2026 · origem [Prompt 6](../../AI_PROMPTS.md) · revisão humana pendente.
Critérios prévios em [corrections-plan](corrections-plan.md). O histórico H-001
em [demo](demo.md) permanece preservado; seus quatro testes não eram prova
suficiente da causalidade da fixture, conforme a revisão posterior.

## Correções e testes direcionados

| Achado | Correção | Teste/evidência observada |
| --- | --- | --- |
| Checkpoint/Git | Cada consulta valida ok/código; falha produz invalid-git-state sem alterações ou proposta válida; CLI retorna 1 | Unidades com respostas controladas para árvore limpa/alterada e falhas de branch/revisão/status; CLI real fora de Git retorna 1; checkpoint real do workspace identifica dirty |
| Capacidades | skills/list e config/read verificam nomes/caminhos únicos, habilitação, camada exata do projeto ativa e concorrência efetiva 2; descoberta e execução separadas | Unidades de desabilitado/ausente/duplicado/camada errada/configuração divergente; probe real confirmou active/enabled/2 e seis skills disponíveis; não demonstra execução dos papéis |
| Hooks | Validador dedicado exige grupos/handlers não vazios, type command, command e timeout finito positivo explícito em segundos; teto local 10s | Caso válido e condições inválidas para estruturas, campos, valores não numéricos/não finitos/zero/negativos; opções Windows são opcionais conforme formato oficial |
| Fixture | Copia também .env.example; valida baseline antes da única mutação; compara lista exata de erros e diagnóstico do CLI | Baseline válida; troca somente name de resume-project; único erro invalid skill metadata e CLI 1 |
| verify --product | Inspeção real do package; ausente/placeholder/configurado separados de execução; código 0 exige evidência de casos reais para aprovação | Fixtures isoladas com package próprio: ausente, placeholder, caso Node passando/falhando, arquivo sem casos, todos skipped, script sem relatório e escopo Harness rejeitado |

Primeira execução direcionada: 12 testes passaram, código 0, sem skips; duração
medida pelo Node 6486.5554ms. Essa rodada precedeu pequenos ajustes de encerramento
e relato de hooks; a rodada integrada final é registrada abaixo após revisão.
Os testes Node de exemplo vivem somente em diretórios temporários e não são testes
da aplicação. Nenhum package.json do workspace foi alterado.

## Avaliação das quatro lacunas

| Lacuna | Estado | Evidência/limite |
| --- | --- | --- |
| Timeout e descendentes | Demonstrado em Windows | Teste real criou um pai Node e um filho, aplicou timeout de 3s, taskkill /PID do pai /T /F e confirmou ambos os PIDs ausentes. Código não aceita PID vindo de entrada do usuário |
| Hook real | Não demonstrado | Testes do handler/configuração não são disparo do Codex. Não foi contornada a revisão de confiança; procedimento em [validation-gaps](../validation-gaps.md) |
| Seleção nativa dos especialistas | Não demonstrada | Presença no prompt/configuração não comprova spawn pelo nome; revisão usa papel textual, não seleção nativa |
| Retomada em sessão realmente limpa | Não demonstrada | H-001 reutilizou contexto; revisão H-002 recebe contrato sem histórico por fork none, mas não é teste de retomada de uma nova sessão CLI |

O encerramento demonstrado cobre a árvore QA ainda ligada ao pai no timeout.
Não é garantia universal para processos que se desanexem ou escapem da árvore.
Plataformas fora do Windows continuam sem validação.

## Revisão e rodada final

Revisão independente R-H002: /root/review_h002, papel Backend textual, skill
verify-delivery; nenhuma escrita. Identificou classificação de placeholder ampla
demais (echo seguido de runner e arquivo todo.test.mjs). Ajuste para comando
completo sem runner, com regressões; seguimento independente confirmou correção
com sete casos em memória. Não simularam execução real nem substituem a suíte.

Primeira rodada integrada: doctor código 0; validate e verify código 1 por link
relativo incorreto criado nesta evidência (validation-gaps.md, deveria ../).
Os testes da fixture também retornaram 1, impedindo baseline inválida de passar.
Probe, lint (4924ms) e typecheck (1842ms) passaram. Corrigido somente o link;
nova rodada necessária por essa falha concreta. Falha anterior preservada aqui.
Rodada após corrigir o link: validate e verify código 0; 12 testes passaram,
probe nativo aprovado, lint 2709ms e typecheck sem incremental 1634ms.
`verify --product` foi executado separadamente para conferir o modo CLI:
código 1 esperado, status placeholder/not-executed no package real da aplicação;
todos os checks Harness passaram (lint 2946ms, typecheck 1622ms). Não se executou
o placeholder como se fosse teste. Na revisão final, o timeout calculado do probe
foi arredondado para inteiro positivo, exigido por spawnSync. Rodada final após
esse ajuste: verify código 0; validate, 12 testes, probe, lint (8949ms) e typecheck
(4396ms) aprovados. Esses tempos são medições locais de cada processo, não tokens.

doctor retornou código 0, sem estrutura obrigatória ausente. git diff --check
passou. Estado e arquivos por atribuição em [corrections-final-state](corrections-final-state.md).
Revisão humana continua pendente; não houve implementação de produto ou publicação.
Comparação do snapshot H-002: 14 arquivos existentes alterados e oito adicionados;
31 protegidos fora de docs/scripts Harness com hashes idênticos, incluindo código,
package/lockfile/CI, AGENTS, skills e .codex. Arquitetura anterior e prompt renomeado
pelo usuário também idênticos à baseline. Total acumulado: 49 não rastreados.
Tokens/cache/custo não disponíveis; nenhuma consulta de preço ou chamada de
modelo/API de avaliação adicional. Revisor com entrada mínima e sem histórico
da conversa (fork none), sem alteração de modelo, no máximo dois especialistas.
