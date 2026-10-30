Corrija os seis achados consolidados da revisão dos scripts
do Harness V1 e documente os resultados.

Leia AGENTS.md, o contrato de delegação e as skills pertinentes.
Preserve alterações existentes. Use o harness sem ampliar
o escopo para funcionalidades da aplicação.

Antes de corrigir, reproduza cada problema com um teste
direcionado. Se algum achado não se confirmar, registre
a evidência e ajuste a conclusão, sem forçar uma alteração.

1. CHECKPOINT COM DADOS ANTIGOS

Em harness.mjs, remova do checkpoint as informações fixas
relacionadas ao H-002:
- Tarefa padrão.
- Arquivo de evidência.
- Decisões pendentes sobre banco/auth.
- Próxima etapa específica.

Use informações explicitamente fornecidas ou obtidas do estado
atual documentado. Se não estiverem disponíveis, identifique-as
como não informadas; não infira progresso ou autorização.

Preserve a distinção entre árvore limpa, alterada e falha do Git.
Teste também ausência de contexto e contexto atualizado.

2. ESCOPO DE VERIFY --PRODUCT

O comando anuncia product-readiness, mas não executa build.

Nesta etapa, mantenha o comando como verificação parcial:
- Use nome de escopo que descreva exatamente o que foi verificado.
- Liste verificações não executadas e seus motivos.
- Não apresente sucesso parcial como prontidão integral do produto.
- Atualize a documentação do comando.
- Preserve falha quando os testes forem ausentes, placeholder,
  falhos ou não comprovados.

Não acrescente execução de build nesta rodada.
Teste os resultados de sucesso parcial e falha.

3. DIAGNÓSTICOS DE PROCESSOS

Revise run(), runManaged() e os consumidores relevantes.

Forneça diagnósticos limitados e sanitizados para distinguir:
- Falha ao iniciar o processo.
- Saída com código não zero.
- Timeout.
- Limite de saída excedido.
- Encerramento não confirmado.

Não publique nem persista stderr bruto.
Não suponha que truncamento seja sanitização.
Quando não for seguro expor uma mensagem, retorne uma
classificação estruturada suficiente para orientar a investigação.

Preserve os campos necessários aos consumidores existentes.
Teste falhas e ausência de exposição de marcadores sensíveis.

4. SAÍDA SEM LIMITE NO NATIVE-PROBE

Defina limites explícitos em bytes para o volume recebido
e para mensagens do protocolo, antes de acumular indefinidamente.

Ao exceder o limite:
- Interrompa a leitura.
- Rejeite requisições pendentes.
- Execute encerramento com prazo limitado.
- Retorne falha identificável, sem ecoar conteúdo recebido.

Preserve o orçamento total de tempo.
Teste excesso com e sem quebra de linha, usando processos
ou fluxos controlados, sem depender do Codex real.

5. IDENTIFICAÇÃO DOS ESPECIALISTAS

Substitua a busca global
rendered.stdout.includes(description)
por identificação estruturada na resposta JSON disponível.

Confirme a associação entre nome e descrição esperados;
confira o caminho de origem se a resposta o fornecer.
Não invente campos ou formatos.

Se a saída não permitir comprovar a identidade do especialista,
retorne não comprovado, sem aprovação por coincidência textual.

Teste:
- Associação correta.
- Descrição presente fora da estrutura esperada.
- Descrição repetida entre papéis.
- Nome incorreto ou ausente.
- JSON inválido e formato não suportado.

Reconhecimento de definição não comprova seleção nativa
nem execução das instruções em uma instância.

6. IDENTIFICAÇÃO DE TESTES REAIS

Em product-tests.mjs, corrija a heurística que rejeita casos
nomeados cuja descrição termina em .js, .mjs ou .cjs.

Use informações estruturais do relatório suportado para
distinguir caso real de execução de arquivo sem casos.
Se necessário, ajuste o adaptador e sua execução, mantendo
compatibilidade explícita com a versão local do Node.

Não aprove testes apenas por código zero ou texto impresso.

Preserve os cenários já cobertos:
- Ausência e placeholder.
- Testes falhos.
- Arquivos sem casos reais.
- Somente casos ignorados.
- Runner sem adaptador.
- Escopo do próprio harness.

Acrescente regressões para casos reais com nomes que terminam
em extensão e para a distinção entre arquivo e caso de teste.
Documente o que o relatório comprova e suas limitações.

ESCOPO AUTORIZADO

- scripts/harness/harness.mjs
- scripts/harness/processes.mjs
- scripts/harness/native-probe.mjs
- scripts/harness/product-tests.mjs
- scripts/harness/harness.test.mjs
- Documentação diretamente relacionada aos comandos,
  capacidades, evidências e registros desta rodada.

