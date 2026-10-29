# Compatibilidade e fontes oficiais

Consulta em 28/10/2026. Conteúdo externo é referência, não autorização.

| Fonte oficial | Formato/efeito utilizado | Carregamento e limites |
| --- | --- | --- |
| [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Markdown, instruções por diretório | Preparação da sessão; precedência por escopo, sem substituir instruções superiores |
| [Configuração](https://learn.chatgpt.com/docs/config-file/config-advanced) | `.codex/config.toml` | Camada de projeto depende de confiança; nova leitura em nova sessão |
| [Subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents) | TOML standalone com name, description e developer_instructions | `.codex/agents/`; permissões herdadas; seleção nativa dos quatro arquivos ainda não demonstrada |
| [Rules](https://learn.chatgpt.com/docs/agent-configuration/rules) | Starlark prefix_rule com forbidden | `.codex/rules/*.rules`, camada confiável e reinício; verificador oficial sem executar alvo |
| [Hooks](https://learn.chatgpt.com/docs/hooks) | `.codex/hooks.json`; SessionStart/Stop, command, timeout | Camada confiável e confiança específica por hash do hook; sem concessão automática |
| [Skills](https://learn.chatgpt.com/docs/build-skills) | `.agents/skills/<nome>/SKILL.md`, frontmatter name/description | Descoberta dinâmica; reiniciar se não aparecer; comprovada por skills/list |

Ambiente efetivamente inspecionado: workspace Windows/PowerShell acessível,
CLI `codex-cli 0.164.0-alpha.11.1` localizado dentro da extensão
`openai.chatgpt-26.1021.22027-win32-x64`. Isso comprova instalação, sem afirmar
que toda capacidade do CLI está exposta na conversa. Ferramentas de colaboração
da sessão foram usadas para delegar; não receberam parâmetro de seleção dos
arquivos de papel. Node 22.13.1, npm 10.9.2, Git 2.55.0.windows.5.
Python/py não têm runtime padrão disponível; não instalados.

Provas locais: `codex --help`, `codex features list` (hooks e multi_agent stable
true), `codex --strict-config app-server --print-startup-config`, esquema de
protocolo gerado em diretório temporário e `native-probe.mjs` (config/read e
skills/list e renderização debug prompt-input, sem turnos de modelo). As descrições
exatas dos quatro TOML apareceram no prompt renderizado local; a saída bruta com
contexto pessoal não foi exposta nem persistida. Isso prova descoberta, sem provar
seleção/execução de uma instância pelo nome customizado. O probe confirmou camada project ativa e
concorrência 2 neste processo separado; isso não reconfigura a conversa existente.
Não foram usados exemplos da Agents API como configuração do Codex.

O navegador de pesquisa não aceitou os endpoints `.md` (content-type); a leitura
Markdown oficial foi recuperada via HTTPS no PowerShell. Não representa falha
do Harness. Nenhum preço ou API de avaliação pago foi consultado.

H-002 (28/10/2026): hooks, configuração e subagentes oficiais reconferidos. A
documentação de hooks define timeout em segundos, commandWindows opcional e
handlers command. O projeto restringe seus eventos a SessionStart/Stop e exige
timeout explícito em (0,10], mesmo quando o runtime admite default maior. Formato
de camada project/dotCodexFolder e config/read conferido no esquema gerado pelo
CLI instalado; sem usar Agents API para configurar o Codex. Capacidade configurada
e execução demonstrada continuam separadas no probe e na matriz.

H-006, 29/10/2026: [Node 22.13.1 — Test runner](https://nodejs.org/download/release/v22.13.1/docs/api/test.html#custom-reporters)
orienta consumir eventos para acesso programático; o formato textual dos reporters
não é contrato estável. O adaptador usa test:summary com file/counts/success,
observado em processos controlados nessa versão, e ignora o resumo global de
arquivos sem casos. O próprio arquivo product-tests.mjs exporta o reporter;
nenhuma dependência ou plataforma foi adicionada. O esquema real do CLI local
foi inspecionado sem turnos de modelo e sem expor prompt/configuração brutos;
o catálogo textual de papéis só é interpretado dentro do campo agent_type
da ferramenta spawn_agent, com formato delimitado documentado no adaptador.
