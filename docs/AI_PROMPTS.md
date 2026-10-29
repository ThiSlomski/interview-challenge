# Log de prompts de AI

## Ferramentas usadas

Codex: leitura local, consulta à documentação oficial e ao registro npm,
edição dos arquivos de tooling/documentação e execução das verificações locais.
Este registro descreve a avaliação do agente; não registra aprovação humana.

## Prompt 1 — diagnóstico anterior

- **Objetivo / resumo do prompt:** ler integralmente o README e instruções
  locais; diagnosticar o estado após `npm install` e `npm audit fix --force`,
  sem instalar pacotes nem editar arquivos; conferir dependências, ESLint,
  Next, TypeScript, Node/npm, lint, typecheck, build e Git, sem ler segredos.
- **Resultado do Codex:** identificou `next lint` removido e o peer de ESLint
  >=9 incompatível com ESLint 8.57.0. Typecheck e build passaram; build avisou
  sobre depreciação do React 18. Não havia repositório Git.
- **Limitação / erro do agente:** a execução direta dos comandos gerou
  `.next` e `tsconfig.tsbuildinfo` e o Next atualizou `next-env.d.ts`, apesar da
  restrição de não modificar arquivos; isso foi informado ao usuário. Uma
  execução isolada teria preservado literalmente a pasta original.
- **Revisão humana:** o usuário autorizou a correção de lint no prompt abaixo.
  Essa autorização de escopo não equivale à aprovação do resultado final.

## Prompt 2 — migração do lint (28/10/2026)

**Prompt do usuário, integral:**

```text
Aplique a correção do lint com base no diagnóstico realizado.

Escopo:
1. Mantenha Next.js e eslint-config-next em 16.4.3.
2. Selecione uma versão estável e exata do ESLint 9 compatível
   com as dependências instaladas.
3. Substitua .eslintrc.json por eslint.config.mjs, seguindo
   a documentação oficial e preservando core-web-vitals.
4. Configure os ignores necessários para arquivos gerados.
5. Troque o script de lint para "eslint .".
6. Fixe versões exatas das dependências diretas, preservando
   as versões atualmente resolvidas, exceto o ESLint.
7. Atualize package-lock.json por instalação normal.

Não atualize React nesta etapa.
Não use --force nem --legacy-peer-deps.
Não implemente funcionalidades nem inicialize Git ainda.
Não desative regras apenas para fazer o lint passar.

Validação:
- npm ci
- npm ls --depth=0
- npm ls eslint --depth=1
- npm run lint
- npm run typecheck
- npm run build
- npm audit

Corrija problemas de código apontados pelo lint apenas quando
necessário, explicando cada alteração.

Atualize README e docs/ARCHITECTURE.md com o estado real
das versões e a justificativa da migração.

Registre este prompt e os resultados em docs/AI_PROMPTS.md.
Diferencie a avaliação feita pelo Codex da revisão humana
ainda pendente; não invente aprovações ou resultados.

Ao final, apresente:
- Arquivos alterados e motivo.
- Versões escolhidas.
- Resultado de cada verificação.
- Avisos e pendências restantes.
```