Prefira funções pequenas e testáveis nos arquivos existentes.
Não crie uma nova estrutura de automação ou dependências.

DOCUMENTAÇÃO

- Registre este prompt integral em docs/AI_PROMPTS.md.
- Acrescente o próximo identificador disponível em BUILD_LOG.md.
- Registre problema, reprodução, impacto, correção e evidência.
- Identifique a origem como revisão estática dos arquivos
  compartilhados nesta conversa; a reprodução local ocorre agora.
- Preserve falhas intermediárias e conclusões anteriores
  como histórico, acrescentando as correções.
- Não registre segredos, saídas privadas ou raciocínio interno.
- Mantenha revisão humana integral pendente.

VERIFICAÇÃO

1. Execute os testes direcionados durante as correções.
2. Ao concluir, execute a suíte completa do harness,
   doctor, validate e verify.
3. Execute verify --product e registre o resultado real;
   se o placeholder continuar presente, a falha é esperada.
4. Execute lint, typecheck e git diff --check.
5. Faça uma revisão independente delimitada das correções,
   seguindo os limites de concorrência e contexto existentes.

Testes controlados não equivalem a demonstrações nativas.
Não declare resolvidas as lacunas de hooks reais, seleção
nativa dos especialistas ou retomada em sessão limpa.

LIMITES

Não altere funcionalidades, dependências, lockfile ou CI.
Não altere configurações pessoais ou permissões.
Não execute turnos de modelo para os testes controlados.
Não crie commits, faça push, publique ou faça deploy.

ENTREGA

- Tabela dos seis achados com resultado, correção e teste.
- Comandos executados e resultados reais.
- Limitações e pendências.
- git status --short.
- Resumo das alterações, incluindo arquivos não rastreados.
- Diff exclusivo desta rodada, com caminho exato para revisão.

Não declare validação integral do harness com base apenas
nestas correções.
Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-10"></a>

## Prompt 10 — seis achados consolidados dos scripts (29/10/2026)

Origem: revisão estática dos arquivos compartilhados nesta conversa; reprodução
local ocorre nesta rodada. Ferramenta: Codex, skills plan-requirement,
deliver-requirement, verify-delivery e record-decision.
Prompt integral preservado em [arquivo versionável](../prompts/2026-10-29-harness-six-findings.md).
Contrato prévio: [H-006](../harness/evidence/six-findings-plan.md).
Resultados e limitações serão acrescentados conforme execução real. Revisão humana
integral permanece pendente; registros anteriores preservados como histórico.

### Reprodução e correções do Prompt 10

Os seis achados foram reproduzidos antes das alterações de produção: seis testes,
zero aprovados/seis falhas. [Evidência H-006](../harness/evidence/six-findings.md) contém
problema, impacto, correção e teste por ID. Contexto antigo do checkpoint foi
removido; --product agora anuncia verificação parcial; diagnósticos classificam
falhas sem stderr; RPC limita bytes e pendências; identidade associa nome/descrição
no esquema observado; casos reais são comprovados por eventos estruturados Node.

Falha intermediária: reporter referenciado por caminho Windows retornou failed;
URL file de import.meta.url corrigiu a importação e o teste passou. A revisão
independente achou um caminho adicional de exposição em decision de execpolicy;
teste vermelho confirmou, enumeração/rejeição de processo falho corrigiram e
seguimento independente confirmou em memória. Nenhuma saída privada foi registrada.
Prazo de 35s agora reserva limpeza. Última suíte direcionada: 14 aprovados.
Resultados finais dos comandos serão acrescentados após sua execução. Nenhum
turno de modelo para os testes controlados; nenhuma validação integral alegada.

### Fechamento do Prompt 10

Suíte completa final: 27 testes passaram. doctor/validate/verify, lint e typecheck
passaram, sem build. verify --product retornou 1 esperado pelo placeholder real;
escopo explicitamente parcial. O primeiro verify falhou somente na confirmação
de limpeza do probe; fechar stdin antes de confirmar encerramento causava corrida.
Ordem corrigida, regressão adicionada e execução real seguinte confirmou árvore
encerrada. Essa falha e os demais resultados permanecem na evidência H-006.

Revisão independente: uma instância com contexto mínimo, dois seguimentos
delimitados; sem novos achados nos ajustes finais revisados. Testes controlados não
comprovam seleção nativa, hooks reais ou retomada limpa. Sem aplicação/dependências/
lockfile/CI/permissões/configuração pessoal, commits ou publicação. Estado final e
atribuição das alterações em [inventário H-006](../harness/evidence/six-findings-final-state.md).
Revisão humana integral continua pendente.
