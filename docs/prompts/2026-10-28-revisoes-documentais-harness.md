# 2026-10-28-revisoes-documentais-harness

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-7"></a>

## Prompt 7 — revisão humana pontual de docs/HARNESS.md (28/10/2026)

**Origem:** revisão do texto compartilhado nesta conversa, sem atribuir inspeção
humana dos arquivos locais. Escopo limitado a docs/HARNESS.md; não representa
conclusão da revisão humana integral do Harness nem aprovação da redação resultante.
**Ferramenta:** Codex; skill record-decision para consolidar os registros.

**Prompt integral:**

```text
Ajuste docs/HARNESS.md conforme a revisão humana desta conversa
e documente os problemas encontrados e suas correções.

1. Explique os oito componentes na própria página:
   rules, skills, agentes, subagentes, comandos, workflows,
   hooks e memória.

   Diferencie:
   - Agentes: papéis com responsabilidades definidas.
   - Subagentes: instâncias que recebem tarefas delimitadas.

2. Corrija a ambiguidade sobre retomada.
   Substitua a afirmação genérica de que a demonstração
   exercitou retomada por:

   “A demonstração incluiu retomada com contexto residual
   declarado. A retomada em sessão limpa permanece
   não demonstrada.”

   Preserve a descrição das outras verificações realizadas.

3. Substitua “Timeout de árvore QA foi demonstrado em Windows”
   por:

   “O encerramento do processo principal e de seus descendentes
   após timeout foi demonstrado em Windows.”

4. Confira a formatação do arquivo original.
   O texto enviado para revisão apresentou escapes em links,
   listas e blocos de código. Corrija somente se esses escapes
   estiverem realmente no arquivo.
   Se forem apenas efeito da cópia, registre que o problema
   não foi reproduzido; não declare uma correção inexistente.

REGISTRO

- Acrescente esta revisão em docs/AI_PROMPTS.md, incluindo
  este prompt integral e o resultado real.
- Registre em docs/harness/BUILD_LOG.md:
  problema encontrado, impacto, alteração e verificação.
- Use a data real da execução.
- Identifique a origem como revisão do texto compartilhado
  nesta conversa, sem afirmar inspeção dos arquivos locais.
- Registre que a redação anterior podia sugerir retomada em
  sessão limpa e foi ajustada para refletir a evidência.
- Diferencie melhoria de clareza, ambiguidade corrigida
  e eventual problema de formatação confirmado.
- Preserve os registros históricos.
- Não marque a revisão humana integral do harness como
  concluída: esta revisão abrange somente docs/HARNESS.md.

VALIDAÇÃO

Confira os links locais e a formatação Markdown.
Execute o validador documental existente, se aplicável,
e git diff --check.
Não repita testes da aplicação por alterações apenas textuais.

Não altere código, configuração, dependências ou CI.
Não crie commits nem faça push.

Ao final, apresente o diff desta rodada, os resultados
das verificações e os registros adicionados.
```

**Resultado real:** os oito componentes passaram a ter explicação na própria
página, e o diagrama distingue papéis de instâncias. A redação genérica de retomada
foi substituída pela distinção entre contexto residual declarado e sessão limpa
não demonstrada, preservando diagnóstico, fixture negativa, política e handlers.
A descrição de timeout foi reescrita para identificar processo principal e
descendentes. A redação anterior podia sugerir retomada em sessão limpa e foi
ajustada para refletir a evidência.

**Formatação:** o problema de escapes não foi reproduzido no arquivo; a conferência
do original encontrou zero escapes de sintaxe Markdown, duas cercas de código
correspondentes ao único bloco Mermaid e nenhum espaço no fim das linhas.
Nenhuma correção de escapes foi feita; a origem exata do efeito na cópia não foi
comprovada. A inclusão das explicações é melhoria de clareza; a retomada é
ambiguidade corrigida.

**Validação:** `node scripts/harness/harness.mjs validate` passou com `ok:true`
e código 0; links locais válidos. Conferência de Markdown: listas separadas por
linhas em branco, cercas correspondentes e nenhum escape indevido ou espaço final.
`git diff --check` passou com código 0. Comparação com o início desta rodada
confirmou alterações somente nos três documentos solicitados.

