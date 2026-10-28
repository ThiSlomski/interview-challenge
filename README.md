# Imobilead — Desafio Técnico: Engenheiro(a) de Software (DevSecOps)

> **Nível:** Pleno ou Sênior · **Stack base:** Next.js (App Router) + TypeScript
> **Prazo:** 3 dias · **Uso de AI:** permitido e incentivado (com registro — ver abaixo)

Bem-vindo(a)! Este desafio avalia você como **engenheiro(a) de software** com
forte atuação em **DevOps e Segurança (DevSecOps)**. Mais do que "fazer
funcionar", queremos ver **como você pensa**: arquitetura, segurança, automação,
qualidade e as decisões (trade-offs) por trás de cada escolha.

Você tem **3 dias** e pode — deve — usar ferramentas de AI. O que nos interessa
não é *se* você usou AI, e sim **como** você a usou: com critério, revisão e
responsabilidade (ver [Uso de AI](#uso-de-ai-importante)).

---

## Sobre a Imobilead

A Imobilead é a startup brasileira (SaaS) por trás do CRM líder em gestão de
leads para o mercado imobiliário. Nossa plataforma lida com dados de clientes em
escala, então **segurança, confiabilidade e automação** são parte do dia a dia da
engenharia — exatamente o que este desafio exercita.

---

## O que já vem no repositório

Um esqueleto **Next.js 16.4.3 (App Router)** com TypeScript:

- `app/` — páginas e layout
- `app/api/` — rotas de API internas (seu backend)
- `components/` — componentes de UI
- `services/` — cliente HTTP (axios) e serviços

Você pode reestruturar o projeto como achar melhor — só **justifique** as
mudanças no documento de arquitetura (`docs/ARCHITECTURE.md`).

### Rodando o esqueleto

```bash
npm ci
npm run dev
# abra http://localhost:3000
```

### Estado das dependências e do lint (28/10/2026)

Ambiente local validado: Node.js **22.13.1** e npm **10.9.2**.
As dependências diretas estão fixadas em versões exatas; o lockfile registra
a árvore reproduzível usada por `npm ci`.

| Dependência direta | Versão |
| --- | --- |
| next / eslint-config-next | 16.4.3 / 16.4.3 |
| react / react-dom | 18.2.0 / 18.2.0 |
| axios | 1.20.0 |
| eslint | 9.39.5 |
| typescript | 5.3.3 |
| @types/node | 20.11.20 |
| @types/react / @types/react-dom | 18.2.58 / 18.2.19 |

O Next.js 16 removeu `next lint`, e `eslint-config-next@16.4.3` exige
ESLint >=9. A migração usa `eslint .` e flat config em `eslint.config.mjs`,
preservando `core-web-vitals`, sem desativar regras. Os diretórios `.next`,
`out` e `build`, `next-env.d.ts` e arquivos `*.tsbuildinfo` gerados são ignorados.
Referência: [configuração oficial de ESLint do Next.js](https://nextjs.org/docs/app/api-reference/config/eslint).

O `tsconfig.json` preserva os ajustes feitos pelo Next.js 16: `jsx: react-jsx`
para o runtime automático de JSX, `target: ES2017` como alvo sugerido pelo
framework e `.next/dev/types/**/*.ts` para incluir os tipos de desenvolvimento.
Após mantê-los, lint, typecheck e build passaram; o segundo build desta
estabilização não alterou arquivos versionados.

O ESLint 9.39.5 é a versão estável mais recente da série 9 consultada no npm,
compatível com os peers instalados e o Node local. O registro já a marca como
sem suporte; a série 9 foi mantida por restrição desta etapa. React 18.2.0 foi
preservado: o Next 16 ainda o aceita, mas emite aviso de depreciação.

Verificações locais desta etapa:

```bash
npm ci
npm ls --depth=0
npm ls eslint --depth=1
npm run lint
npm run typecheck
npm run build
npm audit
```

Os resultados e limitações estão registrados em
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). O desafio funcional permanece
como trabalho a desenvolver; `npm test` ainda é um placeholder. O CI existente
usa Node 20 e audit em modo report-only; execução local não comprova CI remoto.
A avaliação automatizada pelo Codex não substitui a revisão humana, ainda pendente.

---

## O desafio

Construa uma pequena aplicação **full-stack** de **cadastro + consulta** com um
backend real e um banco de dados, tratando **segurança como requisito de
primeira classe**.

### Parte 1 — Backend + Banco de Dados (obrigatório)

1. **Formulário de cadastro** persistido em **banco de dados** (Postgres, MySQL,
   SQLite ou outro — sua escolha, justifique no `ARCHITECTURE.md`). Campos:
   - **Nome** (string, máx. 150)
   - **E-mail** (único, validado)
   - **Senha** (mín. 8, máx. 35, alfanumérica) — **nunca** armazenada em texto puro
   - **Confirmação de senha**
   - **Endereço**, **Cidade**, **Estado**, **País**, **CEP**
   - **Mensagem**
2. **API RESTful** (em `app/api`) com, no mínimo:
   - Criar um registro (`POST`)
   - Consultar registros (`GET`) — **sem jamais expor a senha ou o hash**,
     **protegido por autenticação** e respeitando a **autorização por papel**
     (ver Parte 2): usuário comum vê só o próprio registro; listagem completa só
     para `admin`.
3. **Validação** no servidor **e** no cliente, seguindo boas práticas.
4. **Schema versionado / migrations** (ex.: Prisma, Drizzle, Knex ou SQL puro) —
   subir o banco do zero deve ser **reproduzível** a partir do README.

### Parte 2 — Autenticação & Autorização (obrigatório — núcleo de segurança)

Esta é a parte onde mais queremos ver seu domínio de **segurança**. O cadastro
da Parte 1 cria usuários; aqui eles **autenticam** e acessam áreas protegidas.

**Núcleo obrigatório (o que esperamos pronto):** login + sessão + proteção de
rotas + **autorização por papel (role)** + logout.

5. **Login** com e-mail + senha, validando a senha contra o **hash** armazenado
   (nunca comparação em texto puro).
6. **Sessão autenticada** — sua escolha (cookie de sessão `httpOnly`+`Secure`,
   JWT, ou lib como Auth.js/Lucia) — **justifique no `ARCHITECTURE.md`**.
7. **Rotas/endpoints protegidos**: endpoints sensíveis e ao menos uma **página
   protegida** no frontend só devem funcionar com sessão válida; sem sessão →
   `401`/redirect para login.
8. **Autorização por papel (role)** — há dois papéis, `user` e `admin`, e a
   visibilidade dos registros depende do papel:
   - um **usuário comum** só pode ver/consultar **o próprio registro**;
   - a **listagem completa** (o `GET` da Parte 1) fica disponível **apenas para
     `admin`**.
   Uma requisição autenticada mas sem permissão deve retornar **`403`** (não
   `404`/`401`). Decida e **documente** como um usuário vira `admin` (seed,
   flag no banco, etc.).
9. **Logout** que invalida a sessão de forma efetiva.
10. Tratar, **e documentar**, os riscos clássicos de auth. No mínimo, decisões
    conscientes sobre:
    - Armazenamento seguro do token/sessão (por que cookie `httpOnly` vs.
      `localStorage`, etc.).
    - **CSRF** (se usar cookies) e **CORS**.
    - **Rate limiting / brute-force** no endpoint de login e mensagens de erro
      que **não vazam** se o e-mail existe (evitar *user enumeration*).
    - Expiração/renovação de sessão.
    - **Controle de acesso no servidor** (nunca confie só no frontend para
      esconder a listagem — a checagem de papel precisa estar na API).

**Diferenciais (plus — NÃO obrigatórios):** considerados um algo a mais, mas não
espere entregá-los em 3 dias à custa do núcleo acima:

- **Verificação de e-mail**.
- **Reset de senha**.
- Papéis adicionais ou permissões mais granulares além de `user`/`admin`.

> Você pode usar uma biblioteca de autenticação — e deve justificar a escolha.
> O que avaliamos é o **entendimento** das decisões de segurança, não reinventar
> cripto.

### Parte 3 — Frontend (obrigatório)

11. Tela de formulário com boa **experiência de uso**: feedback de erros,
    estados de carregamento, acessibilidade básica.
12. Fluxo de **login/logout** e uma **área protegida** que respeita o papel: um
    `user` vê apenas o próprio registro; um `admin` vê a listagem completa.
13. Tela de **sucesso** do cadastro contendo:
    - Confirmação do cadastro;
    - **Resumo** dos dados submetidos (**sem** exibir a senha);
    - A **previsão do tempo do dia seguinte** para a cidade informada, consumindo
      uma **API RESTful gratuita** (ex.: Open-Meteo) **a partir do client**.
      Não pode ser um *embed* — esperamos ao menos uma chamada REST feita no
      cliente.

### Parte 4 — Segurança / DevSecOps (obrigatório — é o foco da vaga)

Implemente **e documente** o que fizer. Não precisa estar tudo completo:
**priorize, entregue o que funciona e explique o resto**. Esperamos decisões
conscientes sobre, no mínimo:

- **Hashing de senha** (ex.: bcrypt/argon2) e política de senha.
- **Autenticação** (Parte 2): as decisões de sessão/token, CSRF, rate limiting
  no login e prevenção de *user enumeration*.
- **Validação e sanitização** de entrada; proteção contra **injeção**
  (SQL/NoSQL) e **XSS**.
- **Gestão de segredos**: `.env` nunca commitado; `.env.example` versionado
  (já incluímos um ponto de partida).
- **Rate limiting** e/ou proteção básica de abuso nos endpoints de cadastro
  **e de login** (brute-force).
- **Headers de segurança** (CSP, HSTS, X-Content-Type-Options, etc.).
- **Dependências**: `npm audit` limpo (ou findings justificados); versões
  pinadas. **Atenção:** o esqueleto já vem com dependências que possuem
  advisories conhecidas (ex.: dentro do Next 14). Avaliar isso faz **parte do
  desafio**: decida o que fazer (atualizar, substituir, aceitar com
  justificativa) e registre em `docs/ARCHITECTURE.md`. O CI inicial roda
  `npm audit` em modo **report-only** — torná-lo bloqueante é uma melhoria
  esperada.
- **Pipeline de CI** (GitHub Actions) rodando no mínimo: `lint`, `typecheck`,
  `build` e **um passo de segurança** à sua escolha (SAST/SCA/secret scan —
  ex.: CodeQL, `npm audit`, `gitleaks`, `trivy`). Incluímos um `ci.yml` inicial
  para você evoluir.
- **(Plus)** Containerização (`Dockerfile` + `docker compose` para app + banco).
- **(Plus)** IaC (Terraform/CloudFormation) para o que faria sentido provisionar.

### Parte 5 — Testes (obrigatório)

14. **Testes automatizados** cobrindo o que mais importa — não buscamos 100% de
    cobertura, e sim testes que demonstrem critério. No mínimo:
    - **Unitários** da validação e das regras de **autorização** (ex.: `user`
      não acessa registro de outro; só `admin` lista tudo).
    - Ao menos um teste da **API** (ex.: login válido/ inválido, acesso negado
      com `401`/`403`).
15. **Como rodar os testes** documentado no README e executado no **CI** (um
    passo `test` no workflow). Use o runner que preferir (Vitest, Jest,
    Playwright, etc.) e justifique brevemente a escolha.

### Parte 6 — Documentação (obrigatório)

16. **`docs/ARCHITECTURE.md`** — a arquitetura escolhida e **o porquê**: banco de
    dados, camadas, fluxo de dados, **modelo de autenticação/autorização** e
    trade-offs. ADRs curtos (Architecture Decision Records) são muito bem-vindos
    — há um template.
17. **`docs/AI_PROMPTS.md`** — o **log dos prompts de AI** que você usou: o
    prompt, a ferramenta, e um resumo do que você **aceitou, ajustou ou
    rejeitou** e por quê. Queremos ver seu uso **crítico** da AI.
18. Atualize este **README** (ou um `SOLUTION.md`) com instruções claras para
    rodar tudo localmente (app + banco + testes + CI) e as variáveis de ambiente
    necessárias.

---

## Uso de AI (importante)

- AI é **permitida e incentivada** — faz parte do nosso dia a dia na engenharia.
- **Registre os prompts** em [`docs/AI_PROMPTS.md`](docs/AI_PROMPTS.md).
- Você é responsável por **revisar criticamente** o que a AI gerou (segurança,
  correção, manutenibilidade). Conte onde a AI errou e como você corrigiu —
  isso conta **a favor**.

---

## O que será avaliado

| Área | O que olhamos |
| --- | --- |
| **Segurança / DevSecOps** | As decisões da Parte 4 e a justificativa delas |
| **Autenticação & autorização** | Login/sessão, proteção de rotas, **autorização por papel** (user vê só o seu; admin lista tudo), CSRF, brute-force, *user enumeration* (Parte 2) |
| **Testes** | Testes das regras de autorização/validação e da API; rodando no CI (Parte 5) |
| **Arquitetura & código** | Organização, clareza, manutenibilidade |
| **Banco de dados** | Modelagem, migrations, consultas seguras |
| **Automação** | CI funcional (lint, typecheck, build, testes, segurança) e reprodutibilidade |
| **Documentação** | `ARCHITECTURE.md`, ADRs, `AI_PROMPTS.md`, README |
| **Uso responsável de AI** | Critério, revisão e transparência |

Trade-offs bem explicados valem **mais** do que features pela metade sem
explicação. Em 3 dias, priorizar é parte da avaliação.

---

## Como entregar

Para que um candidato **não veja o trabalho de outro**, não trabalhe em um fork
deste repositório (forks ficam públicos e vinculados ao original). Em vez disso,
**clone** este repositório e publique o seu desafio em um **repositório público
novo e independente**, na sua conta:

```bash
# 1. Clone o desafio base (não faça fork)
git clone https://github.com/imobilead-app/interview-challenge.git
cd interview-challenge

# 2. Aponte o remoto para um repositório PÚBLICO novo criado na SUA conta
git remote remove origin
git remote add origin https://github.com/<SEU_USUARIO>/<SEU_REPO>.git

# 3. Desenvolva, faça commits pequenos e descritivos, e dê push
git push -u origin main
```

Depois:

1. Garanta que o **CI está verde** e que o README permite **rodar do zero**.
2. **Responda ao nosso e-mail** com:
   - o **link do seu repositório público**,
   - a **branch** onde está a entrega (se não for `main`).

> O repositório deve ser **público** para facilitar o review. Se preferir
> mantê-lo privado, avise no e-mail que daremos acesso de leitura ao time.

Boa sorte — e nos surpreenda! 🚀

---

<details>
<summary>Referência rápida do esqueleto Next.js</summary>

- `app` — rotas/páginas (App Router)
- `app/api` — rotas de API internas
- `components` — componentes de UI
- `services` — serviços externos/internos (cliente HTTP)

```bash
npm ci
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

</details>
