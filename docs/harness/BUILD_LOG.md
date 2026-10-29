# Construção do Harness

Data: 28/10/2026. Origem: [Prompt 5](../AI_PROMPTS.md), registros existentes e
execução local. Estado: consolidação da etapa; revisão humana pendente.

| Etapa / objetivo | Decisão e motivo | Artefatos | Validação / resultado |
| --- | --- | --- | --- |
| Contexto anterior | Preservar estabilização de dependências/lint e commit existente; os prompts 1–4 documentam a sequência | README, arquitetura e log preservados | HEAD inicial f1b6f437756eb3c86c141986818c34bb720ab9c8; main limpa |
| Pedido do Harness | Introduzir ferramentas antes do desenvolvimento funcional | Prompt integral arquivado antes de implementar | Inventário e quatro análises mostram somente esqueleto; não se afirma que o Harness já existia |
| Cinco papéis | Orquestrador + quatro especialistas; segurança transversal | .codex/agents e contrato | Definições manuais nas instâncias, sem alegar seleção nativa |
| Escolha de .codex e oito componentes | Seguir convenções do pedido com formatos oficiais; comandos/memória por links | AGENTS, config, rules, hooks, skills, scripts e docs | Camada project e concorrência 2 observadas por config/read |
| Controle de contexto | Contexto seletivo, concorrência 2, tempo/iterações delimitados, sem preços ou métricas fictícias | TOKEN_POLICY, contratos e referências curtas | Quatro instâncias + uma reutilização; contexto herdado declarado |
| Compatibilidade | Separar CLI local da conversa e do serviço API | sources, capabilities e native-probe | CLI 0.164.0-alpha.11.1; docs HTTPS; skills/list confirmou seis skills; Python sem runtime |
| Implementação | Node nativo sem dependências de aplicação; preservação funcional/CI | scripts, seis skills, workflows e memória | validate, testes isolados, lint e typecheck; resultados finais em demo |
| Demonstração | Análise do README sem produto; retorno e revisão independente | demo-plan, requisitos e demo | Frontend, Backend, Banco, Documentação; Backend reutilizado em X |
| Ajustes e encerramento | Corrigir apenas falhas observadas; manter lacunas explícitas | Evidências e handoff | Ver demo para saídas reais; seleção nativa dos papéis, hook real e review humano permanecem pendentes |

Fatos anteriores provêm dos registros versionados; não foram reconstruídas falas
ou datas ausentes. O pedido atual consolida os papéis, caminhos e orçamento;
não há evidência de que tenham sido operacionais antes desta construção.
Não se atribui prática a qualquer outro produto da Slomski.

Erros e ajustes observados: o fetch de `.md` pelo navegador foi rejeitado por
content-type; leitura oficial via HTTPS resolveu. `py --version` mostrou runtime
ausente, portanto o validador Python da skill-creator não foi executado. Em vez de
instalar Python, foram usados o validador Node, teste negativo e descoberta nativa.
Não se confunde essa alternativa com execução do validador oficial.

A primeira rodada integrada falhou porque lint excedeu o timeout de 60s, enquanto
a execução direta passou. O agregador passou a conceder 180s e expor erro/duração;
a segunda rodada passou (lint medido em 9182ms). A revisão também ajustou doctor
para falhar com estrutura obrigatória ausente, preservou o prefixo de status Git
na proposta e corrigiu a classificação de camada project no probe. Essas mudanças
justificaram a repetição da rodada; não houve ciclo ilimitado.
A renderização local `codex debug prompt-input` comprovou depois a descoberta
das quatro descrições exatas dos especialistas. A prova foi incorporada ao probe,
e o validador passou a conferir também links nos relatos de evidência. Uma rodada
final após essas mudanças passou; números finais estão em demo. Só booleanos
sanitizados foram extraídos do prompt renderizado, sem expor contexto pessoal.

As referências oficiais e formatos estão em [sources](sources.md), sem copiar
manuais no contexto de cada papel. Evidência de execução e indicadores em
[demo](evidence/demo.md). O usuário ainda não revisou o resultado técnico.

