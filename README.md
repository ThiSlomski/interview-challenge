# Imobilead — Desafio Técnico: Engenheiro(a) de Software (DevSecOps)

> **Nível:** Pleno ou Sênior · **Stack base:** Next.js (App Router) + TypeScript
> **Prazo:** 2 dias · **Uso de AI:** permitido e incentivado (com registro — ver abaixo)

Bem-vindo(a)! Este desafio avalia você como **engenheiro(a) de software** com
forte atuação em **DevOps e Segurança (DevSecOps)**. Mais do que "fazer
funcionar", queremos ver **como você pensa**: arquitetura, segurança, automação,
qualidade e as decisões (trade-offs) por trás de cada escolha.

Você tem **2 dias** e pode — deve — usar ferramentas de AI. O que nos interessa
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

Um esqueleto **Next.js 14 (App Router)** com TypeScript:

- `app/` — páginas e layout
- `app/api/` — rotas de API internas (seu backend)
- `components/` — componentes de UI
- `services/` — cliente HTTP (axios) e serviços

Você pode reestruturar o projeto como achar melhor — só **justifique** as
mudanças no documento de arquitetura (`docs/ARCHITECTURE.md`).

### Rodando o esqueleto

```bash
npm install
npm run dev
# abra http://localhost:3000
```

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
   - Listar/consultar registros (`GET`) — **sem jamais expor a senha ou o hash**
3. **Validação** no servidor **e** no cliente, seguindo boas práticas.
4. **Schema versionado / migrations** (ex.: Prisma, Drizzle, Knex ou SQL puro) —
   subir o banco do zero deve ser **reproduzível** a partir do README.

### Parte 2 — Frontend (obrigatório)

5. Tela de formulário com boa **experiência de uso**: feedback de erros, estados
   de carregamento, acessibilidade básica.
6. Tela de **sucesso** contendo:
   - Confirmação do cadastro;
   - **Resumo** dos dados submetidos (**sem** exibir a senha);
   - A **previsão do tempo do dia seguinte** para a cidade informada, consumindo
     uma **API RESTful gratuita** (ex.: Open-Meteo) **a partir do client**.
     Não pode ser um *embed* — esperamos ao menos uma chamada REST feita no
     cliente.

### Parte 3 — Segurança / DevSecOps (obrigatório — é o foco da vaga)

Implemente **e documente** o que fizer. Não precisa estar tudo completo:
**priorize, entregue o que funciona e explique o resto**. Esperamos decisões
conscientes sobre, no mínimo:

- **Hashing de senha** (ex.: bcrypt/argon2) e política de senha.
- **Validação e sanitização** de entrada; proteção contra **injeção**
  (SQL/NoSQL) e **XSS**.
- **Gestão de segredos**: `.env` nunca commitado; `.env.example` versionado
  (já incluímos um ponto de partida).
- **Rate limiting** e/ou proteção básica de abuso no endpoint de cadastro.
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

### Parte 4 — Documentação (obrigatório)

7. **`docs/ARCHITECTURE.md`** — a arquitetura escolhida e **o porquê**: banco de
   dados, camadas, fluxo de dados, decisões de segurança e trade-offs. ADRs
   curtos (Architecture Decision Records) são muito bem-vindos — há um template.
8. **`docs/AI_PROMPTS.md`** — o **log dos prompts de AI** que você usou: o
   prompt, a ferramenta, e um resumo do que você **aceitou, ajustou ou
   rejeitou** e por quê. Queremos ver seu uso **crítico** da AI.
9. Atualize este **README** (ou um `SOLUTION.md`) com instruções claras para
   rodar tudo localmente (app + banco + CI) e as variáveis de ambiente
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
| **Segurança / DevSecOps** | As decisões da Parte 3 e a justificativa delas |
| **Arquitetura & código** | Organização, clareza, testes, manutenibilidade |
| **Banco de dados** | Modelagem, migrations, consultas seguras |
| **Automação** | CI funcional e reprodutibilidade (rodar do zero) |
| **Documentação** | `ARCHITECTURE.md`, ADRs, `AI_PROMPTS.md`, README |
| **Uso responsável de AI** | Critério, revisão e transparência |

Trade-offs bem explicados valem **mais** do que features pela metade sem
explicação. Em 2 dias, priorizar é parte da avaliação.

---

## Como entregar

1. Faça **fork** da branch `main` **antes** de começar.
2. Desenvolva no seu fork (commits pequenos e descritivos ajudam a avaliação).
3. Garanta que o **CI está verde** e que o README permite **rodar do zero**.
4. **Responda ao nosso e-mail** com:
   - o **link do fork**,
   - a **branch** do desafio,
   - **permissão de leitura** para o nosso time.

Boa sorte — e nos surpreenda! 🚀

---

<details>
<summary>Referência rápida do esqueleto Next.js</summary>

- `app` — rotas/páginas (App Router)
- `app/api` — rotas de API internas
- `components` — componentes de UI
- `services` — serviços externos/internos (cliente HTTP)

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

</details>
