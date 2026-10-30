# ADMIN-DELETE-001 — contrato, 30/10/2026

Base main/0dfc215417f6bfb9ded9d668e90034f1d053c538, árvore limpa. Perfil publicado
em origin/main no mesmo SHA. CI remoto41016344730 concluído success, confirmado
por API GitHub pública antes da escrita. Pedido integral será preservado em
docs/prompts/2026-10-30-admin-delete.md. README original não será alterado.

## Objetivo, fronteiras e aceite

DELETE /api/users/[id] somente admin com sessão válida;401 sem sessão,403 não
admin antes de qualquer consulta/validação do alvo,400 UUID inválido após authz.
409 SELF_DELETE_FORBIDDEN/ADMIN_DELETE_FORBIDDEN,404 USER_NOT_FOUND,
204 sem corpo somente após COMMIT de exatamente um alvo role=user. Erros503
sanitizados, origem/Fetch Metadata/no-store/limites/prazo/orçamento locais.
Corpo não escolhe identidade/papel e não é aceito; query desconhecida recusada.
Cliente transacional único; locks determinísticos de users por UUID ascendente,
revalidação de ator/alvo e sessão dentro da transação; lock de sessão impede
logout concorrente à efetivação. TTL revalidado após DELETE. Cascade existente
remove sessões atomicamente; nenhum DELETE manual de sessions, nenhum schema novo.

GET admin/listagem acrescentará somente role user/admin à projeção pública,
necessário para esconder ação de todas as contas admin. GET próprio e perfil
mantêm projeção anterior. Política do endpoint continua autoridade exclusiva.
Runtime users ganha DELETE sem grant option; sessions perde DELETE direto;
grants de SELECT/INSERT/UPDATE por coluna, proibições DDL/TRUNCATE/credenciais/
papel/identidade/histórico permanecem. Mudança somente no mecanismo canônico de
grants/checker; não criar migration artificial. Não aplicar grants no persistente.

Login concorrente à exclusão deve falhar de modo genérico caso FK recuse INSERT
de sessão após exclusão; nenhuma sessão utilizável órfã. Essa alteração pontual
de auth integra o escopo e deve preservar mensagens, hash e demais proteções.

UI: confirmação com nome/e-mail, sessões encerradas, Cancelar inicialmente focado,
Escape, teclado/desktop/mobile e retorno de foco. Pending sem duplicação; não
remover antes204. Após204/404 refetch da página e nextCursor; vazio retorna à
primeira. Resultado desconhecido de rede/timeout exige refetch sem afirmar falha
definitiva. Gerações invalidam polling/respostas antigas, logout/identidade/
histórico/TTL/gate protegidos. Perfil já entregue continua funcional.

## Responsabilidades / ganho concreto / limites

Orquestrador: server/users (handler/repository/policy novos de exclusão), rotas,
server/auth/handler.mjs, DB grants/checker, testes Node/ACL, integração agregador,
package scripts e docs/evidência/memória/diff. Frontend: Area.tsx, novo dialog,
Record.tsx (somente role opcional), CSS/messages e novo tests/admin-delete/browser.mjs.
Especialista Backend de testes: tests/admin-delete/http-postgres.mjs e extensão
dos testes existentes de projeção em tests/authorization/http-postgres.mjs e
tests/authorization/server.test.mjs. Nenhum outro escritor nesses arquivos.
Todos podem ler fontes mínimas; nenhum especialista usa banco persistente,
grants reais, commit/push ou remotos mutáveis. Sem reverter alterações alheias.

Ganho: UI com acessibilidade/gerações e provas de concorrência HTTP podem ser
produzidas em paralelo à transação/ACL, sem sobreposição de arquivos. Contexto
herdado; máximo dois especialistas simultâneos. Uma implementação e até duas
correções por nova hipótese; revisão delimitada, sem ciclos ilimitados. Revisão
Backend independente somente leitura depois das implementações, se reutilizável.

Verificações: Node/authz/sessões, HTTP/PG real descartável, corridas (delete mesmo
alvo, promoção, revogação/logout aguardando lock, login alvo), UI específica,
perfil UI, UI completa e races existentes; lint/tipos/build/audit/Harness/UTF-8/
links/diff. Zero skips inesperados; limpeza confirmada e metadados protegidos
iguais. Capturas oficiais preservadas por hash; novas capturas só administrativas
se necessárias. Diff exclusivo versus HEAD limpo, fora do repo se grande.

Não apagar/alterar qualquer cadastro persistente, não executar fixture no
persistente. Revisão manual futura requer usuário sintético exclusivo criado
pelo usuário e autorização explícita antes de excluir. Sem implantação, mudança
de papéis, soft delete, restauração, auditoria persistente ou lote. Revisão humana
e CI remoto do novo diff pendentes; sem commit/push/publicação.