## H-002 — correções após revisão (28/10/2026)

Origem: Prompt 6, cinco achados da revisão técnica; revisão humana pendente.
Preservado o ajuste do usuário para o nome 2026-10-28-harness.md e suas referências.
O sucesso anterior não é apagado; a revisão mostrou limites que aqueles testes
não cobriam: fixture já inválida, falhas Git ocultas, hooks incompletos, estado
efetivo não exigido e conclusão fixa de testes de produto ausentes.

Decisão: separar verificadores de hooks/capacidades/testes, exigir diagnóstico
causal nas fixtures e usar processos gerenciados nas verificações longas. Sem
dependências novas. Prova automática de testes reais inicialmente limitada a
Node/TAP com escopo explícito; outros runners ficam não comprovados até adaptador.
Esta escolha do Harness não define o runner futuro da aplicação.

Primeira rodada direcionada: 12 testes passaram, incluindo processos QA reais e
fixtures de testes fora da aplicação. Probe real confirmou camada ativa e
concorrência 2, sem ativação automática. Revisão independente, resultados finais
e limites em [correções H-002](evidence/corrections.md).

A revisão independente encontrou um falso placeholder em composições com echo e
nomes todo/placeholder. A classificação foi restrita ao comando completo sem
runner e regressões foram acrescentadas; o seguimento em memória confirmou o
ajuste. A primeira rodada integrada detectou um link incorreto na nova evidência;
validate e o teste de baseline falharam em vez de aprovar a fixture. Link corrigido,
com falha preservada e repetição justificada na evidência H-002.

## H-003 — revisão humana pontual do guia (28/10/2026)

