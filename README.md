# Imobilead — Cadastro, autenticação e gestão de usuários

[![CI](https://github.com/ThiSlomski/interview-challenge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ThiSlomski/interview-challenge/actions/workflows/ci.yml) ![Next.js](https://img.shields.io/badge/Next.js-16.4.3-000000?logo=nextdotjs) ![React](https://img.shields.io/badge/React-18.2.0-149eca?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?logo=typescript&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)

Solução do **desafio técnico da Imobilead**, desenvolvida por **Thiago Slomski / Slomski Solutions**. Aplicação web com cadastro, sessão persistida em PostgreSQL, área protegida por papel, edição do próprio perfil e administração de usuários. Inclui previsão do tempo no navegador, testes automatizados, CI e execução com Docker Compose.

![Página inicial da solução em produção local](docs/images/overview.png)

[Desafio-base oficial](https://github.com/imobilead-app/interview-challenge) · [Capturas desktop e mobile](docs/harness/evidence/ui-captures/README.md) · [Decisões de arquitetura](docs/ARCHITECTURE.md)

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#️-arquitetura)
- [Tecnologias](#tecnologias)
- [Início rápido com Docker](#-início-rápido-com-docker)
- [Variáveis de ambiente](#️-variáveis-de-ambiente)
- [Execução local sem Docker](#️-execução-local-sem-docker)
- [Primeiro acesso](#primeiro-acesso)
- [Fluxos principais](#fluxos-principais)
- [API](#api)
- [Testes e qualidade](#-testes-e-qualidade)
- [Integração contínua](#-integração-contínua)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Documentação adicional](#-documentação-adicional)
- [Uso de inteligência artificial](#-uso-de-inteligência-artificial)
- [Solução de problemas](#️-solução-de-problemas)
- [Limitações e próximos passos](#️-limitações-e-próximos-passos)
- [Status da entrega](#status-da-entrega)
- [Autoria](#autoria)

## Visão geral

O visitante cria uma conta e recebe um resumo sem senha, acompanhado da previsão para o dia seguinte na cidade informada. O cadastro não autentica automaticamente: o próximo passo é entrar com e-mail e senha.

A sessão é validada no servidor e persistida no PostgreSQL. Em **Minha área**, um `user` consulta e edita apenas o próprio cadastro; um `admin` também acessa a listagem paginada e pode excluir contas comuns com confirmação. A exclusão encerra as sessões da conta removida. O logout revoga a sessão apresentada.

Migrations versionadas, credenciais separadas e verificação de privilégios preparam o banco. Testes Node, integração HTTP/PostgreSQL, testes de navegador e quatro jobs de CI verificam camadas distintas. **Docker Compose é o caminho recomendado para avaliação local.**

## Funcionalidades

| Usuário comum | Comportamento |
| --- | --- |
| Cadastro | Validação compartilhada entre cliente e servidor, e-mail único e confirmação de senha |
| Login e logout | Validação do hash, emissão de cookie HttpOnly e revogação persistida |
| Minha área | Consulta somente dos próprios dados e bloqueio sem sessão válida |
| Edição do perfil | Nome, endereço, cidade, estado, país, CEP e mensagem; controle de versão evita sobrescrita silenciosa |
| Clima após cadastro | Previsão de amanhã via REST Open-Meteo no navegador, com carregamento, falha e nova tentativa |
| Acessibilidade | Estados de erro, foco visível e interface para desktop e celular |

| Administrador | Comportamento |
| --- | --- |
| Painel administrativo | Disponível em `/area` conforme o papel autenticado |
| Listagem | Paginação por cursor e identificação da própria conta |
| Perfil próprio | Edição dos mesmos campos permitidos ao usuário comum |
| Exclusão | Somente contas `user`, após confirmação explícita; exclusão definitiva |
| Proteções | Autoexclusão e exclusão de outro administrador recusadas também na API |
| Sessões da conta excluída | Removidas na mesma transação por `ON DELETE CASCADE` |

No cadastro, **nome, e-mail, senha, confirmação de senha, cidade, estado e país são obrigatórios**. Endereço, CEP e mensagem são opcionais. Cadastro e edição usam schemas Zod compartilhados entre navegador e servidor; a edição também exige nome, cidade, estado e país não vazios e preserva campos omitidos no PATCH. E-mail, senha e papel não podem ser alterados pela edição.

### Segurança e DevSecOps

- **Senhas:** Argon2id, salt gerado pela biblioteca e política de 8 a 35 caracteres alfanuméricos. Senhas não são retornadas nem guardadas no resumo.
- **Sessões:** token aleatório de 32 bytes; somente seu digest SHA-256 fica no banco. Validade absoluta de 3.600 segundos, sem renovação automática.
- **Cookies:** `HttpOnly`, `SameSite=Lax`, `Path=/`, sem `Domain`. Em produção, `Secure` e prefixo `__Host-`; o Compose fornece HTTPS para esse modo.
- **Autorização:** papel consultado novamente no banco em cada requisição. Identidade e permissões enviadas pelo cliente não concedem acesso.
- **Origem e CSRF:** login, logout, edição e exclusão exigem origem exata e conferem metadados de navegação; não há CORS amplo. O cadastro público aceita `Origin` ausente, mas recusa origem divergente e contexto cross-site. Clientes de API devem enviar `Origin` compatível com `APP_ORIGIN` nos fluxos que o exigem.
- **Abuso e enumeração:** limites por processo em cadastro/login/escritas, mensagens uniformes de credenciais inválidas e verificação de hash fictício quando a conta não existe. Isso não garante tempo constante da requisição inteira.
- **Dados e XSS:** consultas parametrizadas, validação por lista de campos e renderização de texto pelo React. Campos do usuário não executam HTML.
- **Headers:** APIs sensíveis usam `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`. A CSP global limita `connect-src` à própria origem e aos dois hosts Open-Meteo; não é uma política completa de scripts nem inclui HSTS explícito.
- **Segredos e banco:** `.env.local` ignorado pelo Git; credenciais administrativas, de migrations e de runtime separadas. Privilégios efetivos conferidos, inclusive por coluna e via `PUBLIC`; autorização por registro permanece na aplicação.
- **Containers e CI:** runtime não root, filesystem somente leitura, capacidades removidas e `no-new-privileges`; banco sem porta publicada; auditoria bloqueante para dependências com severidades alta/crítica e smoke de containers no CI.

Os limites operacionais estão em [Limitações e próximos passos](#️-limitações-e-próximos-passos).

## 🏗️ Arquitetura

```mermaid
flowchart LR
    Browser["Navegador"] --> Gateway["Gateway HTTPS · Caddy"]
    Gateway --> App["Next.js · páginas e API"]
    App --> DB[("PostgreSQL")]
    Browser --> Weather["Open-Meteo · REST"]
    DB --> Init["db-init"]
    Init --> Migrate["migrations"]
    Migrate --> Grants["grants"]
    Grants --> Check["db:check"]
    Check --> Ready["Aplicação liberada"]
    Ready --> App
```

No Compose, o PostgreSQL fica saudável antes de `db-init`. O inicializador provisiona papéis/schemas se ausentes e executa **migrations → grants → db:check**. A aplicação inicia somente após sua conclusão com sucesso; o gateway aguarda a aplicação saudável.

Os serviços compartilham o namespace de rede de `db` para preservar a guarda de identidade **`127.0.0.1:5432/imobilead`**, inclusive no endereço observado pelo PostgreSQL. Por isso, a publicação HTTPS aparece no serviço `db` do Compose. **A porta 5432 não é publicada no host**, e o Compose não usa o PostgreSQL instalado na máquina.

O gateway expõe `https://localhost:3000` e encaminha ao Next.js na rede compartilhada. HTTPS local permite usar o cookie `Secure` exigido pelo runtime de produção. O Caddy gera uma autoridade certificadora local temporária; a confiança depende de ação consciente do avaliador no navegador.

`db-init` recebe credenciais administrativas e de migrations; `app` recebe apenas a credencial de runtime. O volume nomeado `postgres-data` persiste cadastros, sessões e histórico entre recriações. O certificado do gateway fica em memória temporária e pode mudar ao reiniciá-lo.

Sem Docker, os mesmos papéis e migrations são preparados manualmente no PostgreSQL local. Decisões completas em [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tecnologias

Dependências conferidas em `package.json` e `package-lock.json`; imagens fixadas por digest no `Dockerfile` e no Compose.

| Tecnologia | Versão / referência | Uso |
| --- | --- | --- |
| Node.js | 22.13.1 | Docker e CI; referência local |
| npm | 10.9.2 | Versão local documentada em `SOLUTION.md` |
| Next.js | 16.4.3 | App Router, páginas servidor e API; saída standalone |
| React / React DOM | 18.2.0 | Interface |
| TypeScript | 5.3.3 | Tipagem |
| PostgreSQL | 18.6 no Compose; imagem 18 na integração CI | Persistência relacional |
| Docker | Engine com containers Linux; Compose v2.20+ | Pré-requisito documentado; Engine sem versão fixa no projeto |
| Caddy | 2.10.2 Alpine | Gateway HTTPS local |
| `pg` / `node-pg-migrate` | 8.23.1 / 9.0.0 | Conexões e migrations |
| `@node-rs/argon2` | 2.2.2 | Hash e verificação de senha |
| Zod | 4.6.7 | Schemas estritos compartilhados de cadastro e edição; erros públicos sem detalhes internos |
| Node Test Runner | Integrado ao Node.js | Testes unitários, controlados e integração |
| Playwright | 1.64.1 | Testes de UI com Chromium |
| ESLint / eslint-config-next | 9.39.5 / 16.4.3 | Análise estática |
| npm audit | Integrado ao npm | Análise de dependências (SCA) |

## 🚀 Início rápido com Docker

### 1. Obter o projeto e conferir ferramentas

Instale Git, Docker Engine com containers Linux e Compose v2.20+; no Windows, use Docker Desktop em modo Linux. Para apenas subir a aplicação, não é necessário Node.js ou PostgreSQL no host.

```bash
git clone https://github.com/ThiSlomski/interview-challenge.git
cd interview-challenge
docker --version
docker compose version
```

### 2. Conferir a configuração

**Não há arquivo de ambiente Docker para copiar.** O [compose.yaml](compose.yaml) já define banco, papéis, senhas sintéticas locais, origem HTTPS e duração da sessão. Não depende de `.env.local` nem de `.env.compose`.

Nenhum valor precisa ser preenchido para a configuração padrão. Essas credenciais são públicas e exclusivas da avaliação local: não as reutilize em produção e nunca versione senhas reais. Alterar apenas uma senha no Compose não atualiza automaticamente os papéis de um volume já inicializado.

```bash
docker compose config --quiet
docker compose up --build
```

### 3. Aguardar e abrir a aplicação

O primeiro build pode levar alguns minutos. Em outro terminal, confira:

```bash
docker compose ps -a
docker compose logs --tail 50 db-init app gateway db
```

Espere `db`, `app` e `gateway` ficarem `healthy` e `db-init` encerrar com código `0`. Acesse **https://localhost:3000** usando exatamente `localhost`.

🔒 O aviso de certificado é esperado nesse ambiente local. Confirme que o endereço é o seu `localhost` e aceite explicitamente a exceção no navegador para avaliar a aplicação. O projeto não instala certificados no computador. A CA temporária pode mudar após reinício/recriação do gateway; detalhes de exportação opcional em [SOLUTION.md](SOLUTION.md#compose-local-de-produção--container-001).

### 4. Parar, retomar e preservar dados

| Ação | Comando | Dados |
| --- | --- | --- |
| Parar os serviços | `docker compose stop` | Preservados |
| Iniciar novamente e aguardar saúde | `docker compose up -d --wait --wait-timeout 120` | Preservados |
| Remover os serviços e a rede | `docker compose down` | Volume preservado |
| Recriar os serviços | `docker compose up -d --wait --wait-timeout 120` | Reutiliza o volume do mesmo projeto |

Use sempre a mesma pasta/nome de projeto Compose para reutilizar o mesmo volume.

### 5. Reset destrutivo, somente se desejado

⚠️ **O comando abaixo apaga os dados do volume deste projeto Compose**, incluindo usuários e sessões. Confira o projeto em `docker compose ps -a` antes de executá-lo.

```bash
docker compose down -v
docker compose up --build
```

Isso não é uma etapa necessária da instalação nem uma solução para falhas no PostgreSQL instalado no host.

## ⚙️ Variáveis de ambiente

### Ambiente local sem Docker

`.env.local` fica fora do Git para proteger credenciais. Se ainda não existir, crie-o a partir do único exemplo versionado, [.env.example](.env.example). Preserve arquivos locais já preenchidos.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Bash:

```bash
cp .env.example .env.local
```

Edite os valores somente no seu ambiente. Os exemplos são placeholders sintéticos; substitua `REPLACE_LOCALLY` e faça percent-encoding de caracteres reservados da senha nas URLs.

| Variável | Obrigatória | Utilizada por | Finalidade | Exemplo seguro |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Sim, aplicação e checagem | Runtime / `db:check` | Papel mínimo da aplicação | `postgresql://imobilead_app:REPLACE_LOCALLY@127.0.0.1:5432/imobilead` |
| `MIGRATION_DATABASE_URL` | Para migrations | `db:migrate` | Papel proprietário dos schemas | `postgresql://imobilead_migrate:REPLACE_LOCALLY@127.0.0.1:5432/imobilead` |
| `ADMIN_DATABASE_URL` | Para operações administrativas | Provisionamento, grants e promoção | Credencial administrativa local separada | `postgresql://postgres:REPLACE_LOCALLY@127.0.0.1:5432/imobilead` |
| `DB_TRUST_REMOVED` | Sim, ferramentas de banco | Scripts e fixtures | Confirma autenticação por senha, sem `trust` temporário | `false` no exemplo; `true` somente após conferir |
| `SESSION_TTL_SECONDS` | Sim, autenticação | Servidor | Validade absoluta obrigatória | `3600` |
| `APP_ORIGIN` | Sim, fluxos autenticados | Servidor | Origem pública exata, sem caminho ou barra final | `http://localhost:3000` |
| `TEST_ADMIN_DATABASE_URL` | Para integração/UI | Fixtures de teste | Administrador local para recursos descartáveis | `postgresql://postgres:REPLACE_LOCALLY@127.0.0.1:5432/imobilead` |
| `DB_DISPOSABLE_TEST_AUTHORIZED` | Para integração | Runner PostgreSQL | Libera criação e limpeza de fixtures | `false`; `true` apenas no ambiente de teste autorizado |

As duas últimas aparecem comentadas no exemplo. O runner cria bancos e papéis com nomes únicos; não deve exercitar cadastros persistentes. Use uma instância PostgreSQL dedicada à avaliação dos testes.

### Docker Compose

As URLs e a confirmação de autenticação já são fornecidas pelo Compose. `APP_ORIGIN` é `https://localhost:3000`; `SESSION_TTL_SECONDS` permanece `3600`.

| Variável opcional | Utilizada por | Finalidade | Exemplo seguro |
| --- | --- | --- | --- |
| `COMPOSE_HTTP_PORT` | Compose e smoke | Porta HTTPS publicada e origem correspondente | `3300` |
| `COMPOSE_PROJECT_NAME` | Compose e smoke/cleanup | Selecionar o projeto e seu volume | `ic-smoke-minha-avaliacao` para teste descartável |

Para trocar a porta, defina a variável **antes** dos comandos Compose. PowerShell:

```powershell
$env:COMPOSE_HTTP_PORT='3300'
```

Bash:

```bash
export COMPOSE_HTTP_PORT=3300
```

A URL passa a ser `https://localhost:3300`. O Open-Meteo, no uso implementado, **não exige chave nem variável de ambiente**: os endpoints são constantes em `shared/weather.mjs`.

## 🖥️ Execução local sem Docker

### 1. Instalar dependências e configurar o ambiente

Use Node.js **22.13.1**, npm **10.9.2** e PostgreSQL **18** iniciado localmente com autenticação por senha. Após clonar e entrar na pasta:

```bash
node --version
npm --version
npm ci
```

Crie `.env.local` conforme a seção anterior. Configure `ADMIN_DATABASE_URL`, `APP_ORIGIN=http://localhost:3000` e `SESSION_TTL_SECONDS=3600`. Defina `DB_TRUST_REMOVED=true` somente depois de confirmar a autenticação por senha. **Nunca aponte os comandos de preparação para banco de produção.** As guardas aceitam exclusivamente `127.0.0.1:5432/imobilead`.

### 2. Criar o banco novo

Em uma sessão administrativa local do PostgreSQL, conectada ao banco de manutenção, execute apenas se `imobilead` ainda não existir:

```sql
CREATE DATABASE imobilead;
```

O provisionador não cria o banco. Ele também não limpa objetos preexistentes para contornar colisões.

### 3. Provisionar os papéis e definir senhas

Com `ADMIN_DATABASE_URL` preenchida no arquivo local:

```bash
npm run db:provision
```

O comando cria `imobilead_migrate`, `imobilead_app` e os schemas do projeto. Abra `psql` com o administrador local (`psql` deve estar no PATH; ajuste `postgres` se necessário):

```bash
psql -X -W -h 127.0.0.1 -p 5432 -U postgres -d imobilead
```

Use os prompts protegidos, sem senhas literais em SQL:

```text
\password imobilead_migrate
\password imobilead_app
\q
```

Preencha `MIGRATION_DATABASE_URL` e `DATABASE_URL` em `.env.local` com as respectivas senhas. A aplicação deve usar `imobilead_app`, nunca o administrador.

### 4. Preparar e verificar o schema

Ordem obrigatória: **migrations → grants → db:check**.

```bash
npm run db:inspect
npm run db:migrate
npm run db:grant
npm run db:check
```

As três migrations criam usuários/sessões, acrescentam a versão do perfil e exigem nome/cidade/estado/país não vazios. A terceira recusa registros legados incompatíveis, sem reescrevê-los automaticamente. O histórico fica em `imobilead_meta`; migrations já aplicadas não são repetidas. O grant concede o contrato atual, incluindo edição das colunas permitidas e exclusão de usuários, sem permitir ao runtime alterar senha, e-mail ou papel. `db:check` verifica identidade e privilégios efetivos e falha se o contrato divergir.

Em banco do projeto **já provisionado**, não repita `db:provision`: aplique apenas migrations pendentes, grants e check nessa ordem, depois reinicie a aplicação.

### 5. Iniciar a aplicação

```bash
npm run dev
```

Abra **http://localhost:3000**. No desenvolvimento HTTP, o cookie é `imobilead_session`, sem `Secure`. Para avaliar o runtime de produção com HTTPS e cookie `__Host-imobilead_session`, prefira o Compose. `npm run build` e `npm start` existem, mas o modo de produção exige origem HTTPS e gateway compatível.

## Primeiro acesso

1. Clique em **Criar cadastro** ou abra `/cadastro`. Informe nome, e-mail, senha, confirmação, cidade, estado e país. Endereço, CEP e mensagem são opcionais. A senha aceita de 8 a 35 letras/números.
2. Confira a confirmação e o resumo sem senha. A cidade informada permite consultar o clima; falhas meteorológicas não desfazem o cadastro. Resumo e clima ficam em memória e são descartados ao sair/recarregar.
3. Acesse `/login` e entre com a conta criada. Não existem credenciais padrão nem login automático após cadastro.
4. Abra **Minha área** (`/area`). Use **Editar meu cadastro**, altere os campos permitidos e salve. E-mail, senha e papel não são editáveis. Em conflito entre abas, recarregue os dados antes de reenviar.
5. Para encerrar a sessão atual, use **Sair**.

### Obter o primeiro administrador

Não há seed automático. Crie uma conta comum e obtenha seu UUID legitimamente, por exemplo em `GET /api/profile` com a própria sessão. A promoção usa ferramenta administrativa separada, nunca endpoint público.

**Sem Docker:** com `ADMIN_DATABASE_URL` administrativa e `DB_TRUST_REMOVED=true` no arquivo local, substitua o marcador pelo UUID da conta escolhida:

```bash
npm run db:promote-admin -- UUID_DO_USUARIO_EXISTENTE
```

**No Compose:** a imagem `db-init` contém a mesma CLI e a credencial administrativa do banco isolado:

```bash
docker compose run --rm --no-deps db-init node scripts/database/admin-user-cli.mjs UUID_DO_USUARIO_EXISTENTE
```

Esse comando altera o papel da conta indicada; execute apenas no seu ambiente de avaliação e com autorização sobre essa conta. A CLI valida UUID, destino, identidade administrativa e exatamente um registro. Sucesso informa `ADMIN_USER_UPDATED: 1`, sem criar senha ou conta adicional.

Entre com a conta promovida e acesse `/area`: o **Painel administrativo** mostra listagem, própria conta identificada e paginação. Para avaliar exclusão, crie **uma segunda conta sintética descartável**, localize-a e confirme a remoção. Todas as sessões dessa conta são encerradas. A própria conta administrativa e outros administradores não podem ser excluídos.

## Fluxos principais

| Fluxo | Etapas |
| --- | --- |
| Cadastro | Formulário → validação → persistência → resumo sem senha → clima → login |
| Autenticação | Login → sessão no PostgreSQL → cookie seguro em produção HTTPS → área protegida → logout |
| Perfil | Carregamento → edição → validação → controle de versão → confirmação |
| Administração | Login admin → listagem → confirmação do alvo → exclusão → encerramento das sessões do alvo |

## API

Todas as rotas existem em `app/api`. A autenticação usa o cookie de sessão; o papel é decidido no servidor.

| Método | Endpoint | Autenticação | Papel | Finalidade |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1` | Não | Público | Mensagem de referência preservada do esqueleto |
| `POST` | `/api/users` | Não | Público | Cadastrar conta comum |
| `POST` | `/api/auth/login` | Não | Público | Validar credenciais e emitir cookie |
| `GET` | `/api/auth/session` | Sim | `user` / `admin` | Consultar identidade mínima e expiração |
| `POST` | `/api/auth/logout` | Cookie apresentado, se houver | Ambos; repetível sem sessão | Revogar sessão apresentada e apagar cookie |
| `GET` | `/api/users` | Sim | `admin` | Listar usuários com paginação por cursor |
| `GET` | `/api/users/[id]` | Sim | Próprio `user` / `admin` | Consultar registro autorizado |
| `GET` | `/api/profile` | Sim | `user` / `admin` | Ler perfil próprio, versão e ETag |
| `PATCH` | `/api/profile` | Sim | `user` / `admin` | Editar perfil próprio com `expectedVersion` e `If-Match` |
| `DELETE` | `/api/users/[id]` | Sim | `admin` | Excluir somente conta `user`, sem corpo |

Cadastro retorna `201`; exclusão confirmada retorna `204`. APIs protegidas retornam `401` sem sessão e `403` sem permissão. Conflitos de versão e tentativas de excluir administrador/si próprio retornam `409`. Falhas de configuração/infraestrutura nos fluxos protegidos retornam `503`; no cadastro, falha interna de hash/persistência retorna `500 REGISTRATION_FAILED`, e configuração de origem inválida retorna `503`. O login usa `401` genérico para credenciais inválidas. Contratos detalhados: [SOLUTION.md](SOLUTION.md).

## 🧪 Testes e qualidade

O Node Test Runner mantém os testes próximos dos módulos sem exigir outro runner. Playwright cobre o navegador; integração usa Next.js/HTTP e PostgreSQL reais em fixtures descartáveis.

| Verificação | Comando |
| --- | --- |
| Lint | `npm run lint` |
| TypeScript | `npm run typecheck` |
| Testes Node sem PostgreSQL real | `npm test` |
| Build de produção | `npm run build` |
| Auditoria completa | `npm audit` |
| Gate SCA equivalente ao CI | `npm audit --audit-level=high` |
| Integração PostgreSQL/HTTP | `npm run test:db:integration` |
| UI integrada | `npm run test:ui` |
| UI do perfil | `npm run test:profile:ui` |
| UI da exclusão | `npm run test:admin-delete:ui` |
| Clima unitário / UI | `npm run test:weather` / `npm run test:weather:ui` |
| Corridas de UI | `node --test tests/ui/race.test.mjs` |
| Harness | `node scripts/harness/harness.mjs doctor`, depois `node scripts/harness/harness.mjs validate` e `node scripts/harness/harness.mjs verify --product` |
| Smoke de containers | `node scripts/container/smoke.mjs` em projeto descartável preparado abaixo |

### Sequência recomendada

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
node scripts/harness/harness.mjs doctor
node scripts/harness/harness.mjs validate
node scripts/harness/harness.mjs verify --product
git diff --check
```

O Harness é uma verificação **parcial**: mantém `partial: true` e `readiness: not-assessed`. Não substitui integração, navegador, revisão humana ou comprovação de prontidão para produção.

Para integração/UI, configure `TEST_ADMIN_DATABASE_URL` em instância PostgreSQL local dedicada, confirme `DB_TRUST_REMOVED=true` e `DB_DISPOSABLE_TEST_AUTHORIZED=true`. O administrador precisa criar e remover bancos/papéis descartáveis. O runner verifica o destino, cria recursos únicos e confere a limpeza; não use dados reais como fixtures. Para UI, instale o Chromium correspondente ao Playwright:

```bash
npx playwright install chromium
npm run test:db:integration
npm run test:ui
npm run test:profile:ui
npm run test:admin-delete:ui
node --test tests/ui/race.test.mjs
```

Respostas meteorológicas nos testes de UI são interceptadas com dados sintéticos: esses testes não comprovam disponibilidade atual do Open-Meteo.

### Smoke isolado do Compose

Use nome **novo e exclusivo** com prefixo `ic-smoke-`. O smoke cria contas sintéticas, altera perfil, testa exclusão/logout e reinicia/recria serviços para conferir persistência. Não o execute no projeto com contas que deseja preservar.

PowerShell, com Node.js disponível no host:

```powershell
$env:COMPOSE_PROJECT_NAME='ic-smoke-minha-avaliacao'
$env:COMPOSE_HTTP_PORT='3300'
docker compose config --quiet
docker compose build
docker compose up -d --wait --wait-timeout 120
node scripts/container/smoke.mjs
# Limpeza destrutiva apenas do projeto descartável selecionado:
node scripts/container/cleanup.mjs
Remove-Item Env:COMPOSE_PROJECT_NAME
Remove-Item Env:COMPOSE_HTTP_PORT
```

Em Bash, use `export COMPOSE_PROJECT_NAME=ic-smoke-minha-avaliacao` e `export COMPOSE_HTTP_PORT=3300` antes dos comandos Docker/Node; ao terminar, `unset COMPOSE_PROJECT_NAME COMPOSE_HTTP_PORT`. Execute a limpeza também se o smoke falhar. O teste opcional `node --test tests/container/browser.test.mjs` usa Chromium e deve ocorrer antes da limpeza.

## 🔄 Integração contínua

O [workflow GitHub Actions](.github/workflows/ci.yml) executa em push, pull request e acionamento manual, com permissões de leitura e actions fixadas por SHA.

| Job | O que valida |
| --- | --- |
| **Quality** | `npm ci`, lint, typecheck, testes Node e build com Node.js 22.13.1 |
| **PostgreSQL integration** | Migrations, constraints, ACLs e fluxos HTTP em PostgreSQL 18 descartável; rede compartilhada preserva a guarda loopback |
| **Security (SCA)** | `npm audit --audit-level=high`, bloqueando vulnerabilidades altas/críticas |
| **container-smoke** | Configuração Compose, build, health checks, HTTP, persistência e controles dos containers; limpeza mesmo após falha |

O PostgreSQL do CI não é o banco persistente local. Suítes de UI/concorrência são verificações locais separadas dos jobs principais; o smoke HTTP de containers roda no CI. **Não há deploy automático nem publicação de imagem nesse workflow.**

## Estrutura do projeto

```text
.
├── app/                     # Páginas, layouts e endpoints em app/api
├── components/              # Formulários e componentes de interface
├── server/                  # Autenticação, autorização, dados e handlers
├── shared/                  # Validação e clima utilizáveis pelo navegador
├── database/
│   └── migrations/          # Schema versionado
├── scripts/                 # Banco, Harness e operação dos containers
├── tests/                   # Testes Node, HTTP/PG, UI e containers
├── docker/                  # Configuração do gateway HTTPS
├── docs/                    # Arquitetura, requisitos, prompts e evidências
├── .github/workflows/       # Pipeline de CI
├── compose.yaml             # Serviços e volume da avaliação local
├── Dockerfile               # Build multi-stage e imagens de runtime/init/gateway
└── .env.example             # Modelo para execução sem Docker
```

## 📚 Documentação adicional

| Documento | Conteúdo |
| --- | --- |
| [SOLUTION.md](SOLUTION.md) | Operação detalhada, contratos e histórico das etapas |
| [Arquitetura](docs/ARCHITECTURE.md) | Decisões, alternativas e limites técnicos |
| [Requisitos](docs/REQUIREMENTS.md) | Mapeamento do desafio e critérios de aceite |
| [AI_PROMPTS.md](docs/AI_PROMPTS.md) | Índice cronológico dos registros detalhados de prompts |
| [Registros de prompts](docs/prompts/) | Textos e decisões organizados por etapa/data |
| [Harness](docs/HARNESS.md) | Fluxo de trabalho e verificações assistidas |
| [Capturas](docs/harness/evidence/ui-captures/README.md) | Galeria desktop/mobile com dados sintéticos |
| [Evidências da interface](docs/harness/evidence/ui.md) | Resultados e limites das verificações de UI |
| [Perfil](docs/harness/evidence/profile.md) | Edição, concorrência e verificações |
| [Exclusão administrativa](docs/harness/evidence/admin-delete.md) | Autorização, transações e encerramento de sessões |
| [CI](docs/harness/evidence/ci.md) | Preparação e verificação do pipeline |
| [Auditoria final](docs/harness/evidence/final-delivery-audit.md) | Matriz atual, verificações desta rodada, limitações e checklist de entrega |
| [Containerização](docs/harness/evidence/containerization.md) | Segurança, testes e persistência do Compose |
| [Operação dos containers](SOLUTION.md#compose-local-de-produção--container-001) | HTTPS local, portas, logs, smoke e limpeza |

Registros de etapas preservam o contexto e as pendências da época; afirmações antigas sobre funcionalidades ainda não iniciadas devem ser lidas junto das etapas posteriores e do estado atual descrito aqui.

## 🤖 Uso de inteligência artificial

O desafio permite e incentiva IA. A solução foi desenvolvida com assistência de IA e revisão crítica das sugestões: decisões aceitas, ajustadas e rejeitadas estão documentadas, com justificativas e correções.

Os prompts estão organizados cronologicamente em [AI_PROMPTS.md](docs/AI_PROMPTS.md), que aponta para registros em `docs/prompts/`. Resultados foram submetidos a testes e revisão técnica; evidências distinguem verificações locais, CI remoto, autorrevisão e revisão humana pendente. Aprovação de testes não equivale a aprovação humana integral.

## 🛠️ Solução de problemas

| Problema | Diagnóstico e solução |
| --- | --- |
| Porta 3000 ocupada | Pare o servidor que você iniciou nessa porta ou, no Compose, defina `COMPOSE_HTTP_PORT=3300` antes de subir. Acesse `https://localhost:3300`. |
| PostgreSQL indisponível | Sem Docker, confira serviço iniciado, banco `imobilead`, autenticação por senha e destino `127.0.0.1:5432`. No Compose, confira saúde de `db` e logs; não troque a URL para banco do host. |
| Falha em `db:check` | Confira papéis, schema e sequência migrations → grants → check. Privilégios extras são recusados. O check apenas diagnostica; não execute reset nem conceda superuser ao runtime. |
| `db-init` recusou objetos existentes | Estado parcial de papéis/schemas é recusado. Consulte logs e revise a instalação; não remova objetos de banco persistente para forçar inicialização. |
| Aviso de certificado HTTPS | Confirme `https://localhost` e a porta do Compose. Aceite conscientemente a exceção local; uma nova CA após restart pode exigir nova confirmação. |
| Origem recusada | Use a mesma origem de `APP_ORIGIN`, sem trocar `localhost` por IP. Em produção, use HTTPS. Reinicie o servidor após ajustar a configuração. |
| `EPERM` no Windows durante `npm ci` | Binários podem estar em uso. Pare processos de desenvolvimento/teste deste checkout que você iniciou e tente novamente. Instalação isolada foi a alternativa usada na evidência de CI; não encerre processos alheios nem apague dependências às cegas. |
| Dados antigos no Docker | É a persistência esperada do volume. `docker compose down` preserva dados; mantenha o mesmo nome de projeto para reutilizá-los. |
| Consultar logs | `docker compose logs --tail 50 db-init app gateway db`; compartilhe somente trechos sanitizados. |
| Recomeçar o Compose do zero | Confira o projeto, aceite a perda dos dados e execute `docker compose down -v`, depois `docker compose up --build`. Não há reset destrutivo equivalente autorizado para banco local persistente. |

## 🗺️ Limitações e próximos passos

- **Rate limiting em memória:** local ao processo, reinicia com ele e não coordena réplicas. Produção pública exige controles compartilhados e no ingresso.
- **HTTPS de avaliação:** certificado local temporário e credenciais sintéticas do Compose; não constituem configuração para publicação pública.
- **Open-Meteo externo:** depende de rede e disponibilidade. A consulta envia localização/coordenadas ao provedor; falhas preservam o cadastro. Testes usam respostas sintéticas.
- **Sessão absoluta:** expira em uma hora, sem renovação automática. Novo login é necessário após expiração.
- **Segurança de conteúdo:** CSP cobre somente conexões; hardening adicional de headers e política de scripts permanece como evolução.
- **Stack:** React 18 e ESLint 9 foram mantidos com limitações de ciclo de suporte documentadas na arquitetura; atualizações futuras exigem nova validação.
- **Evoluções fora da entrega:** IaC, reset de senha, verificação de e-mail e permissões mais granulares que `user`/`admin` não estão implementados.
- **Publicação:** não há deploy público. O CI não provisiona infraestrutura nem publica a aplicação.

## Status da entrega

| Item | Estado |
| --- | --- |
| Núcleo obrigatório | Implementado: cadastro, login, sessão, proteção de página/API, autorização por papel, logout, clima, testes e documentação |
| Diferenciais entregues | Edição própria com controle de versão, exclusão administrativa protegida e Docker Compose com HTTPS local |
| Branch | `main` |
| CI remoto verificado | Quatro jobs verdes no último commit publicado da branch `main`. Consulte o badge e o histórico do workflow CI. |
| Revisão | Evidências técnicas disponíveis; revisão humana integral pendente |
| Deploy público | Não realizado |
| Evoluções futuras | Separadas da entrega atual na seção anterior |

O badge e o histórico do workflow refletem a validação remota mais recente da branch `main`.

## Autoria

**Thiago Slomski · Slomski Solutions**

Desafio técnico Imobilead · **2026**
