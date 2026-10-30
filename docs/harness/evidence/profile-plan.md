# PROFILE-001 — contrato autorizado, 30/10/2026

Base: main/5ff4fc5, árvore inicialmente limpa. Pedido atual autoriza implementar
somente edição própria; não autoriza commit/push, exclusão ou containerização.
README permanece byte a byte. Evolução futura em dois commits funcionais:
`feat(profile): permite editar dados do próprio cadastro` e
`feat(admin): permite excluir usuários comuns com segurança` (nenhum criado).

Escopo futuro de exclusão: somente alvo user; admin e autoexclusão proibidos;
ator/alvo bloqueados e revalidados na transação. Sem contagem de administradores,
trava consultiva global ou coordenação com futuros rebaixamentos. Não iniciado.

## Contrato de perfil

GET/PATCH /api/profile, sessão central e papel user/admin fresco no servidor.
GET retorna {user,profileVersion}; user mantém a projeção pública existente.
PATCH recebe expectedVersion (integer positivo) e pelo menos um dos campos
name/address/city/state/country/postalCode/message; ausente preserva valor.
Reutilizar validação do cadastro, sem novos limites por campo. E-mail imutável;
senha, papel, identidade e datas não são entradas editáveis.
Versão PostgreSQL integer NOT NULL DEFAULT 1, positiva, JSON número.
GET/PATCH retornam ETag `"profile:<uuid>:<versão>"`. PATCH exige If-Match igual
ao recurso da sessão e expectedVersion; é precondição, nunca autorização.
Isso também impede um formulário antigo de editar outra identidade após troca
do cookie. Sem precondição:428; inválida:400; desatualizada:409; sessão:401;
origem/papel:403; corpo:400/408/413/415; abuso:429; infraestrutura:503.
Transação em cliente único: bloquear usuário, revalidar sessão com lock compatível
com revogação, verificar versão, atualizar colunas fixas e versão atomicamente.
Resposta só depois de commit; rollback/release em falhas. Sem renovar sessão.
Revalidar contexto cliente e descartar respostas antigas antes de revelar dados.

## Responsabilidades e ganho de delegação

Orquestrador: shared/registration.mjs, shared/profile.mjs, server/profile/*,
app/api/profile/route.ts, migration, ACL/grants, testes Node/HTTP/PG, scripts de
testes e documentação. Frontend: Area.tsx, ProfileForm.tsx, messages.ts, CSS,
testes de UI de perfil em tests/profile/browser.mjs. Um escritor por arquivo.
Não alterar Record.tsx, server/ui/area.ts nem testes UI existentes sem coordenação.
Ganho: implementar e revisar ciclo assíncrono/UI enquanto orquestrador implementa
transação/ACL e testes de servidor, reduzindo sobreposição de arquivos.
Contexto herdado; no máximo um especialista nesta etapa. Prazo operacional:
uma implementação e até duas correções por hipótese nova, sem revisões ilimitadas.
Evidência: profile.md, separando Node, PG/HTTP, UI, CI e revisão humana.
Aceite: testes de validação compartilhada, mass assignment, identidade/sessão,
CSRF, conflito concorrente real, ACL mínima, atualização visível, draft preservado
no polling, logout/expiração/aba antiga e regressão das suítes existentes.
Testes mutáveis somente em fixtures locais descartáveis existentes, com cleanup
confirmado e metadados protegidos preservados. Não migrar/grantar imobilead.

Revisão Backend adicional, somente leitura: server/profile/*, shared/profile.mjs,
extração no cadastro, migration/ACL/grants e testes correspondentes. Sem escrita
ou banco/comandos mutáveis. Ganho: checagem independente de autorização,
concorrência e privilégios enquanto o frontend corrige foco e o orquestrador
executa regressões. Retorno com severidade/local/reprodução sugerida, sem resposta
esperada; uma revisão e seguimento somente se houver achado material. Contexto
herdado; no máximo dois especialistas simultâneos. Revisão humana segue pendente.
