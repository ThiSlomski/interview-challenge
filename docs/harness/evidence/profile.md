# PROFILE-001 — evidência, 30/10/2026

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
