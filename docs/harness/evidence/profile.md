# PROFILE-001 — evidência, 30/10/2026

## PROFILE-001-L1 — aplicação persistente local autorizada

Pedido posterior autorizou exclusivamente migration aditiva, grants do perfil,
checagens correspondentes e reinício; sem apagar/recriar recursos, alterar
e-mail/senha/papel/registros existentes por DML do agente ou executar fixtures
no banco persistente. Supera somente a pendência de aplicação local abaixo.

Comandos canônicos de SOLUTION executados pelo agente, todos com saída0:

| Ordem | Comando | Resultado sanitizado |
| --- | --- | --- |
|1|npm run db:inspect|Antes:127.0.0.1:5432/imobilead, imobilead_migrate;9 objetos/6 da aplicação |
|2|npm run db:migrate|Mesmo destino/papel; applied:1 |
|3|npm run db:grant|Mesmo destino; administrador local; sem erro |
|4|npm run db:check|Mesmo destino; imobilead_app; contrato efetivo aprovado |
|5|npm run db:inspect|Depois:127.0.0.1:5432/imobilead;9 objetos/6 da aplicação |

Única migration pendente aplicada:1793404800000-profile-version.cjs. Acrescenta
users.profile_version integer NOT NULL DEFAULT1, CHECK users_profile_version_positive
(profile_version>0). Users passa a14 colunas, sessions mantém5; a migration
original e a FK ON DELETE CASCADE foram preservadas. Nenhum comando DROP,
TRUNCATE, provision/reset ou fixture foi executado contra esse destino.

Novo grant: UPDATE(name,address,city,state,country,postal_code,message,updated_at,
profile_version) em imobilead.users para imobilead_app. O comando canônico também
reaplica idempotentemente SELECT/INSERT por colunas de users e DML de sessions
já existentes. Checker aprovou direitos efetivos por coluna/PUBLIC e proibições:
sem UPDATE email/password_hash/role/id/created_at, sem INSERT role/profile_version,
sem DELETE/TRUNCATE/DDL users, grant option ou acesso ao histórico. Nenhum novo
papel, usuário, schema, tabela ou índice criado por essa migration.

Reinício: somente os dois processos Next deste checkout, identificados antes
da parada, foram encerrados; porta3000 liberada. npm run dev reiniciou o projeto
e ficou disponível em http://localhost:3000. Next acrescentou bloco automático
ao AGENTS.md na inicialização; restaurado exclusivamente esse acréscimo gerado,
pois o arquivo estava intacto antes do reinício. Nenhuma configuração alterada.

Login: usuário assumiu a entrada das credenciais no navegador. Servidor reiniciado
registrou múltiplos POST /api/auth/login200, GET /area200, GET /api/auth/session200,
GET /api/users200 (autorização administrativa) e GET próprio200; logout200 também
observado. Sem senha, cookie, token, UUID ou dados cadastrais registrados aqui.
Conector de navegador indisponível: nenhuma inspeção visual independente realizada.
Usuário confirmou: ambos funcionaram nos respectivos papéis, user em Minha área
e admin em Painel administrativo. Esse relato manual é separado dos códigos
HTTP observados pelo agente; não é inspeção visual independente do agente.
Não houve teste automatizado de edição nem UPDATE de cadastro pelo agente;
ações manuais feitas pelo próprio usuário no navegador não são atribuídas ao agente.

Sem erro nos comandos de banco ou nos logins observados/confirmados pelo usuário. Aviso preexistente de
React18 emitido no restart. Doctor/validate aprovados; suítes da implementação
abaixo não foram reexecutadas contra o persistente. Sem commit/push.

## Histórico da implementação inicial

