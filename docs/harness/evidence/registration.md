# REG-001 — evidência, 29/10/2026

Estado vigente de comprimento: correção [REG-001-E1](#reg-001-e1--comprimento-de-e-mail-29102026)
ao final. Os resultados e a revisão da implementação inicial abaixo são históricos;
a omissão de limites não foi coberta por aquela revisão.

Base main, HEAD 835537da073c26c89ea546be73e41d1a41085472, árvore limpa.
Commit-base com CI aprovado conforme relato do usuário; não verificado remotamente.
[Plano e contrato anteriores à escrita](registration-plan.md),
[prompt integral](../../prompts/2026-10-29-registration.md),
[arquitetura e limitações](../../ARCHITECTURE.md#reg-001--cadastro-pela-api-29102026).
Orquestrador único escritor; revisão Backend independente somente leitura.
Não houve commit, push, publicação, acesso remoto a banco ou chamadas de clima.

## Implementação e aceite

POST /api/users com validação reutilizável browser-safe, Argon2id, INSERT
parametrizado, defaults de papel/id/datas, conflito de e-mail pela constraint
real, projeção somente id, erros e diagnóstico constantes. Sem emissão de sessão.
Origem configurada, sem confiar em Host/Forwarded; JSON, corpo 16 KiB, prazo 5s,
quota global 20/min e dois trabalhos simultâneos. Defaults/permissões/schema
existentes inalterados; nenhuma credencial foi lida em saída ou escrita em fixture.

## Comandos e resultados

| Verificação | Resultado observado |
| --- | --- |
| Git status/HEAD e doctor inicial | Árvore limpa em 835537d; doctor aprovado |
| npm install --save-exact @node-rs/argon2@2.2.2 | Sucesso, lock atualizado, audit zero |
| npm ci | Sucesso, 397 pacotes; zero vulnerabilidades; aviso ESLint 9 sem suporte |
| npm test final | 24 aprovações no relatório principal, zero falhas/skips/todo; inclui um launcher que exige os oito casos de servidor aprovados |
| npm run test:registration:server | Oito testes controlados aprovados, zero falhas/skips; parâmetros/hash verificável, SQL/allowlist, erros, origem/corpo/abuso/prazo |
| npm run test:db:integration | Três execuções aprovadas, cada qual 22 aprovações (21 subtestes + principal), zero falhas/skips/todo; repetidas após correção de e-mail e ajuste da ordem de verificação de fronteira da limpeza |
| npm run lint / npm run typecheck | Passaram na implementação; verificações finais também agregadas pelo Harness |
| npm run build | Duas execuções aprovadas; segunda após correção de e-mail; rota dinâmica /api/users presente; aviso React 18 depreciado |
| npm audit | Código 0, zero vulnerabilidades reportadas |
| validate / verify --product / diff --check finais | Aprovados; detalhes do agregador no fechamento abaixo |

Testes controlados: 16 configuração + 7 validação; launcher separado executa 8
casos de servidor com condição react-server. Os 24 casos do relatório principal
incluem o launcher; não representam 24+8 casos independentes sem sobreposição.
Mocks verificam parâmetros e falhas, sem pretender comprovar PostgreSQL.

HTTP real: Next dev com webpack, loopback/porta alocada, rota copiada sem alteração,
provider PostgreSQL exclusivo de fixture temporária, sem credenciais herdadas do
banco principal/admin/migrations. Seis subtestes HTTP, cobrindo criação e persistência
de todos os campos, normalização, papel user, hash verificável, ausência de sessão,
400/403/409/413/415/429/500, concorrência e dados maliciosos tratados como texto.
Falha real sanitizada por REVOKE INSERT(email) somente no descartável e restauração
em finally. Restantes 15 subtestes de permissões DB-001 preservados, além das
asserções de migrations/constraints/sessões já existentes no caso principal.

PostgreSQL real: usa o runner autorizado com TEST_ADMIN_DATABASE_URL local,
DB_TRUST_REMOVED e DB_DISPOSABLE_TEST_AUTHORIZED exigidos. Cada execução criou
seu banco/papéis com sufixo aleatório de 12 hex, usando grants equivalentes ao
runtime. Nunca caiu em imobilead como fallback de teste mutável. Nenhum INSERT,
DELETE, GRANT ou limpeza foi dirigido ao banco principal. Consultas nesse banco
leram somente catálogos, sem linhas pessoais. Identidade/guardas do provider
real não foram exercitadas por HTTP no banco principal: continuam cobertas pelos
testes de configuração e evidência DB-001; runtime não foi flexibilizado.

As três execuções emitiram `cleanup:confirmed`, `protectedMetadata:unchanged`,
`remainingResources:0`. Catálogo consultado depois de DROP confirmou ausência
dos nomes exatos criados; schemas/relações/ACLs e atributos dos papéis fixos do
banco principal iguais ao snapshot anterior. Não é comparação de dados pessoais,
que não foram lidos. Processo Next, junction e diretório próprios removidos no
finally; dependências originais preservadas. Sem limpeza por prefixo.

## Falhas intermediárias, correções e revisão independente

1. argon2@0.45.1: instalação falhou exigindo node-gyp/Python indisponível. Nenhum
   compilador instalado. Dependência final @node-rs/argon2@2.2.2, hash real e npm ci
   passaram; manifest/lock não incluem o pacote argon2 descartado.
2. TypeScript inferiu callback diagnóstico sem parâmetros no JS; callback tipado
   na rota era incompatível. Rota passou a registrar somente código constante;
   lint/typecheck/build passaram sem afrouxar regras.
3. Launcher de testes detectou execução vazia apesar de código zero: processo filho
   herdava NODE_TEST_CONTEXT e Node recusava runner recursivo. Removida somente essa
   variável no filho. Resumo exige 8 testes/8 passes/zero falhas, skips, cancelados ou
   todo. Execução explícita e launcher posteriores aprovados; ausência não foi aceita.
4. Primeiro validate documental identificou dois links para evidência ainda não
   criada. Arquivo consolidado nesta etapa, validação repetida no fechamento.
5. Backend `registration_review`, skill review-security, exclusivamente leitura,
   inspecionou módulos, testes, provider, arquitetura, plano e contrato. Identificou
   dois P2: e-mails com pontos/hífens inválidos aceitos e Kelvin Unicode convertido
   antes da checagem ASCII. Corrigidos com ASCII original + dot-atom/labels DNS,
   regressões e novo HTTP/PostgreSQL real aprovados. Seguimento delimitado confirmou
   resolução e nenhum achado pendente no escopo. Hipótese preliminar sobre anchor $
   foi reproduzida, não se confirmou e foi retirada; não gerou alteração artificial.

Revisão independente não executou HTTP/banco. Orquestrador consolidou documentos
após os retornos e fez autorrevisão do diff/documentação/launcher. Revisão humana
permanece pendente; não se afirma segurança exaustiva ou entrega full-stack.

## Limitações e próximo passo

Quota global é local ao processo, permite esgotamento compartilhado, reinicia com
o processo e não coordena instâncias. Sem anti-bot/limites de conexão no gateway.
409 permite inferência de cadastro; login futuro deve ter erro uniforme. Sem
verificação de posse de e-mail; sintaxe ASCII limitada documentada. Campos
opcionais/ausência de mínimo de nome preservam DB-001. Textos HTML deverão ser
renderizados com escape pelo cliente futuro. HTTP real usou dev, não servidor
de produção; build de produção separado não comprova sua configuração operacional.
Integração PostgreSQL não foi incorporada nem executada no CI. CI do novo diff
não executado; aprovação do commit-base é relato do usuário. Login/sessão, cookies,
consulta autorizada, logout, UI e clima seguem pendentes e fora desta rodada.
Próximo passo sugerido: login/sessão conforme contrato existente, mediante autorização.

## Fechamento das verificações

validate aprovado, sem links quebrados. verify --product aprovado: validate,
testes Harness, native-probe, lint, typecheck sem saída gerada e produto, com prova
estruturada de 24 testes/24 passes/zero falhas/skips/todo. Agregador explicitamente
partial=true e readiness=not-assessed; não inclui build, integração PostgreSQL ou
CI remoto, executados separadamente quando indicado acima. git diff --check passou
após remover linhas vazias novas no EOF de AI_PROMPTS/handoff; advertências CRLF
locais não foram tratadas como erro funcional. tsconfig.json permaneceu inalterado.

Diff exclusivo: C:\Users\thiag\AppData\Local\Temp\reg-001-registration.diff.
Base inicial limpa; patch inclui todos os arquivos novos e modificados desta rodada,
somente fonte/configuração de exemplo/documentos/testes, sem .env.local, segredos,
node_modules, .next, tsbuildinfo ou logs. Não altera index/commits. Lista final de
arquivos e validação do patch conferidas no fechamento da execução.

## REG-001-E1 — comprimento de e-mail, 29/10/2026

Pedido: corrigir comprimento em aderência a README 1 (e-mail único e validado).
Base HEAD 835537d, árvore já com 23 arquivos REG-001 modificados/novos; preservados
em snapshot C:\Users\thiag\AppData\Local\Temp\reg-001-email-baseline-qBGVMW.
Essa correção não inclui a implementação REG-001 anterior no seu diff exclusivo.
Plano/aceite registrados antes da edição em registration-plan.md, seção E1.

Reprodução ANTES da correção, função real validateRegistration, sem DB/HTTP:

| Expressão do pedido | Resultado observado | Comprimento inválido |
| --- | --- | --- |
| 'a@' + 'b'.repeat(64) + '.test' | ok:true | label DNS de 64 bytes |
| 'a'.repeat(65) + '@example.test' | ok:true | local de 65 bytes |

Erro encontrado: ausência de limites SMTP/DNS no validador permitia cadastro de
endereços fora desses limites. Os testes e revisão anteriores verificavam sintaxe,
normalização e casefold, mas não detectaram/cobriram esse problema. A afirmação
anterior de ausência de limite era descrição histórica da implementação incompleta,
não justificativa para aceitar e-mails inválidos. Não foi demonstrado uso malicioso
ou linha pessoal afetada; a reprodução leu apenas fixtures da função pura.

Correção mínima: mantém ASCII antes de aceitar, lowercase/btrim ASCII, sintaxe
suportada e mesmo erro de campo INVALID_EMAIL. Local <=64 bytes, labels <=63,
endereço normalizado <=254. Após ASCII, caracteres, unidades JS e bytes coincidem;
sem Buffer/Node/DB/segredos no módulo compartilhado. Erro HTTP 400/INVALID_INPUT
contém apenas fields.email=INVALID_EMAIL, sem a entrada. Não acrescenta DNS,
envio ou prova de posse; constraints, migrations, grants, dependências, Harness
ou CI não foram alterados nesta correção.

Referências oficiais conferidas nesta execução:

- [RFC 5321 §4.5.3.1.1–3](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1):
  local-part de até 64 octetos; caminho SMTP até 256 incluindo pontuação. A aplicação
  adota mailbox normalizada até 254, reservando os dois bytes de `<` e `>`.
- [RFC 1035 §2.3.4](https://www.rfc-editor.org/rfc/rfc1035#section-2.3.4): labels de
  até 63 octetos. Nenhuma consulta DNS é necessária para validar comprimento.

Regressões controladas: fixtures isolam local 64/65, label 63/64 e total 254/255;
no caso total, local e todos os labels permanecem válidos. Testes também verificam
normalização nas fronteiras e erro sem entrada. Casos anteriores de Unicode,
sintaxe, senha/confirmação, hash e abuso preservados.

HTTP/PG real: cenário adicional em segunda instância Next dev, provider descartável
existente, mesma autorização/guardas/grants mínimos. Três POST inválidos exigem
400/INVALID_INPUT/INVALID_EMAIL e contagem total inalterada mais zero linhas por
e-mail. Três POST válidos exigem 201 e persistência canônica com papel user. Os
seis pedidos têm orçamento próprio da nova instância; não alteramos quota, relógio
ou regra de produção. Cenários anteriores, inclusive prova de 429, permanecem.
Processos/diretórios, banco e papéis exclusivos devem ser limpos pelo runner;
metadados/ACLs de imobilead comparados antes/depois sem ler linhas pessoais.

Resultados e fechamento registrados abaixo. Autorrevisão sequencial de escopo
pequeno, sem nova revisão independente;
revisão humana pendente. Próxima etapa login/sessão não iniciada. Sem commit/push
ou publicação; os demais itens do desafio permanecem pendentes como em REG-001.

### Resultados da execução E1

| Comando / escopo | Resultado atual |
| --- | --- |
| Reprodução pura anterior à edição | Ambos os exemplos retornavam ok:true; confirmado antes de mudar código |
| npm test | 27 aprovações no relatório principal, zero falhas/skips/todo; 16 configuração + 10 validação + launcher dos oito casos de servidor |
| npm run test:registration:server | 8/8 controlados aprovados, zero falhas/skips/todo |
| npm run test:db:integration | Uma execução nesta correção; 24 aprovações (23 subtestes + principal), zero falhas/skips/todo; inclui 8 subtestes HTTP reais |
| npm run lint / npm run typecheck / npm run build | Todos código 0; build com aviso React 18 depreciado já conhecido; tsconfig.json sem mudança |
| doctor / validate | Aprovados |
| verify --product / diff --check | Aprovados; agregador com prova estruturada de 27/27, zero falhas/skips/todo |

Runner confirmou cleanup:confirmed, protectedMetadata:unchanged e
remainingResources:0 após a execução E1. Processo/diretório de cada fixture
removidos; banco/papéis próprios removidos e ausência confirmada pelos nomes exatos
no catálogo. Nenhuma inserção/limpeza/grant em imobilead. Nenhuma falha intermediária
nova observada. Não contamos código zero isolado ou casos ignorados como aprovação.

Não executados nesta correção: audit (dependências e lockfile preservados), CI
remoto, HTTP em servidor de produção e revisão independente adicional. O Harness
é parcial e não avalia prontidão full-stack. Login/sessão será a próxima etapa,
mas não foi iniciado; autorização, GET protegido, logout, telas e clima pendentes.

Fechamento: verify --product aprovou validate, testes Harness, probe nativo, lint,
typecheck e 27 testes de produto por eventos estruturados. partial=true,
readiness=not-assessed; build e HTTP/PG foram executados separadamente. Não foram
alterados tsconfig.json, arquivos de dependências, migrations, grants, runtime,
Harness ou CI. Arquivos anteriores fora da lista E1 permanecem idênticos ao snapshot.

Arquivos E1: shared/registration.mjs; tests/registration/validation.test.mjs;
tests/registration/http-postgres.mjs; novo tests/registration/email-length-fixtures.mjs;
SOLUTION.md; docs/ARCHITECTURE.md; docs/AI_PROMPTS.md; docs/REQUIREMENTS.md;
docs/harness/evidence/registration-plan.md; docs/harness/evidence/registration.md;
docs/harness/memory/project-state.md; docs/harness/memory/handoff.md.

Diff exclusivo E1: C:\Users\thiag\AppData\Local\Temp\reg-001-email-length.diff.
Gerado contra cópias prévias dos arquivos pendentes, incluindo a nova fixture,
sem modificar index/Git ou incorporar a implementação REG-001 anterior.
Allowlist explícita de arquivos e checagem reversa de aplicação verificam que o
patch corresponde ao estado atual; sem segredos, logs ou artefatos gerados.
