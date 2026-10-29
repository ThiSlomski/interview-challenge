# Evidência H-001

Data/origem: 28/10/2026, Prompt 5. Critérios prévios em [demo-plan](demo-plan.md).
Estado: consolidação; revisão humana pendente. Evidência sanitizada, sem logs privados.

## Delegações executadas

| Contrato / instância | Skill lida | Fontes / comandos | Resultado |
| --- | --- | --- | --- |
| F / /root/frontend | verify-delivery | README, UI/serviços/layout, contrato/política; duas chamadas de leitura código 0 | Sem formulário/validação/auth/sucesso/clima. REST cliente só mensagem |
| B / /root/backend | review-security | README, rota, package, CI, arquitetura; duas chamadas leitura código 0 | Sem API cadastro/auth/autorização/testes; npm test placeholder, audit CI report-only |
| D / /root/database | plan-requirement | README, package, arquitetura, inventário/rota; duas chamadas leitura código 0 | Sem schema/migrations/papéis/admin; nenhuma escolha de banco |
| X / /root/backend reutilizado | review-security já carregada | README 13 e fluxo UI/serviço/rota; uma chamada leitura código 0 | Revisão independente confirmou que /api/v1 não atende previsão de amanhã |
| R / /root/documentation | record-decision | README integral e retornos selecionados; leitura, verificação de 18 IDs e sete colunas, código 0 | Consolidou docs/REQUIREMENTS.md; corrigiu pipes do exemplo de audit para preservar tabela |
| Retomada / /root/frontend reutilizado | resume-project | handoff, estado, índice, Git e doctor; código 0 | main/HEAD/alterações coerentes, tarefa H-001 e próxima ação identificadas sem reler README |

Definições de papéis lidas explicitamente nas instâncias. A descoberta nativa dos
quatro TOML foi confirmada separadamente: debug prompt-input retornou código 0
e continha as quatro descrições exatas. Somente booleanos foram expostos, sem
prompt bruto. Nenhuma seleção/execução nativa pelo nome customizado foi demonstrada.
Contexto herdado por fork all; ganho foi especialização/revisão,
não economia comprovada. Nenhuma escrita concorrente em arquivo: Documentação
recebeu exclusivamente REQUIREMENTS; o orquestrador consolidou outros documentos.
Não houve divergência entre os pareceres do clima. Nenhum agente implementou produto.

## Verificações locais

| Verificação | Resultado real |
| --- | --- |
| doctor | Código 0, ok true, nenhuma estrutura obrigatória ausente |
| validate | Código 0, ok true, sem erros estruturais/referências |
| Testes Harness | 4 testes passaram: fixture inválida/CLI, eventos e diretório inválidos/sanitização, envelope SessionStart, stdin inválido |
| Fixture negativa | Cópia temporária alterou somente name da skill resume-project; validate retornou false, CLI código 1; projeto original válido; fixture removida dentro de fronteira verificada |
| Regras oficiais | Cinco comandos diretos retornaram forbidden; git status não casou. execpolicy check código 0 significa avaliação concluída, não execução do alvo |
| Hook controlado | SessionStart retornou contexto orientativo; Stop continuou com aviso; recursão ignorada; entrada inválida retornou 1 sem eco. Disparo pelo Codex não demonstrado |
| verify inicial | Código 1: lint excedeu timeout de 60s (code null); demais checks passaram. Execução direta npm run lint passou com código 0 |
| Correção do agregador | Prazo de lint ampliado para 180s e erro/duração explícitos. Hipótese: timeout curto sob carga local, não falha de regra de lint; sem alteração de regras |
| verify após ajustes | Código 0: validate, quatro testes, probe nativo, lint e typecheck sem geração aprovados. Lint 9182 ms e typecheck 4573 ms, medidos pelo spawn local nessa rodada |
| Rodada final após ampliar prova nativa/referências | Código 0; probe também verificou descoberta dos quatro TOML. Lint 9352 ms, typecheck 4525 ms; sem falhas. validate final repetido somente após a consolidação documental |
| Produto/build/audit | Não executados nesta etapa: npm test é placeholder; sem mudança funcional para justificar novo build/audit remoto. Resultados anteriores preservados como históricos |
| checkpoint | Código 0, proposta com branch/HEAD/status/tarefa/pendências/próximo passo; nenhuma escrita automática na memória |
| Retomada | Instância separada reutilizada, com contexto residual herdado: identificou estado e próxima ação, sem divergência aparente. Não é sessão limpa |
| Integridade Git e revisão final | Comparação dos arquivos originais preservados e status completo em [final-state](final-state.md); nenhum arquivo funcional/dependência/lockfile/CI modificado |

`git diff --check` passou com código 0. A cópia arquivada do prompt tem SHA256
idêntico ao arquivo enviado. O checker e a descoberta nativa não provam ativação
preventiva de regras nesta conversa nem a seleção dos papéis TOML.
O scan direcionado de padrões de credenciais nos 41 novos arquivos não encontrou
correspondências; nenhum valor privado foi lido. Os 16 arquivos originais fora
dos dois documentos autorizados mantiveram seus SHA256. Revisão do diff e da lista
de novos arquivos não encontrou alterações fora do escopo.

Já observado: CLI 0.164.0-alpha.11.1; Node 22.13.1/npm 10.9.2/Git 2.55.0.windows.5.
Probe separado: strict-config aceito, camada project ativa, agents enabled e
max_concurrent_threads_per_session=2; seis skills descobertas e enabled por
skills/list. Nenhum turno de modelo, API de avaliação, escrita de confiança ou
alteração de configuração pessoal. Custom agents/dispatch real de hook não provados.

## Contexto e esforço

Quatro instâncias especialistas, um seguimento reutilizando Backend e outro
reutilizando Frontend para retomada;
até duas instâncias trabalhando simultaneamente. Contratos com 10 minutos por
análise e execução + duas correções, definidos antes das delegações. Subagentes
não delegaram. Não foram forçados modelos. Leituras integrais do README ocorreram
por papel como fonte primária; detalhes do Harness carregados sob demanda.

Tokens de entrada/saída/cache e custo: indisponíveis nas ferramentas desta execução.
Duração total não medida; não estimada. As análises F/B/D/X reportaram sete chamadas
locais de leitura no total. Houve uma correção do timeout de lint, duas rodadas
integradas de sucesso após mudanças (a última acrescentou descoberta nativa dos
papéis e checagem recursiva de links) e um lint direto para diagnóstico da falha. As pequenas
correções de doctor/checkpoint/probe vieram da revisão do código. Número de delegações/comandos é indicador
de esforço, não consumo real ou economia. Leituras direcionadas e saídas filtradas
foram usadas; nenhuma avaliação paga separada ou consulta de preço.