Base main/5ff4fc5fad66453c2a7b95f811aad7ae394cb17a, árvore inicialmente limpa.
[Contrato](profile-plan.md), [decisão](../../ARCHITECTURE.md#profile-001--edição-própria-30102026),
[instruções](../../../SOLUTION.md#edição-do-próprio-perfil--profile-001).
Pedido autorizado: somente perfil; sem commit/push, exclusão ou containerização.
README, CI, lockfile, sessões, projeção GET users e guarda local preservados.
Migration/grants do banco persistente não executados.

## Implementação e revisão

Orquestrador escreveu API/validação/DB/testes Node/PG/documentação. Especialista
frontend escreveu Area/ProfileForm/messages/CSS e testes browser do perfil,
conforme ownership no contrato. Ambos aplicaram deliver-requirement e
verify-delivery. Revisão própria cruzada do orquestrador e revisão Backend
independente de leitura registrada abaixo; aprovação humana não presumida.

Versão integer positiva, precondição de identidade/versão, mapa fixo de UPDATE,
sessão/papel revalidados após lock, rollback/release e expiração após instrução.
Validação de texto comum ao cadastro; não se criaram limites por campo. UI integra
mutação à geração existente, atualiza valores frescos e não substitui rascunho
no polling. Sem segredo, dados existentes ou raw logs neste registro.

Revisão Backend independente somente leitura, skill review-security: nenhum
achado material de autorização, CSRF, concorrência ou ACL no escopo. Ressalva:
TTL vencendo após UPDATE tem regressão controlada, não espera equivalente real
no PostgreSQL; revogação durante espera por lock tem teste HTTP/PG real.

## Falhas intermediárias e hipóteses

1. Primeira integração52 testes:50 pass,2 fail (subteste de observação de lock e
   agregador), zero skips. Demais cenários de perfil passaram, incluindo corrida
   200/409 e falha de permissão sem alteração. Hipótese confirmável: observer
   transacional mantinha snapshot de pg_stat_activity; correção adiciona
   pg_stat_clear_snapshot antes de cada observação. Não flexibiliza lock da API.
2. Primeira UI31 testes:28 pass,3 fail (seletor global de alerta, cenário posterior
   afetado pelo editor deixado aberto, e agregador), zero skips. Correção do teste
   restringe alerta ao formulário, mantendo exigência de foco/acessibilidade.
3. Autorrevisão acrescentou conferência de TTL após UPDATE, com regressão
   controlada que exige rollback se a sessão expirar durante a instrução.
4. Segunda UI31:29 pass,2 fail (retorno de foco após salvar e agregador), zero
   skips. O RAF podia anteceder commit/habilitação do botão. Correção usa intenção
   em ref e layout effect após commit/editor fechado/busy=false, sem setState
   em lifecycle/flushSync. Terceira execução31/31 confirmou todos os cenários.
5. Primeira regressão de corridas56:54 pass,2 fail (fixture de contexto e pai),
   zero skips. Fixture trocava props.name mas deixava API com valor antigo; a
   nova área corretamente incorpora campos frescos. Ajustada exclusivamente a
   fixture descartável para avançar o registro após capturar a resposta antiga,
   antes de produzir a nova. Nenhuma assert de geração/ocultação foi removida;
   agora prova descarte de payload velho contra payload atualizado real.

Ambas primeiras execuções confirmaram cleanup0 e metadados/ACLs protegidos iguais.

## Verificações vigentes

| Verificação local executada pelo agente | Resultado |
| --- | --- |
| doctor e validate | Aprovados |
| npm test |61/61; zero falhas/skips; inclui launcher que prova11 casos servidor de perfil |
| Perfil+validação de cadastro, execução explícita inicial |26/26; servidor11, perfil5, cadastro10 |
| npm run test:db:integration |52/52; HTTP Next+PostgreSQL reais; zero falhas/skips |
| npm run test:profile:ui |31/31:9 cenários Chromium+21 verificações PG+agregador |
| npm run test:ui |49/49; regressão existente inclui cadastro/auth/admin/clima/teclado/autofill |
| node --test tests/ui/race.test.mjs |56/56;34 cenários React/transporte+21 PG+agregador |
| npm run lint e tsc --noEmit --incremental false | Aprovados |
| npm run build | Aprovado após correção final de foco; aviso React18 preexistente |
| npm audit --audit-level=high | Zero vulnerabilidades na consulta desta etapa |
| Harness verify --product | Aprovado;61 Node comprovados; parcial/readiness not-assessed |
| UTF-8 e links locais dos arquivos da entrega | Aprovados |
| git diff --check | Aprovado |
| CI remoto do diff / HTTPS produção / múltiplos navegadores / revisão humana | Não executados / pendentes |

Corrida HTTP/PG confirmou exatamente200/409 para duas escritas da mesma versão,
com incremento único e preservação de e-mail/hash/papel/created_at. Revogação
durante espera por lock confirmou401 sem escrita. UI demonstrou conflito com
draft preservado/recarga explícita, e-mail readonly, Unicode/cancelamento/mobile,
envio único, resposta antiga descartada, pagehide durante save, admin próprio
fora da página e logout efetivo. Asserts do teste antigo de contexto preservadas.

Todas execuções finais de banco/UI/corridas confirmaram zero recursos próprios
remanescentes e metadados/ACLs protegidos inalterados. Sem erro inesperado de
React/hidratação/pageerror; a suíte antiga reproduz um aviso de hidratação com
mutação externa deliberada, esperado e separado do comportamento limpo.

README byte a byte igual ao HEAD; workflow, lockfile e tsconfig sem diff de
conteúdo. Capturas existentes sem diff; nenhuma nova dependência ou imagem.
Nenhum arquivo previamente modificado existia na base; nenhum teste foi removido.
As únicas adaptações de testes existentes são a segunda migration, o contrato
de ACL agora restrito por colunas e a coerência da fixture de contexto com a API.

Nenhum SQL mutável no banco persistente; migrations/grants somente nas fixtures
locais com nomes/papéis aleatórios do runner existente. Destino/credenciais
validados internamente, sem leitura de valores pelo agente. Não há fallback
remoto, reset/truncate ou limpeza genérica por prefixo.
