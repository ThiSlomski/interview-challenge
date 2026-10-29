# H-006 — seis achados consolidados dos scripts

29/10/2026 · origem: revisão estática dos arquivos compartilhados nesta conversa;
reprodução local agora. [Prompt integral](../../prompts/2026-10-29-harness-six-findings.md)
e [contrato prévio](six-findings-plan.md). Revisão humana integral pendente.

## Reprodução antes de corrigir

`node --test --test-name-pattern="H006-" scripts/harness/harness.test.mjs`
retornou código 1: seis testes direcionados, zero aprovados e seis falhas, antes
de modificar os scripts de produção. Nenhum achado precisou ser descartado.

| ID | Reprodução / impacto | Correção e regressões |
| --- | --- | --- |
| 1 | Checkpoint sem contexto retornava tarefa H-002, evidência/decisões/próxima etapa antigas | Contexto só explícito por API ou CLI; null/not-informed para ausências; sem inferir autorização. Mantidos clean/dirty/erro Git; contextos vazio/parcial/atualizados testados |
| 2 | Mesmo sem build, --product anunciava product-readiness | Escopo harness-and-product-tests, partial=true, readiness=not-assessed e lista de checks não executados/motivos. Testados sucesso parcial e falhas dos testes; nenhum build acrescentado |
| 3 | Processo retornando 23 não tinha diagnóstico classificável, embora stderr fosse omitido | Diagnóstico estruturado para início/saída não zero/timeout/limite de saída, com estado de encerramento. Consumidores publicam apenas classificação/código; testes verificam marcadores privados e limpeza não confirmada |
| 4 | Fluxo de 300KiB sem newline era acumulado e terminava em timeout genérico, sem limite de mensagem | Teto 2MiB recebido em stdout+stderr e 256KiB por mensagem antes de acumular; streams interrompidos, pendências rejeitadas e limpeza limitada. Fluxos controlados com/sem newline, volume total e UTF8 fracionado |
| 5 | Descrições em notes fora do esquema correto aprovavam identidade por coincidência | Adaptador para o JSON observado: tools/function spawn_agent/agent_type e catálogo de nomes/descrições delimitado. Associação exata/única; demais formatos não comprovados. Testes de repetição, nome incorreto/ausente, JSON inválido e origem em formato desconhecido |
| 6 | Caso real chamado “validates utils.js” era classificado como unproven | Reporter do próprio arquivo product-tests.mjs consome test:summary por arquivo no Node 22.13.1; não lê nome do caso nem interpreta TAP. Relatório temporário contém só índices/contagens e é removido. Casos .js/.mjs/.cjs, nome igual ao arquivo e texto impresso sem testes cobertos |

Os testes de subprocessos/arquivos são fixtures descartáveis, não testes da
aplicação. Fluxos e respostas nativas controladas não chamam Codex real nem modelos.

## Falhas intermediárias e revisão independente

Após as primeiras correções, cinco dos seis testes passaram; o sexto retornou
failed ao carregar o reporter por caminho Windows. Passar a URL file de
import.meta.url fez o mesmo teste passar. A primeira inspeção exploratória de
eventos por stdin ESM também retornou falhas de arquivo e não foi usada como prova;
a inspeção CJS sem essa opção revelou resumos de casos por arquivo versus o resumo
global de sucesso sintético de arquivo vazio.

R-H006: /root/review_h006, papel Backend por instrução textual, skill verify-delivery,
sem histórico herdado (fork none), sem escrita/subdelegação. Encontrou publicação
de decision inesperada vinda de execpolicy. Reprodução adicional falhou antes de
corrigir: objeto/string privados apareciam no resultado mesmo com ok:false.
Agora apenas enumeração conhecida é publicada; comando não zero é rejeitado antes
de interpretar seu stdout. A regressão passou; o seguimento independente confirmou
em memória a omissão do conteúdo em cinco condições. Isso não é execução nativa.

A observação de prazo também foi atendida: 35s totais, com reserva de 6s para
limpeza; CLI e RPC compartilham o prazo operacional, e taskkill recebe no máximo
5s e nunca mais que o restante. Nenhum modelo ou preço foi forçado/consultado.

Última rodada direcionada até este registro: 14 testes aprovados, zero falhas,
código 0; duração medida pelo Node 1923.4392ms. Depois foi acrescentada regressão
de ordem do encerramento, totalizando 15 testes direcionados novos.

Primeira suíte completa: 26 aprovados. Primeira integração verify: código 1,
somente native-probe falhou. Investigação local encontrou capacidades/identidade/
regras válidas, mas cleanup=not-confirmed: stdin fechava antes da confirmação,
permitindo ao app-server sair antes de taskkill. A ordem foi corrigida para
terminar a árvore antes de fechar stdin. Execução local seguinte retornou código 0,
tree-terminated, 41722 bytes recebidos e nenhuma pendência. Regressão controlada
confirma a ordem e que limpeza não confirmada não aprova o probe. O último
seguimento independente revisou somente essa mudança e não encontrou achados.
Não se trata de demonstração de hooks, seleção nativa ou contexto limpo.

## Fechamento real

| Comando | Resultado |
| --- | --- |
| node --test scripts/harness/harness.test.mjs | Código 0, 27 testes aprovados, zero falhas/skips; duração Node 8217.9703ms |
| node scripts/harness/harness.mjs doctor | Código 0, ferramentas disponíveis, nenhuma estrutura obrigatória ausente |
| node scripts/harness/harness.mjs validate | Código 0, ok:true, sem erros |
| node scripts/harness/harness.mjs verify | Código 0, suíte/probe/lint/typecheck aprovados; lint 2706ms, typecheck sem incremental 1361ms |
| node scripts/harness/harness.mjs verify --product | Código 1 esperado: produto permanece placeholder/not-executed; demais checks aprovados; escopo parcial, readiness not-assessed; lint 2458ms e typecheck 1412ms |
| git diff --check | Código 0; inventário e diff exclusivo gerados no fechamento |

Lint e typecheck foram executados pelos comandos reais do agregador (npm run lint
e tsc --noEmit --incremental false), sem repetir instalação/build ou CI remoto.
A primeira integração também passou lint/typecheck (72339ms/11433ms); sua falha de
cleanup foi preservada e justificou a repetição. Suítes foram repetidas após
alterações e como parte das duas modalidades explicitamente pedidas.
Tokens/cache/custo indisponíveis; duração total não medida. Uma instância de
revisão e dois seguimentos delimitados, sem recursão; não são métricas de consumo.

## Limites

O formato nativo observado não fornece caminho de origem: sourcePath informa
not-provided-by-format; não foi inventada associação por caminho. Campos/formato
novos exigem revisão do adaptador, sem aprovação por ocorrência textual.
Reconhecer definição não demonstra seleção nativa nem aplicação de instruções.

O relatório Node comprova casos registrados e resultados estruturados no escopo
de arquivos explícitos, não qualidade semântica nem segurança contra código de
teste malicioso que tente adulterar artefatos. Não comprova produto pronto.
Outros runners, versões Node e npm lifecycle ficam sem prova automática.
Hooks reais, seleção nativa e retomada em sessão limpa continuam não demonstrados.
Estado e atribuição final de arquivos em [six-findings-final-state](six-findings-final-state.md).