Origem: revisão do texto compartilhado nesta conversa, registrada integralmente
no [Prompt 7](../AI_PROMPTS.md#prompt-7--revisão-humana-pontual-de-docsharnessmd-28102026).
Não se atribui inspeção humana dos arquivos locais. Esta revisão abrange somente
docs/HARNESS.md; revisão humana integral do Harness e aprovação da redação ajustada
continuam pendentes. Histórico anterior preservado.

| Tipo / problema encontrado | Impacto | Alteração | Verificação |
| --- | --- | --- | --- |
| Melhoria de clareza: oito componentes remetidos à matriz, sem explicação completa no guia | Leitor precisava abrir outra página para entender o conjunto; diagrama misturava especialistas e instâncias | Explicações dos oito componentes na página; agentes como papéis e subagentes como instâncias, inclusive no diagrama | Conferência das oito definições e distinção entre papéis/tarefas |
| Ambiguidade corrigida: menção genérica de retomada | A redação anterior podia sugerir retomada em sessão limpa | Texto explicita contexto residual declarado e sessão limpa não demonstrada; outras verificações preservadas | Comparação com H-001 e H-002 e com a redação solicitada |
| Melhoria de clareza: expressão “Timeout de árvore QA” | Não explicitava o encerramento do processo principal e descendentes | Substituição pela frase solicitada sobre encerramento após timeout em Windows | Comparação textual; nenhuma nova demonstração alegada |
| Formatação suspeita no texto compartilhado | Escapes poderiam prejudicar links, listas e código se estivessem no arquivo | Problema não reproduzido: original sem escapes de sintaxe Markdown; nenhuma correção de escapes executada | Zero escapes encontrados, bloco Mermaid com duas cercas e ausência de espaços finais; causa do efeito de cópia não comprovada |

Validação: `node scripts/harness/harness.mjs validate` passou (ok:true, código 0),
incluindo referências locais. Conferência de Markdown confirmou separação de
listas, cercas correspondentes e ausência de escapes indevidos/espaços finais.
`git diff --check` passou com código 0. Comparação com a baseline desta rodada
confirmou somente os três documentos solicitados alterados. Sem repetição de
testes da aplicação; sem código/configuração/dependências/CI, commit ou push.

## H-004 — prevenção de instruções desatualizadas em AGENTS.md (28/10/2026)

Origem: revisão do texto compartilhado nesta conversa, com prompt integral no
[Prompt 8](../AI_PROMPTS.md). Não se afirma inspeção remota dos arquivos.
Os dois ajustes são prevenção de instruções desatualizadas, sem alegar falha de
execução. Registros históricos preservados.

| Ajuste preventivo | Risco de desatualização | Alteração | Verificação |
| --- | --- | --- | --- |
| Escopo e restrições temporárias | “Nesta etapa” poderia transportar limites da construção para uma fase posterior sem identificá-la | Escopo vinculado ao pedido atual e à fase vigente; restrições temporárias devem nomear a etapa e ser atualizadas ao término | Coerência com memória atual: produto pendente; nesta rodada somente três documentos autorizados |
| Estado dos testes | A declaração permanente de placeholder poderia continuar sendo lida após mudanças reais no runner | Exigir conferência do script/testes antes de interpretar resultados; registrar estado na memória/evidências; preservar doctor/validate/verify | Nenhuma alteração do estado registrado de testes sem nova evidência; ausência de dependência literal das frases antigas nos validadores |

Histórico: H-001 construiu o Harness sem alterações funcionais, dependências,
lockfile, CI, commits ou publicação. H-002 corrigiu ferramentas e evidências com
os mesmos limites de produto; H-003 revisou somente o guia. A revisão atual não
autoriza iniciar funcionalidades nem ampliar o escopo para além dos três documentos.

Revisão humana integral do Harness permanece pendente. A revisão dos arquivos dos
quatro especialistas também permanece pendente; eles não foram examinados nesta
rodada. Sem testes da aplicação, alterações de configuração/scripts ou ações Git
de publicação. Validador documental: ok:true, código 0; git diff --check: código 0.
Comparação com a baseline desta rodada: somente AGENTS.md, docs/AI_PROMPTS.md e
este BUILD_LOG.md alterados, sem arquivos novos no projeto. Coerência com a fase
vigente preservada, sem mudança do estado registrado dos testes.

## H-005 — escopo e contexto dos quatro especialistas (29/10/2026)

Origem: revisão do conteúdo compartilhado nesta conversa, com pedido integral no
[Prompt 9](../AI_PROMPTS.md). Não se afirma acesso remoto aos arquivos. Classificação:
ajustes de escopo e prevenção de instruções desatualizadas. Nenhuma falha de execução
causada pelos textos anteriores foi demonstrada ou é alegada. Histórico preservado.

| Achado / ajuste | Alteração nas definições existentes | Coerência verificada |
| --- | --- | --- |
| Restrição temporária fixa nos quatro papéis | Substituída por escopo explicitamente atribuído, AGENTS/fase vigente, leitura padrão e escrita por contrato; mudar fase não autoriza implementar | Preservadas restrições de segurança, publicação, Git/configuração pessoal, subdelegação e limites herdados |
| Backend limitado a app/api | Rotas, módulos de servidor de auth/autorização/validação/regras/persistência e testes podem ser atribuídos; contrato lista caminhos sem escolha antecipada de pastas/bibliotecas | Schema e migrations permanecem com Banco; escritor único por arquivo |
| Frontend definido por diretórios amplos | Escrita somente em interface, lógica de cliente e testes atribuídos; localização em app/services não define responsabilidade | Servidor e contratos compartilhados exigem atribuição do orquestrador; escritor único |
| Missões de execução pouco explícitas | Frontend, Backend e Banco podem analisar/implementar/verificar sob autorização e contrato | Documentação mantém consolidação de requisitos, decisões, prompts, evidências e memória; sem código funcional |
| Leitura indiscriminada | Instruções/contrato mantidos, demais fontes sob demanda; leitura ampliada por dependência/dúvida; log consultado por estrutura/entradas relevantes | Caminho ausente deve ser registrado, sem sucesso presumido ou arquivos fora do escopo |
| Integração versus chamada externa | Escrita de código de integração pode integrar tarefa autorizada ao papel responsável; execução externa exige autorização explícita no contrato e respeito às instruções superiores | Nenhuma chamada externa autorizada ou realizada nesta rodada |

Arquivos alterados: somente .codex/agents/backend.toml, frontend.toml,
database.toml, documentation.toml, docs/AI_PROMPTS.md e este BUILD_LOG.md.
Nomes de agentes preservados; sem duplicatas, mudanças de scripts/skills/configuração
principal, dependências, lockfile ou CI. Sem produto, commit, push ou publicação.

Validações (29/10/2026): validate passou (ok:true, código 0); teste específico
existente `native capability state` passou (um teste, código 0); diff-check passou
(código 0). Busca nos validadores não encontrou dependência literal das frases
antigas. Coerência com AGENTS/contrato conferida: escopo atribuído, fontes seletivas,
escritor único e autorização externa subordinada às instruções superiores.

CLI local 0.164.0-alpha.11.1: configuração estrita via app-server
--print-startup-config passou sem iniciar servidor. A primeira combinação de
--strict-config com debug prompt-input retornou 1 sem JSON e não comprovou
reconhecimento; não se atribui a falha aos textos. O mecanismo debug prompt-input
sem essa combinação passou, com JSON válido e metadados dos quatro TOML reconhecidos.
Só booleanos/estados sanitizados foram expostos; sem turno de modelo, chamada
externa ou alteração de configuração pessoal. Validação estática e reconhecimento
pelo parser/renderizador não demonstram execução das instruções em subagentes.
Comparação com a baseline confirmou somente os seis arquivos autorizados alterados,
sem duplicatas, arquivos novos ou mudanças fora do escopo. Testes da aplicação
não repetidos; nenhuma alegação de falha de execução dos especialistas.

As lacunas de hooks reais, seleção nativa e retomada limpa permanecem sem demonstração;
revisão humana integral do Harness continua pendente.

## H-006 — seis achados consolidados dos scripts (29/10/2026)

Origem: revisão estática dos arquivos compartilhados nesta conversa; reprodução
local ocorre agora. [Prompt 10 integral](../prompts/2026-10-29-harness-six-findings.md),
[contrato](evidence/six-findings-plan.md) e [evidência por achado](evidence/six-findings.md).
Histórico e conclusões anteriores preservados, com correções acrescentadas.

Reprodução antes de corrigir: seis testes falharam pelos dados H-002 fixos, escopo
product-readiness sem build, diagnóstico ausente, fluxo sem teto identificável,
aprovação de descrição fora do esquema e rejeição de caso real terminado em .js.
Correções: contexto explícito/ausente informado, verificação parcial sem build,
diagnósticos estruturados, limites de bytes e limpeza, associação estrutural de
identidade e eventos Node por arquivo. Sem nova estrutura/dependências.

Falhas intermediárias: primeiro reporter por caminho Windows falhou; usar URL file
permitiu carregamento e sucesso do caso. Revisão independente R-H006 encontrou
echo de decision inesperada; novo teste reproduziu antes de filtrar enumerações e
rejeitar processos falhos. Seguimento confirmou correção em memória, sem execução
nativa. Reserva de limpeza esclareceu o orçamento de 35s. Última rodada direcionada:
14 testes aprovados; demais verificações serão registradas após execução real.

Não executados turnos de modelo para testes; sem produto, configuração pessoal,
permissões, lockfile, CI, commits, push ou publicação. Hooks reais, seleção nativa
e retomada limpa permanecem não demonstrados; revisão humana integral pendente.

Fechamento H-006: a primeira integração passou a suíte (26), lint/typecheck, mas
falhou no cleanup do probe. A execução real revelou corrida por stdin fechado
antes de confirmar encerramento. Alterada a ordem, teste controlado adicional e
teste real local confirmaram tree-terminated. Segundo seguimento independente
delimitado não encontrou novo achado. Suíte final: 27 aprovados; doctor/validate/
verify e lint/typecheck passaram. verify --product retornou 1 esperado porque o
placeholder da aplicação continua; comando parcial não equivale à prontidão.
Diff-check e inventário exclusivo em [estado H-006](evidence/six-findings-final-state.md).
Nenhuma validação integral do Harness ou revisão humana concluída é afirmada.