**Decisões do Codex:** preservar todas as versões diretas resolvidas, exceto
ESLint 9.39.5, última versão estável da série 9 retornada pelo registro npm.
Os peers dos plugins instalados e o requisito de Node aceitam essa versão.
Migrar para flat config com `core-web-vitals` e os ignores de arquivos gerados
da documentação oficial, acrescidos de `**/*.tsbuildinfo`; não desativar regras.
Referências: [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
e [suporte de versões ESLint](https://eslint.org/version-support/).

**Resultado e avaliação do Codex:**

- `npm install`: código 0; lockfile atualizado por instalação normal, sem flags
  de contorno; zero vulnerabilidades reportadas.
- `npm ci`: código 0; 358 pacotes instalados e zero vulnerabilidades.
- `npm ls --depth=0`: código 0; versões diretas preservadas, exceto ESLint;
  ainda lista `@emnapi/runtime@1.11.3` e `@img/sharp-wasm32@0.35.5` como
  extraneous após instalação limpa. Causa não investigada nesta etapa.
- `npm ls eslint --depth=1`: código 0; ESLint 9.39.5 deduplicado, sem invalid.
- O primeiro `npm run lint` falhou com um erro `react-hooks/set-state-in-effect`
  em `components/Hello/index.tsx`, na chamada ao helper pelo efeito. O helper
  original já era assíncrono; a mensagem da regra não comprova um setState
  síncrono em runtime. O Codex substituiu esse helper pelo encadeamento de
  `api.get('/v1').then(...).catch(...)` dentro do efeito: `setMessage` fica
  explícito no callback da resposta, preservando chamada, mensagem e log de
  erro. Não foram adicionadas funcionalidades nem desativadas regras.
- Após a correção: `npm run lint`, `npm run typecheck` e `npm run build`
  passaram, todos com código 0. Lint final sem erros e sem avisos.
- `npm audit`: código 0, zero vulnerabilidades reportadas.
- Avisos mantidos: npm deprecia ESLint 9.39.5 por fim de suporte da série 9;
  Next deprecia React 18. React e suas tipagens não foram atualizados.
- README e arquitetura documentam as versões exatas e a justificativa. O
  build e typecheck geraram/atualizaram artefatos locais. Git não foi
  inicializado; não foram lidos valores de segredos.
- Limites: verificação local Windows/Node 22.13.1/npm 10.9.2, sem teste de
  navegador nem execução remota do CI. O script de testes permanece um
  placeholder. O Codex considera resolvido o conflito de lint dentro deste
  escopo, com as pendências acima; isso não constitui aprovação humana.

**Revisão humana:** pendente. O usuário ainda não revisou nem aprovou as
alterações finais, a escolha de versão ou os resultados desta execução.

## Prompt 3 — preparação do clone para entrega (28/10/2026)

**Ferramenta:** Codex, com leitura e comparação locais, cópia explícita dos
arquivos autorizados e validações por npm e Git.

**Prompt do usuário, integral:**

```text
Estamos preparando o repositório de entrega do desafio.

Esta pasta foi clonada do repositório original.
As alterações já validadas estão em:
C:\Projetos\interview-challenge-main

Leia o README e eventuais AGENTS.md aplicáveis.

1. Compare a pasta atual com a pasta anterior.
2. Transfira apenas as alterações da correção de dependências,
   lint e documentação:
   - package.json
   - package-lock.json
   - remoção de .eslintrc.json
   - criação de eslint.config.mjs
   - components/Hello/index.tsx
   - README.md
   - docs/ARCHITECTURE.md
   - docs/AI_PROMPTS.md
3. Preserve o diretório .git e o histórico do clone.
4. Não copie node_modules, .next, .env, credenciais ou arquivos
   gerados. Não altere a pasta anterior.
5. Confira o .gitignore para evitar versionar segredos,
   dependências e arquivos gerados.
6. Execute npm ci, lint, typecheck, build e npm audit.
7. Mostre git status --short e git diff --stat.
8. Confira git remote -v. Se origin apontar exatamente para
   https://github.com/imobilead-app/interview-challenge.git,
   remova esse remoto para evitar push no projeto base.
9. Registre esta etapa em docs/AI_PROMPTS.md.

Não crie commits, repositórios remotos nem faça push.
Não implemente funcionalidades nesta etapa.

Ao final, informe os resultados e quaisquer diferenças inesperadas.
```

**Comparação e decisões do Codex:**

- README das duas pastas lido; nenhum `AGENTS.md` encontrado nas pastas
  envolvidas ou nos diretórios ancestrais aplicáveis.
- Clone inicialmente sem alterações; HEAD
  `6885d64af1efd29745d6e8aeaa5fd9fa6cd4cb1c`.
- Transferidos apenas os sete arquivos existentes na origem indicados no
  prompt; removido `.eslintrc.json`. Este registro foi acrescentado à cópia
  de `docs/AI_PROMPTS.md` no clone.
- Fora da lista, diferenças de fim de linha em workflow, `.gitignore`, app,
  configuração Next e serviço HTTP; nenhuma dessas cópias foi feita.
- Diferença adicional em `tsconfig.json` da origem: `target: ES2017`,
  `jsx: react-jsx`, inclusão de `.next/dev/types/**/*.ts` e formatação.
  Não transferida, por estar fora do escopo.
- `.gitignore` do clone passou de `.env*.local` para `.env*`, com exceção
  explícita de `.env.example`. Dependências e artefatos já possuíam ignores.
- `git remote -v` inicialmente mostrou `origin` com a URL exata do projeto
  base para fetch e push. Remoto removido conforme autorização; `.git` e
  histórico preservados, sem commits nem publicação.
- A pasta anterior foi usada apenas para leitura. Não foram copiados
  dependências, artefatos, arquivos de ambiente ou credenciais.

**Validação no clone:** Windows, Node 22.13.1 e npm 10.9.2.

| Comando | Resultado |
| --- | --- |
| `npm ci` | Código 0; 358 pacotes instalados; zero vulnerabilidades |
| `npm run lint` | Código 0; nenhum erro ou aviso |
| `npm run typecheck` | Código 0, com o `tsconfig.json` original do clone |
| `npm run build` | Código 0; compilação, TypeScript e geração de páginas concluídos |
| `npm audit` | Código 0; zero vulnerabilidades reportadas |
| `git diff --check` | Código 0 |
| `git remote -v` após remoção | Sem saída; nenhum remoto configurado |

**Diferenças e limites observados:**

- `npm ci` avisou sobre fim de suporte do ESLint 9.39.5; build avisou sobre
  depreciação do React 18, conforme já documentado na etapa anterior.
- O build alterou automaticamente `tsconfig.json`, adicionando `target:
  ES2017`, `.next/dev/types/**/*.ts` e mudando `jsx` para `react-jsx`.
  Após o build, os bytes originais do arquivo do clone foram restaurados,
  pois sua transferência não foi autorizada. O build passou com os ajustes
  automáticos; o próximo build poderá reaplicá-los. Não se afirma que o
  Next.js 16 mantém esse arquivo intacto durante a execução.
- `.next`, `next-env.d.ts`, `tsconfig.tsbuildinfo` e `node_modules` foram
  gerados localmente pelas verificações e permanecem ignorados. Não foram
  copiados da pasta anterior nem incluídos no diff para versionamento.
- Git emitiu avisos de conversão futura de LF para CRLF; não são falhas de
  lint, typecheck ou build. Diferenças apenas de fim de linha fora do escopo
  não foram transferidas.
- Validação local feita pelo Codex; não houve teste funcional de navegador,
  execução de CI remoto ou implementação de funcionalidades. O script de
  testes continua sendo o placeholder já documentado.

**Revisão humana:** pendente. A execução e avaliação do Codex não equivalem
à aprovação humana do resultado.

## Prompt 4 — primeiro commit de estabilização (28/10/2026)

**Ferramenta:** Codex, por comandos locais e revisão do diff.

**Resumo do prompt do usuário:** executar build, examinar e preservar os
ajustes necessários do Next no `tsconfig.json`; repetir lint, typecheck e
build; confirmar estabilidade dos arquivos versionados; revisar todo o diff,
inclusive flat config e preservação do comportamento de `Hello`; conferir
documentação e ausência de segredos/artefatos; executar `git diff --check`;
adicionar explicitamente os arquivos ao índice e criar o commit
`chore: stabilize dependencies and migrate eslint configuration`.
Não implementar funcionalidades, configurar remotos nem fazer push; usar
somente a identidade Git já configurada.

**Ações e resultados observados pelo Codex:**

- O primeiro build passou (código 0) e alterou `tsconfig.json`. Foram aceitos
  `jsx: react-jsx` (runtime automático de JSX), `target: ES2017` (alvo
  sugerido pelo Next) e inclusão de `.next/dev/types/**/*.ts` (tipos de
  desenvolvimento), além da formatação automática. A decisão anterior de
  restaurar o arquivo não se aplica mais a esta etapa autorizada.
- Na rodada seguinte, lint, typecheck e build passaram, todos com código 0.
  Lint sem erros/avisos; build com o aviso de depreciação do React 18.
- Comparados hashes de todos os arquivos versionados existentes e o status
  antes/depois da segunda rodada: nenhum arquivo ou status mudou.
- Revisados diff de código/configuração/documentação, novo flat config e
  conteúdo estruturado do lockfile. O lockfile usa versão 3, fontes no
  registro npm público e integridade nos pacotes; a comparação com HEAD
  encontrou 116 entradas adicionadas, 64 removidas e 155 modificadas.
  As versões diretas correspondem ao `package.json`. A instalação limpa e
  audit com zero vulnerabilidades foram executados na etapa anterior deste
  clone; não foram repetidos nesta etapa.
- `Hello` preserva a requisição a `/v1` no efeito, estado/mensagem exibida e
  log de erro. Revisão por leitura de código, sem teste funcional em browser.
- README e arquitetura atualizados com a configuração TypeScript mantida
  e a evidência do segundo build estável. Resultados anteriores permanecem
  identificados como históricos, sem alegar nova execução ou aprovação humana.
- A identidade Git já estava configurada; nenhum nome ou e-mail foi criado
  ou alterado pelo agente. Nenhum remoto foi configurado e não houve push.

**Revisão humana:** pendente; autorização para criar o commit não equivale
à revisão humana dos resultados técnicos.

## Prompt 5 — Harness V2 (28/10/2026)

- Ferramenta: Codex na sessão do workspace Windows; CLI local inspecionado separadamente.
- Pedido: ler o arquivo enviado e executar a construção do Harness.
- Prompt integral e referências: [arquivo original preservado](prompts/2026-10-28-harness.md).
- Escopo autorizado: ferramentas, configuração local, skills, documentação e demonstração; sem implementação funcional, dependências, CI remoto ou publicação.
- Estado inicial: branch main, HEAD f1b6f437756eb3c86c141986818c34bb720ab9c8, working tree limpo; nenhum AGENTS.md local/ancestral encontrado.
- Avaliação crítica, ações e resultados: consolidados em docs/harness/BUILD_LOG.md e evidence/; documentação oficial isolada não foi tratada como prova de carregamento na sessão atual.
- Revisão humana: pendente.

### Resultado do Prompt 5

- Construídos AGENTS, configuração de concorrência, quatro especialistas, rules
  restritivas, hooks opcionais, seis skills, quatro comandos Node, workflows,
  matriz do README, memória, SOLUTION e evidências. Histórico preservado.
- Quatro especialistas foram instanciados, com Backend reutilizado para revisão
  independente e Frontend para retomada. Contexto herdado e seleção manual dos
  papéis registrados. Descoberta nativa de skills e dos quatro TOML confirmada
  separadamente por mecanismos locais, sem turnos de modelo adicionais.
- Aceito: formatos locais compatíveis e scripts explícitos como alternativa aos
  hooks. Ajustado: timeout de lint de 60s para 180s após falha real; validações
  de estado/referências reforçadas. Rejeitado: assumir que teste placeholder,
  leitura manual ou handler isolado comprovam produto, seleção nativa ou hook real.
- Resultados reais, falhas e limites: [H-001](harness/evidence/demo.md),
  [construção](harness/BUILD_LOG.md), [estado Git](harness/evidence/final-state.md).
- Não houve implementação funcional, alteração de dependências/lockfile/CI,
  commit, push, deploy, envio, instalação/atualização do Codex ou trust automático.
- Tokens/cache/custo indisponíveis; indicadores de esforço identificados como tais.
- Revisão humana do resultado final permanece pendente.

## Prompt 6 — Correção dos cinco achados do Harness (28/10/2026)

- Ferramenta: Codex, workspace Windows; escopo apenas Harness.
- [Prompt integral](prompts/2026-10-28-harness-corrections.md).
- Contrato e aceite prévios: [H-002](harness/evidence/corrections-plan.md).
- Preservados ajustes anteriores de nome/referências do prompt; sem código funcional,
  dependências, lockfile, CI, commits, push ou configuração pessoal.
- Resultados e avaliação crítica: [evidência H-002](harness/evidence/corrections.md).
- Revisão humana: pendente.

### Resultados e avaliação crítica do Prompt 6

- Corrigidos checkpoint/Git, estado efetivo do probe, esquema de hooks, fixture
  causal e inspeção/execução/prova dos testes em verify --product.
- Testes direcionados: 12 passaram, com fixtures exclusivamente temporárias.
  Não foram alterados testes, package.json ou funcionalidades da aplicação.
- Avaliação crítica: código 0 não prova testes reais; adaptador inicial Node/TAP
  exige escopo explícito e casos nomeados. Outros runners ficam não comprovados,
  sem impor runner à aplicação. Falhas do Git impedem proposta válida.
- Revisão independente em leitura encontrou falso placeholder em echo+runner e
  nomes TODO; ajustado e coberto por regressões. Seguimento com sete casos em
  memória confirmou o ajuste, identificado como simulação e não execução real.
- A primeira rodada integrada falhou por um link relativo criado na nova evidência;
  o validador e a baseline da fixture rejeitaram. Link corrigido e falha preservada.
- Rodada seguinte: doctor/validate/verify, lint/typecheck passaram. Modo --product
  executado com código 1 esperado pelo placeholder real, sem aprovar o produto.
- Timeout de pai/filho QA demonstrado realmente em Windows. Hook real, seleção
  nativa e retomada limpa continuam sem demonstração; procedimentos documentados.
- Nenhuma confiança/permissão/configuração pessoal foi alterada; sem dependências,
  CI, commit, push ou publicação. Revisão humana permanece pendente.

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

## Prompt 9 — revisão das instruções dos quatro especialistas (29/10/2026)

**Origem:** revisão do conteúdo compartilhado nesta conversa, sem afirmar acesso
remoto aos arquivos. Ferramenta: Codex; skill record-decision. Classificação:
ajustes de escopo e prevenção de instruções desatualizadas, sem alegar falha de
execução causada pelos textos, pois isso não foi demonstrado.

**Prompt integral:**

```text
Ajuste as instruções dos quatro especialistas em .codex/agents/
conforme a revisão abaixo e documente as alterações.

Leia AGENTS.md e preserve todo trabalho existente.
Localize os arquivos reais; não crie agentes duplicados.

CORREÇÕES

1. Restrições temporárias — quatro especialistas

Remova a frase fixa “Nesta etapa Harness não implementar...”.

Substitua por uma orientação equivalente a:

“Execute somente o escopo explicitamente atribuído pelo
orquestrador, respeitando AGENTS.md e a fase vigente.
Leitura é o padrão; escrita exige atribuição no contrato.
A mudança de fase, isoladamente, não autoriza implementação.”

Preserve as demais restrições de segurança, publicação,
configurações pessoais e criação de subagentes.

2. Escopo do Backend

Permita, quando explicitamente atribuídos:
- Rotas em app/api/**.
- Módulos de servidor para autenticação, autorização,
  validação, regras e integração com persistência.
- Testes correspondentes.

Não escolha antecipadamente pastas, bibliotecas ou arquitetura.
O contrato deve listar os caminhos autorizados.
Não transfira ao Backend a responsabilidade por schema
e migrations do especialista de Banco.

3. Escopo do Frontend

Delimite a escrita a arquivos de interface, lógica de cliente
e testes correspondentes explicitamente atribuídos.

Esclareça que:
- Estar em app/** ou services/** não torna um arquivo
  automaticamente responsabilidade do Frontend.
- Código executado no servidor e contratos compartilhados
  exigem definição de responsabilidade pelo orquestrador.
- Cada arquivo continua com um único responsável por escrita.

4. Missões

Nas descrições e instruções de Frontend, Backend e Banco,
deixe explícito que podem analisar, implementar e verificar,
sempre conforme autorização e contrato.

Preserve a missão de consolidação do especialista
de Documentação.

5. Contexto seletivo

Substitua listas de leitura obrigatória indiscriminada por
fontes consultadas conforme a tarefa.

Mantenha a leitura das instruções aplicáveis e do contrato.
Consulte apenas requisitos, decisões, trechos e evidências
necessários; amplie a leitura quando houver dependência
ou dúvida concreta.

Documentação não deve reler integralmente docs/AI_PROMPTS.md
em toda execução. Para acrescentar registros, confira a
estrutura e as entradas relevantes.

Se um caminho não existir, registre a ausência.
Não trate ausência como sucesso nem crie arquivos fora
do escopo para satisfazer uma referência.

6. Serviços externos

Esclareça a diferença entre escrever uma integração
e executá-la durante o trabalho do agente.

Implementar código de integração pode fazer parte de uma
tarefa autorizada. Chamadas externas pelo agente permanecem
proibidas por padrão e exigem autorização explícita no
contrato, compatível com as instruções superiores.

Não faça chamadas externas nesta etapa.

DOCUMENTAÇÃO

- Registre este prompt integral em docs/AI_PROMPTS.md,
  com data real, resultados e limitações.
- Acrescente o próximo registro disponível em
  docs/harness/BUILD_LOG.md.
- Classifique os achados como ajustes de escopo e prevenção
  de instruções desatualizadas.
- Não alegue falha de execução causada por esses textos:
  isso não foi demonstrado.
- Identifique a origem como revisão do conteúdo compartilhado
  nesta conversa, sem afirmar acesso remoto aos arquivos.
- Preserve o histórico e a revisão humana integral pendente.

VALIDAÇÃO

- Confira a sintaxe TOML e os campos obrigatórios dos agentes
  pelo mecanismo compatível já disponível.
- Execute validate e as verificações específicas existentes
  para esses arquivos.
- Execute git diff --check.
- Confira coerência com AGENTS.md e o contrato de delegação.
- Diferencie validação estática de carregamento e execução nativos.
- Não repita testes da aplicação por alterações de instruções.
- Se um validador exigir literalmente as frases antigas,
  relate a dependência antes de ampliar o escopo.

LIMITES

Altere somente:
- Os quatro arquivos existentes em .codex/agents/.
- docs/AI_PROMPTS.md.
- docs/harness/BUILD_LOG.md.

Não altere código funcional, scripts, skills, configuração
principal, dependências, lockfile ou CI.
Não inicie funcionalidades.
Não crie commits, faça push ou publique.

ENTREGA

Apresente:
1. Arquivos alterados e diff desta rodada.
2. Ajuste realizado para cada achado.
3. Comandos executados e resultados reais.
4. Limitações e pendências.

Não declare resolvidas as lacunas de hooks reais, seleção
nativa dos especialistas ou retomada em sessão limpa
sem novas evidências.
```

**Alterações:** atualizados os quatro arquivos existentes backend.toml,
frontend.toml, database.toml e documentation.toml, sem criar papéis duplicados.
Escopo e fase agora dependem de atribuição explícita; leitura permanece padrão,
escrita depende de contrato, e mudança de fase não autoriza implementação.
Preservadas restrições de segredos, publicação, Git/configuração pessoal e
subdelegação, bem como permissões herdadas e ausência de sandbox independente.

Backend pode receber rotas, módulos de servidor e testes nos caminhos listados
no contrato, sem escolher pastas/bibliotecas e sem assumir schema/migrations.
Frontend cuida de interface/cliente/testes atribuídos; localização em app/services
não concede propriedade. Código de servidor e contratos compartilhados exigem
responsabilidade definida pelo orquestrador e escritor único.
Frontend/Backend/Banco podem analisar, implementar e verificar quando autorizados;
Documentação preserva a missão de consolidação e não recebe código funcional.
Fontes passam a ser seletivas, com ausência registrada e ampliação por dependência
ou dúvida concreta; para o log, Documentação confere estrutura/entradas relevantes.
Escrever integração é distinto de executá-la: chamadas externas continuam proibidas
por padrão e exigem contrato compatível com instruções superiores.

**Coerência e limites:** instruções compatíveis com AGENTS.md e contrato de delegação;
nenhuma autorização para iniciar o produto. Busca nos scripts não encontrou
dependência literal dos textos substituídos. Nenhuma chamada externa nesta rodada;
testes da aplicação não repetidos.

**Resultados reais das verificações (29/10/2026):**

- `node scripts/harness/harness.mjs validate`: código 0, ok:true, sem erros.
  Confere estrutura, campos obrigatórios e referências; não comprova execução nativa.
- `node --test --test-name-pattern="native capability state" scripts/harness/harness.test.mjs`:
  código 0, um teste específico de capacidades aprovado. Demais testes não executados.
- `codex --strict-config app-server --print-startup-config`: código 0, CLI
  0.164.0-alpha.11.1; validação local de configuração, sem iniciar o app-server.
- Primeira tentativa `codex --strict-config debug prompt-input ...`: código 1,
  sem JSON; reconhecimento não comprovado por essa combinação. Não se atribui a
  falha aos textos das instruções. Nenhuma alteração de configuração para contornar.
- `codex debug prompt-input ...`, mecanismo local já utilizado: código 0,
  resposta JSON válida e as quatro descrições exatas reconhecidas. O carregamento
  dos metadados pelo parser/renderizador não demonstra aplicação do corpo das
  instruções em instâncias nem seleção pelo nome nativo. Somente resultados
  sanitizados extraídos; saída bruta não exposta nem persistida. Zero turnos de modelo.
- `git diff --check`: código 0. Comparação com a baseline desta rodada confirmou
  somente os seis arquivos autorizados alterados, nenhum novo agente/arquivo e
  preservação de scripts, skills, configuração principal e demais arquivos.

Revisão humana integral permanece pendente; ajustes não demonstram seleção nativa,
disparo real dos hooks ou retomada em sessão limpa.

## Prompt 10 — seis achados consolidados dos scripts (29/10/2026)

Origem: revisão estática dos arquivos compartilhados nesta conversa; reprodução
local ocorre nesta rodada. Ferramenta: Codex, skills plan-requirement,
deliver-requirement, verify-delivery e record-decision.
Prompt integral preservado em [arquivo versionável](prompts/2026-10-29-harness-six-findings.md).
Contrato prévio: [H-006](harness/evidence/six-findings-plan.md).
Resultados e limitações serão acrescentados conforme execução real. Revisão humana
integral permanece pendente; registros anteriores preservados como histórico.

### Reprodução e correções do Prompt 10

Os seis achados foram reproduzidos antes das alterações de produção: seis testes,
zero aprovados/seis falhas. [Evidência H-006](harness/evidence/six-findings.md) contém
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
atribuição das alterações em [inventário H-006](harness/evidence/six-findings-final-state.md).
Revisão humana integral continua pendente.
