# Matriz de capacidades

Data: 28/10/2026. Origem: inspeção CLI, documentação oficial e H-001.
Estados distintos: D=documentado; C=configurado; L=carregado por mecanismo
confirmado (processo indicado); E=demonstrado. Sim não implica ativação em toda sessão.

| Componente / finalidade | Suporte confirmado / local | Carregamento | Teste / D C L E | Limitação |
| --- | --- | --- | --- | --- |
| rules / instruções e restrições diretas | AGENTS.md e `.codex/rules/harness.rules`; execpolicy local | Instruções por diretório; rules na camada confiável ao iniciar | check oficial, casos negativos/positivos; D sim, C sim, L arquivo pelo checker, E correspondência sim | Aplicação preventiva na conversa não demonstrada; prefixos não são barreira universal |
| skills / procedimentos seletivos | Seis `.agents/skills/*/SKILL.md` | Descoberta nativa skills/list e catálogo de subagentes; detalhes sob demanda | probe e fixture inválida; D sim, C sim, L sim, E sim | Validador Python oficial indisponível; estrutural + descoberta não avaliam toda eficácia |
| agents / cinco papéis | Orquestrador da sessão e quatro TOML `.codex/agents/` | Descoberta nativa confirmada por debug prompt-input; instâncias desta demonstração leram os papéis explicitamente | Revisões e consolidação; D sim, C sim, L descoberta nativa sim, E papéis sim/seleção nativa não | Sem prova de execução selecionando nome customizado; sem sandbox de leitura independente |
| subagents / instâncias de trabalho | Ferramentas de colaboração presentes; CLI multi_agent estável | Contrato pelo orquestrador, no máximo duas simultâneas | H-001 F/B/D/R e X reutilizado; D sim, C sim (concorrência CLI), L sim, E sim | Histórico herdado nas instâncias; configuração do CLI não redefine limite da conversa |
| commands / diagnósticos e checks | Node `scripts/harness/` | Invocação explícita; nenhum slash command inventado | doctor/validate/verify/checkpoint; D sim, C sim, L sim, E ver demo | Só Windows testado; produto continua sem testes reais |
| workflows / integração de etapas | Cinco arquivos em `docs/harness/workflows/` | AGENTS/skills com links explícitos, manual guiado | H-001 percorre avaliação até handoff; D sim, C procedimento, L leitura, E parcial | delivery de produto e release não executados; não é CI |
| hooks / diagnóstico de sessão e check leve | CLI hooks estável, `.codex/hooks.json`, `hook.mjs` | Camada confiável + revisão de hash pelo usuário; eventos SessionStart/Stop | handler controlado; D sim, C sim, L disparo não demonstrado, E handler sim/evento real não | Sem confiança automática; avisos não bloqueiam; sessão pela raiz |
| memória / retomada explícita | `docs/harness/memory/`, checkpoint Node | AGENTS e resume-project; nunca automática | Retomada em instância reutilizada com contexto residual; D sim, C sim, L leitura explícita, E sim com limite | Não foi sessão limpa; resumo subordinado ao Git/README/código |

## Atualização H-002 — após a revisão

28/10/2026 · origem Prompt 6 · evidência [correções](evidence/corrections.md).

- Presença: nome/caminho exatos e únicos, sem inferir execução.
- Habilitação: booleano fornecido pelo mecanismo nativo; ausente é não comprovado.
- Configuração efetiva: config/read exige camada project exata ativa,
  agents.enabled=true e concorrência 2; skills/list confirma seis skills habilitadas.
  Disabled, mismatch e unproven não são relatados como operacionais.
- `operational` no probe significa disponibilidade/configuração efetiva nesse
  processo local; `execution` separado continua not-demonstrated para a seleção
  dos papéis. O probe não reativa recursos nem altera permissões/confiança.
- Hooks: configuração local validada, ativação/disparo não comprovados e
  operational=false. Grupos/handlers/timeout têm testes positivos/negativos.
- Checkpoint: erros do Git impedem proposta válida; clean/dirty/falha separados.
- Produto: configuração, execução e prova são independentes; código 0 sem casos
  comprovados não é aprovação. Não existem testes funcionais implementados aqui.
- Timeout: árvore QA real encerrada em Windows; outros sistemas e processos que
  escapem da árvore não foram demonstrados.

Ver [fontes](sources.md), [comandos](commands.md), [evidência H-001](evidence/demo.md)
e [procedimentos das lacunas](validation-gaps.md).

## Atualização H-006 — seis achados de scripts (29/10/2026)

Origem: revisão estática compartilhada na conversa e reprodução local nesta rodada.
[Evidência](evidence/six-findings.md). Estados anteriores permanecem históricos.

- Checkpoint separa Git de contexto; dados da tarefa só quando fornecidos,
  ausências not-informed, sem inferir progresso ou autorização.
- verify --product verifica Harness e testes do produto parcialmente; não executa
  build nem avalia prontidão integral. Sucesso parcial mantém readiness not-assessed.
- Diagnósticos são classificações/estados, sem stderr bruto. Regras de execução
  aceitam apenas decisões enumeradas; respostas inesperadas não são publicadas.
- RPC usa limites explícitos de bytes total/mensagem e limpeza dentro do orçamento.
  Fluxos controlados não equivalem a demonstração nativa de todos os cenários.
- Identidade dos especialistas é associada por nome/descrição dentro do esquema
  JSON observado de spawn_agent, não busca global por descrição. Não há caminho
  de origem nesse formato; formatos diferentes são não comprovados.
- Prova de casos reais usa resumos estruturados por arquivo do Node 22.13.1,
  não o nome do caso nem texto TAP. Sem casos, apenas skips, outro runner/versão
  ou lifecycle sem adaptador não são aprovados por código zero.
- Hooks reais, seleção nativa e retomada limpa seguem não demonstrados. Nenhuma
  conclusão de validação integral do Harness decorre dessas correções.
Não há garantia de que arquivos novos se apliquem retroativamente à sessão atual.
