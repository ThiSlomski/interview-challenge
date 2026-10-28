# Arquitetura da solução

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