**Limites:** somente três documentos alterados; sem código, configuração,
dependências, CI, commit ou push. Testes da aplicação não repetidos. Revisão humana
integral do Harness permanece pendente; esta revisão abrange somente docs/HARNESS.md.


<a id="registro-8"></a>

## Prompt 8 — prevenção de instruções desatualizadas em AGENTS.md (28/10/2026)

**Origem:** revisão do texto compartilhado nesta conversa, sem afirmar inspeção
remota dos arquivos. Ferramenta: Codex; skill record-decision. Os dois ajustes são
preventivos; não constituem relato de falha de execução.

**Prompt integral:**

```text
Ajuste AGENTS.md para evitar que instruções temporárias fiquem
desatualizadas nas próximas etapas. Documente esta revisão.

Leia as instruções aplicáveis e preserve alterações existentes.

ALTERAÇÕES

1. Substitua a restrição iniciada por “Nesta etapa: sem código
   funcional...” por:

   “Execute somente o escopo autorizado para a tarefa atual.
   Consulte a fase vigente na memória do projeto e confronte-a
   com o pedido atual. Restrições temporárias devem indicar
   a etapa a que pertencem e ser atualizadas quando ela terminar.”

   Preserve no histórico que a construção do harness ocorreu
   sem alterações funcionais, dependências, lockfile, CI,
   commits ou publicação.

   Essa mudança não autoriza iniciar funcionalidades ou realizar
   ações fora do escopo desta tarefa.

2. Substitua a afirmação “npm test hoje é placeholder” por:

   “Ausência de testes não é aprovação. Confira o script e os
   testes existentes antes de interpretar o resultado. O estado
   atual das verificações deve ser registrado na memória
   e nas evidências.”

   Preserve a orientação de executar doctor, validate e verify.
   Não altere o estado registrado dos testes sem nova evidência.

DOCUMENTAÇÃO

- Registre este prompt integral em docs/AI_PROMPTS.md,
  com data real, alterações, resultados e limitações.
- Acrescente a revisão em docs/harness/BUILD_LOG.md usando
  o próximo identificador disponível.
- Classifique os dois ajustes como prevenção de instruções
  desatualizadas, sem alegar falha de execução.
- Identifique a origem como revisão do texto compartilhado
  nesta conversa, sem afirmar inspeção remota dos arquivos.
- Preserve o histórico e mantenha a revisão humana integral
  do harness como pendente.

VALIDAÇÃO

- Confira coerência entre AGENTS.md e o estado atual documentado.
- Execute o validador documental existente, se aplicável.
- Execute git diff --check.
- Não repita testes da aplicação por alterações apenas textuais.
- Se um validador depender literalmente das frases antigas,
  relate a dependência antes de ampliar o escopo.

LIMITES

Altere somente AGENTS.md, docs/AI_PROMPTS.md e
docs/harness/BUILD_LOG.md.

Não altere configuração, scripts, código funcional,
dependências, lockfile ou CI.
Não crie commits, faça push ou publique.

ENTREGA

Apresente o diff desta rodada, os registros adicionados
e os resultados das verificações.
Não declare concluída a revisão dos quatro especialistas:
seus arquivos ainda serão examinados.
```

**Alterações e resultado:** AGENTS.md passou a vincular o escopo ao pedido atual
e à fase vigente, exigindo identificação e atualização das restrições temporárias.
A declaração fixa de placeholder foi substituída pela orientação de conferir o
script e os testes reais, mantendo doctor, validate e verify. Nenhum estado de
testes foi atualizado sem evidência nova; memória e evidências existentes foram
preservadas. A construção H-001 e as correções H-002 permanecem registradas como
etapas sem alterações funcionais, dependências, lockfile, CI, commits ou publicação.

**Coerência e limites:** a memória ainda descreve produto pendente e trabalho no
Harness; o pedido atual autoriza somente três documentos. A nova redação não
autoriza funcionalidades ou ações externas. Não foi encontrada dependência
literal das frases antigas nos validadores. Não houve ampliação de escopo nem
repetição de testes da aplicação. O validador documental existente passou com
ok:true e código 0; git diff --check passou com código 0. A comparação com o início
da rodada confirmou somente os três documentos autorizados alterados, sem novos
arquivos no projeto. Revisão humana integral do Harness e revisão dos arquivos dos quatro
especialistas permanecem pendentes; esta rodada não os examina.
