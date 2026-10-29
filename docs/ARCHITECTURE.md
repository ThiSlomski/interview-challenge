# Arquitetura da solução

## Estado real desta etapa — migração do lint (28/10/2026)

Esta etapa altera apenas ferramentas, versões e documentação. As seções de
arquitetura funcional abaixo continuam como template, não como implementação
ou evidência de funcionamento de banco, autenticação ou autorização.

### ADR: alinhar o lint ao Next.js 16

- **Contexto:** o upgrade anterior deixou `next lint` (removido no Next 16),
  `.eslintrc.json` legado e ESLint 8.57.0 incompatível com o peer >=9 de
  `eslint-config-next@16.4.3`.
- **Decisão:** manter Next e eslint-config-next em 16.4.3; usar ESLint 9.39.5,
  `eslint .` e `eslint.config.mjs` com `defineConfig`, `globalIgnores` e
  `eslint-config-next/core-web-vitals`, conforme a
  [documentação oficial](https://nextjs.org/docs/app/api-reference/config/eslint).
  Nenhuma regra foi desativada. Ignorar `.next/**`, `out/**`, `build/**`,
  `next-env.d.ts` e `**/*.tsbuildinfo`, que são artefatos gerados.
- **Critério de versão:** 9.39.5 é a última versão estável da série 9 retornada
  pelo npm nesta execução. Seus requisitos de Node e os peers de ESLint dos
  plugins instalados foram conferidos. A versão está marcada no registro como
  sem suporte; permanece por restrição explícita ao ESLint 9 nesta etapa.
- **Alternativas:** manter ESLint 8 preservaria o conflito de peers; adotar
  ESLint 10 ou atualizar React extrapolaria o escopo autorizado.
- **Reprodutibilidade:** versões diretas exatas, preservando as resolvidas
  anteriormente, exceto ESLint: Next/eslint-config-next 16.4.3, React/React DOM
  18.2.0, axios 1.20.0, TypeScript 5.3.3, @types/node 20.11.20,
  @types/react 18.2.58 e @types/react-dom 18.2.19. Lockfile atualizado por
  `npm install` normal; instalação limpa validada com `npm ci`.
- **Ambiente:** Windows, Node 22.13.1, npm 10.9.2. Não foi inicializado Git.
- **Pendências:** revisão humana das alterações; migração futura do React 18
  depreciado; escolha futura de uma série suportada de ESLint; alinhamento do
  CI (hoje Node 20) ao ambiente local. O audit do CI continua report-only e o
  script de testes continua um placeholder. Nenhuma execução remota de CI ou
  validação funcional do desafio é afirmada por esta etapa.

### Validação anterior pelo Codex na pasta de origem

| Comando | Resultado em 28/10/2026 |
| --- | --- |
| `npm install` | Código 0; lockfile atualizado normalmente; zero vulnerabilidades |
| `npm ci` | Código 0; 358 pacotes instalados; zero vulnerabilidades |
| `npm ls --depth=0` | Código 0; versões diretas esperadas; dois pacotes extraneous |
| `npm ls eslint --depth=1` | Código 0; ESLint 9.39.5 deduplicado; nenhum peer inválido nessa consulta |
| `npm run lint` | Código 0 na execução final; zero erros e zero avisos |
| `npm run typecheck` | Código 0 na execução final |
| `npm run build` | Código 0 na execução final; aviso de depreciação do React 18 |
| `npm audit` | Código 0; zero vulnerabilidades reportadas |

A primeira execução do lint apontou `react-hooks/set-state-in-effect` em
`components/Hello/index.tsx`, na chamada ao helper `handleContent` pelo efeito.
O helper já era assíncrono; o diagnóstico da regra não comprova que havia
atualização síncrona em runtime. O ajuste mínimo explicita a atualização
`setMessage` no callback de resolução de `api.get('/v1')`, dentro do efeito,
mantendo mensagem e tratamento de erro. Nenhuma regra foi desativada e nenhuma
funcionalidade nova foi implementada. Lint, typecheck e build foram repetidos
após esse ajuste e passaram. Não houve teste de navegador nesta etapa.

Avisos restantes: npm marca ESLint 9.39.5 como sem suporte; build deprecia
React 18. `npm ls --depth=0` ainda lista `@emnapi/runtime@1.11.3` e
`@img/sharp-wasm32@0.35.5` como extraneous, inclusive após `npm ci`; a causa
não foi investigada nesta correção e não houve limpeza manual. O audit não
substitui avaliação de compatibilidade nem comprova segurança funcional.
Build/typecheck atualizam artefatos gerados em `.next` e `tsconfig.tsbuildinfo`.
Avaliação técnica local feita pelo Codex; revisão humana permanece pendente.

### Estabilização do clone antes do primeiro commit (28/10/2026)

O primeiro `npm run build` desta etapa passou e reaplicou os ajustes do
Next.js ao `tsconfig.json`. Agora eles são preservados por autorização:

- `jsx: react-jsx`: ajuste obrigatório informado pelo Next para usar o
  runtime automático de JSX do React.
- `target: ES2017`: alvo sugerido pelo Next, cujo diagnóstico cita suporte
  a top-level await. É mantido como configuração recomendada do framework,
  sem afirmar que a aplicação utiliza esse recurso.
- `.next/dev/types/**/*.ts` no `include`: inclui tipos gerados pelo Next em
  desenvolvimento; os arquivos gerados continuam ignorados pelo Git.
- A expansão dos arrays é apenas formatação automática do JSON.

Em seguida, `npm run lint`, `npm run typecheck` e `npm run build` passaram
com código 0. A comparação de hashes de todos os arquivos versionados
existentes e de `git status --short`, antes e depois dessa rodada, confirmou
que não houve novas alterações. O segundo build manteve apenas o aviso de
depreciação do React 18. A restauração de `tsconfig.json` descrita na etapa
anterior do log de AI é histórica e foi substituída por esta decisão.

A revisão do diff confirma que `Hello` mantém a chamada a `/v1` no efeito,
a atribuição de `res.data.message`, o estado inicial vazio, o mesmo `<h1>`
e o log de erro. A troca de `async/await` por callbacks da Promise atende
ao lint sem adicionar comportamento funcional. Essa conclusão vem da
leitura do código e das validações estáticas; não houve teste de navegador.

> Preencha este documento com as decisões da sua solução e o **porquê** de cada
> uma. É um dos itens avaliados — queremos entender seu raciocínio, não só o
> código. Pode remover estas instruções em itálico ao entregar.

## Visão geral

_Descreva, em poucos parágrafos, o que você construiu e como as partes se
encaixam (frontend, API, banco de dados, serviços externos)._

## Diagrama

_Um diagrama simples (ASCII, Mermaid ou imagem em `docs/`) do fluxo de dados:
do formulário no client até a persistência no banco e a chamada da API de
previsão do tempo._

```text
[ Browser / Form ] --POST--> [ API /api/... ] --> [ DB ]
        |
        +--GET (client)--> [ API pública de previsão do tempo ]
```

## Banco de dados

- **Escolha:** _qual banco e por quê (trade-offs: simplicidade, fidelidade a
  produção, tempo)._
- **Modelo de dados:** _tabelas/coleções, tipos, índices, unicidade (ex.: e-mail)._
- **Migrations:** _ferramenta e como rodar do zero._

## Segurança (DevSecOps)

_Para cada item, diga o que fez e por quê — e o que deixaria para depois._

- **Senha:** _algoritmo de hash, custo, política._
- **Autenticação/autorização:** _estratégia de sessão (cookie httpOnly, JWT,
  lib), proteção de rotas, **autorização por papel** (user vê só o próprio
  registro; admin lista tudo — checagem no servidor), como um usuário vira
  admin, CSRF/CORS, rate limiting no login, prevenção de user enumeration,
  expiração/renovação._
- **Validação/sanitização:** _client e server; proteção contra injeção e XSS._
- **Segredos:** _como são carregados; o que está em `.env.example`._
- **Rate limiting / anti-abuso:** _estratégia._
- **Headers de segurança:** _quais e onde configurados._
- **Dependências:** _resultado do `npm audit`; findings aceitos e por quê._
- **CI de segurança:** _qual passo (SAST/SCA/secret scan) e o que ele cobre._
- **(Plus) Containers / IaC:** _o que provisionaria e por quê._

## Testes

- **Runner e por quê:** _Vitest/Jest/Playwright/outro._
- **O que cobri:** _validação, regras de autorização (user vs. admin), API._
- **Como rodar:** _comando(s); e onde isso roda no CI._

## Decisões e trade-offs (ADRs)

> Registre decisões relevantes como ADRs curtos. Copie o bloco abaixo por
> decisão.

### ADR-001: _título da decisão_

- **Contexto:** _o problema/necessidade._
- **Decisão:** _o que você escolheu._
- **Alternativas consideradas:** _o que descartou e por quê._
- **Consequências:** _prós, contras e o que fica como dívida técnica._

## O que eu faria com mais tempo

_Liste o que priorizaria a seguir — mostra visão e senso de priorização._

## ADR-H001 — Harness local antes do desenvolvimento funcional (28/10/2026)

- Contexto: o esqueleto foi estabilizado nos registros acima; o pedido atual
  solicita oito componentes de desenvolvimento assistido, antes do produto.
- Decisão: AGENTS conciso; configuração .codex com concorrência 2; quatro
  especialistas standalone; seis skills .agents/skills; scripts Node sem pacotes;
  workflows manuais guiados, memória explícita e hooks opcionais de orientação.
  [Guia operacional](HARNESS.md), [fontes oficiais e formatos](harness/sources.md).
- Alternativas: só criar pastas não demonstraria operação; framework adicional
  ou Agents API ampliaria escopo/custo; hooks globais e trust automático foram
  excluídos pelo pedido. Scripts explícitos mantêm operação sem depender de hooks.
- Consequências: checks positivos/negativos e retomada reproduzíveis; manutenção
  pequena proporcional ao prazo de três dias; documentação não vira pipeline.
- Limites: papéis executados por leitura explícita, seleção nativa não demonstrada;
  revisão de leitura é orientação, sem isolamento por agente; rules cobrem prefixos
  diretos e não formas indiretas; handler testado não comprova disparo real.
  Estado detalhado por componente em [capabilities](harness/capabilities.md).
- Validação: [evidência real H-001](harness/evidence/demo.md); preservação do produto,
  dependências, lockfile e CI conferida contra hashes iniciais. Banco/auth/runner
  continuam sem decisão. Revisão humana pendente; sem commit ou publicação.
