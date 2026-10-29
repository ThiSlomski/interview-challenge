# Comandos executáveis

Execute a partir da raiz em PowerShell, com Node 22.13.1 e Git disponíveis.
Sem dependências novas. Windows é o sistema testado; demais plataformas não
validadas. Saída JSON sanitizada em stdout; erro/uso inválido retorna código 1.
Os comandos não são slash commands nativos.

| Sintaxe | Entradas / pré-requisitos | Saída / efeitos / código |
| --- | --- | --- |
| `node scripts/harness/harness.mjs doctor` | Arquivos e versões de Node/Git/Codex/npm | Diagnóstico sem valores de configuração/segredos; 0 se pré-requisitos básicos, 1 se obrigatórios ausentes |
| `node scripts/harness/harness.mjs validate` | Artefatos locais | Metadados, estrutura, referências e invariantes; leitura apenas; 0 válido, 1 inválido; não comprova semântica nativa |
| `node scripts/harness/harness.mjs validate --root PATH` | Raiz de fixture fornecida | Mesmo validador contra cópia isolada; sem escrita |
| `node scripts/harness/harness.mjs verify` | Dependências já instaladas e CLI local | Agrega validate, testes Harness, probe nativo, lint existente e typecheck sem incremental; 1 em falha ou verificação obrigatória indisponível; testes de produto/build aparecem não executados |
| `node scripts/harness/harness.mjs verify --product` | Mesmos pré-requisitos | Escopo harness-and-product-tests: verificação parcial, readiness not-assessed; distingue absent/placeholder/failed/passed/unproven e mantém falha se testes não comprovados; build não incluído |
| `node scripts/harness/harness.mjs checkpoint [--root PATH] [--task TEXT] [--evidence PATH] [--results TEXT] [--decision TEXT] [--next TEXT]` | Git válido; contexto opcional explicitamente fornecido | clean/dirty explícitos; falha Git gera invalid-git-state e código 1; contexto ausente é null/not-informed, sem defaults de tarefa/decisão/autorização; não grava memória |
| `node scripts/harness/native-probe.mjs` | CLI local | strict-config, debug prompt-input sanitizado para descoberta dos papéis, checker de regras e app-server initialize/config/read/skills/list; sem turnos, confiança ou config pessoal alterados; 1 se obrigatório falhar |
| `node --test scripts/harness/harness.test.mjs` | Harness completo | Fixture temporária inválida, retorno CLI, handlers e sanitização; remove apenas fixture criada com fronteira verificada |

`verify` usa ESLint da aplicação (inclui os novos scripts) e TypeScript com
`--noEmit --incremental false`, evitando atualizar tsbuildinfo. Não roda instalação,
build completo ou audit remoto neste escopo. `npm test` não é invocado como prova.
Verificações anteriores de build/audit permanecem históricas.
Timeouts: lint 180s, typecheck 60s, testes Harness/produto 60s, probe externo 45s.
O probe compartilha até 35s totais, reservando 6s para limpeza. Checks CLI usam
até 5s cada e RPC até 15s dentro do prazo operacional restante. Processos longos usam execução gerenciada;
Windows encerra somente a árvore do PID criado por ele com taskkill /T /F.
Limpeza tem até 5s e tolerância de fechamento de 1s; impossibilidade de confirmar
é explicitada, não aprovada. Falha/timeout mantém código 1; sem logs brutos.

`verify` normal apenas inspeciona os testes da aplicação. `--product` executa os
testes configurados, exceto ausentes/placeholders, e exige prova estruturada para
aprovação. Arquivos explícitos JS/MJS/CJS devem estar no projeto e fora do Harness;
flags/globs/wrappers exigem adaptador. A escolha futura do runner da aplicação
continua aberta. Relatórios não são auditoria semântica nem barreira contra falsificação.

H-006 substitui a interpretação de TAP por eventos estruturados. O adaptador foi
validado no Node 22.13.1: executa o corpo exato do comando Node simples com o
reporter de product-tests.mjs, em URL file, e relatório temporário separado de
stdout/stderr. Só resumos test:summary por arquivo entram na prova; o resumo global
de um arquivo sem casos não conta. Nomes terminados em extensão são aceitos.
O relatório guarda índices dos arquivos declarados e contagens, sem nomes de casos,
mensagens/erros privados ou caminhos absolutos, e é removido ao terminar.
Sem adaptador, inclusive outra versão Node ou pretest/posttest, npm test pode ser
executado, mas código 0 permanece unproven. Não é uma avaliação integral do produto.

Checkpoint aceita contexto pela API (objeto task/files/results/openDecisions/next)
ou flags CLI; --evidence e --decision podem repetir. A forma de tarefa string na
API continua aceita como contexto explícito. Sem contexto, não tenta interpretar
Markdown nem presume tarefa/progresso/autorização. Reveja o estado atual e forneça
somente contexto sanitizado que pretende consolidar. Nenhum JSON de proposta é
gravado automaticamente.

Diagnósticos de processo têm classification (start-failure, nonzero-exit, timeout,
output-limit, signalled-exit ou success), code e termination. stderr é withheld:
nenhuma mensagem bruta ou trecho truncado é publicado como diagnóstico. Se não
for possível confirmar encerramento, termination=not-confirmed; a falha continua
não zero. stdout bruto é dado interno dos adaptadores, não diagnóstico de CLI.

RPC local limita 2MiB recebidos (stdout+stderr) e 256KiB por mensagem, em bytes;
interrompe streams, rejeita pendências e limpa com prazo no excesso, sem eco.
Identidade dos papéis usa somente o esquema spawn_agent.agent_type no JSON
observado e seu catálogo delimitado, com associação exata de nome/descrição.
Esse formato não traz caminho de origem; formatos novos/não suportados ficam
não comprovados. Reconhecimento não é seleção nativa ou execução de instruções.
Ver [evidência H-006](evidence/six-findings.md).

Regras, sem executar ações alvo:

```powershell
codex execpolicy check --rules .codex/rules/harness.rules -- git push origin main
codex execpolicy check --rules .codex/rules/harness.rules -- git status
```

O código 0 do verificador significa que avaliou a política; confira o campo
`decision` (`forbidden` para o primeiro), não confunda com autorização para executar.

Hooks opcionais: inicie Codex na raiz, confira configuração em `/hooks` quando
disponível e revise as definições antes de confiar. Nada foi confiado automaticamente.
Para desativar nesta camada, renomeie/remova `.codex/hooks.json` localmente (o
validate apontará ausência) ou use `codex --disable hooks` para aquela execução.
Não se altera core.hooksPath nem hooks globais. SessionStart recebe JSON com
hook_event_name/cwd/source; Stop com hook_event_name/cwd/stop_hook_active. Saída
JSON de orientação, 0 sucesso, 1 erro sanitizado; timeout 10s. Stop nunca bloqueia
nem pede novo turno, e ignora recursão por stop_hook_active. Entradas extras e
transcript_path são ignoradas; nenhum log é gravado. Diretório de sessão deve ser
a raiz neste primeiro release; subdiretórios recebem erro orientativo e podem usar
doctor/validate explícitos. Teste do handler não comprova disparo pelo Codex.
O timeout explícito em segundos e o teto de 10s são exigências locais mais
restritivas que o default nativo. O validador cobre os command hooks e eventos
deste projeto; não pretende implementar todo o esquema do Codex.
Procedimentos para eventos reais, seleção nativa e sessão limpa:
[validation-gaps](validation-gaps.md). Evidência atual: [H-002](evidence/corrections.md).
