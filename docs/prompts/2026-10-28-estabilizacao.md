# 2026-10-28-estabilizacao

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

O Prompt 1 não tem data registrada; sua inclusão neste arquivo da estabilização
não lhe atribui a data de 28/10/2026. Prompts 1 e 4 contêm somente resumos.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-1"></a>

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


<a id="registro-2"></a>

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


<a id="registro-3"></a>

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


<a id="registro-4"></a>

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
