# ADMIN-DELETE-001 — pedido integral

Ordem de envio comprovada (30/10/2026, America/Sao_Paulo, -03:00), conforme
mensagens `response_item`, `role=user`, da sessão Codex
`01a18b78-b43d-7702-a689-08f7957d4ff0`:

| Registro | Horário | Linha da transcrição JSONL |
| --- | --- | --- |
| [Texto integral recebido](#texto-integral-recebido) | 03:53:38.442 | 468 (envio do anexo) |
| [Autorização posterior](#autorização-posterior--preparação-do-banco-persistente) | 04:12:31.453 | 732 |

Ferramenta: Codex. Data: 30/10/2026. Escopo autorizado somente implementação e
testes descartáveis; sem grants/exclusões no persistente ou Git/publicação.

## Texto integral recebido

Implemente a exclusão administrativa de usuários comuns.

Estado inicial obrigatório:
- A árvore deve começar limpa.
- A edição de perfil está concluída e publicada.
- O CI remoto atual está verde.
- Não altere o README original.
- Não faça commit ou push.
- Não exclua nenhum usuário do banco persistente durante implementação ou testes.
- Testes destrutivos devem usar exclusivamente fixtures descartáveis autorizadas.

Objetivo:
Permitir que um administrador autenticado exclua definitivamente contas com papel `user`, encerrando atomicamente todas as sessões do usuário excluído.

Escopo deliberadamente excluído:
- Excluir contas administrativas.
- Autoexclusão.
- Soft delete.
- Restaurar usuários.
- Alterar papéis.
- Auditoria persistente.
- Exclusão em massa.

## API

Implemente:

DELETE /api/users/[id]

Regras:

1. Validar a sessão pelo mecanismo existente.
2. Usuário sem sessão válida recebe 401.
3. Usuário autenticado sem papel admin recebe 403 antes de consultar ou revelar qualquer informação sobre o alvo.
4. Validar o UUID somente depois da autorização administrativa.
5. UUID inválido recebe 400.
6. Administrador não pode excluir a própria conta.
7. Nenhuma conta com papel admin pode ser excluída.
8. Alvo inexistente ou já excluído recebe 404.
9. Conta `user` excluída com sucesso recebe 204 sem corpo.
10. Erros internos devem permanecer sanitizados.

Sugestão de códigos de domínio:

- SELF_DELETE_FORBIDDEN
- ADMIN_DELETE_FORBIDDEN
- USER_NOT_FOUND

## Transação e concorrência

A exclusão deve usar um único cliente PostgreSQL e uma única transação.

Dentro da transação:

1. Revalidar a sessão e o papel atual do ator.
2. Bloquear ator e alvo de forma determinística para evitar deadlocks.
3. Revalidar o papel dos dois registros após adquirir as travas.
4. Recusar se o ator deixou de ser admin.
5. Recusar se o alvo for admin.
6. Excluir exatamente uma conta `user`.
7. Confirmar a transação antes de responder 204.

Preservar a FK existente:

sessions.user_id → users.id ON DELETE CASCADE

Não executar uma segunda exclusão manual de sessões. O cascade deve remover as sessões atomicamente.

Testar concorrência com:

- duas exclusões simultâneas do mesmo usuário;
- promoção do alvo para admin concorrendo com exclusão;
- logout ou revogação do administrador durante espera por trava;
- login do alvo concorrendo com exclusão;
- leitura e polling atrasados depois da exclusão.

Nunca permitir que uma sessão utilizável seja criada para um usuário já excluído.

## Banco e privilégios

Atualize o provisionamento e o verificador de privilégios para permitir ao papel de runtime somente o DELETE necessário em users.

Preservar:

- proibição de TRUNCATE;
- proibição de DDL;
- proibição de delegar privilégios;
- proteção de e-mail, senha, papel, ID e datas;
- grants atuais de leitura e atualização por coluna;
- ausência de DELETE direto em sessions, pois o cascade é suficiente.

Não altere o banco persistente nesta etapa.

Se não houver mudança de schema, não crie migration artificial apenas para grants. Use o mecanismo canônico de provisionamento existente.

## Interface administrativa

Na listagem administrativa:

1. Mostrar “Excluir usuário” somente para registros com papel `user`.
2. Não mostrar ação de exclusão em contas administrativas.
3. Abrir confirmação acessível contendo nome e e-mail do alvo.
4. Informar que o cadastro será removido e as sessões serão encerradas.
5. Foco inicial no botão “Cancelar”.
6. Permitir Escape e navegação por teclado.
7. Retornar o foco ao botão de origem ao cancelar.
8. Impedir clique ou envio duplicado.
9. Não remover o usuário visualmente antes da confirmação 204.
10. Durante a requisição, apresentar estado de processamento.
11. Em erro de rede ou timeout, não afirmar que a exclusão falhou definitivamente; consultar novamente a listagem.
12. Após 204 ou 404, buscar novamente a página.
13. Se a página ficar vazia, retornar à primeira página.
14. Recalcular nextCursor.
15. Invalidar respostas anteriores à exclusão para impedir o reaparecimento do usuário.
16. Preservar logout, troca de identidade, histórico, polling e gate de conteúdo privado.

A confirmação deve funcionar em desktop e celular.

## Segurança

Preservar e testar:

- cookie HttpOnly;
- origem estrita;
- Fetch Metadata;
- proteção CSRF já utilizada;
- no-store;
- limites e timeouts existentes;
- SQL parametrizado;
- autorização exclusivamente no servidor;
- respostas sanitizadas;
- ausência de UUID, papel ou identidade confiados a partir do corpo.

O botão oculto não substitui a autorização do endpoint.

## Testes

Estender as suítes existentes para cobrir:

- 401 sem sessão;
- 403 para usuário comum;
- 400 para UUID inválido após autorização;
- autoexclusão proibida;
- exclusão de outro admin proibida;
- 404 para usuário inexistente;
- 204 para usuário comum;
- usuário realmente removido;
- todas as sessões do alvo removidas pelo cascade;
- demais usuários preservados;
- rollback em falha;
- segunda exclusão;
- concorrências descritas;
- grants e proibições reais do runtime;
- paginação após exclusão;
- confirmação, foco, teclado e Escape;
- envio duplicado;
- respostas atrasadas;
- logout durante exclusão;
- regressão de cadastro, login, perfil, consulta, clima e área protegida.

Executar:

- testes Node;
- HTTP/PostgreSQL descartável;
- autorização e sessões;
- concorrência;
- UI específica;
- regressão UI completa;
- lint;
- typecheck;
- build;
- audit;
- Harness;
- validações documentais;
- UTF-8;
- git diff --check.

Não aceite skips inesperados.

## Teste manual futuro

Não exclua Thiago, Anna Julia, Ravi ou qualquer outro cadastro persistente existente.

Para revisão humana posterior, documente que deverá ser criado um usuário sintético descartável, como:

Nome: Usuário Temporário para Exclusão
E-mail: endereço sintético exclusivo

A exclusão desse usuário persistente somente poderá ocorrer após autorização explícita do usuário.

## Documentação

Atualize somente o necessário:

- SOLUTION.md;
- docs/ARCHITECTURE.md;
- docs/REQUIREMENTS.md;
- evidência própria da exclusão administrativa;
- prompt integral em docs/prompts/;
- índice resumido em docs/AI_PROMPTS.md;
- memória canônica do projeto.

Preserve o README como enunciado original.

Se capturas oficiais forem alteradas, atualize somente as telas administrativas afetadas e preserve os hashes das demais.

## Entrega

Ao finalizar, informe:

1. Contrato implementado.
2. Arquivos alterados.
3. Privilégios adicionados e preservados.
4. Resultados completos dos testes.
5. Testes de concorrência realizados.
6. Capturas alteradas e hashes preservados.
7. Instruções para aplicar os grants no banco persistente.
8. Roteiro de teste manual com usuário sintético.
9. Diff exclusivo.
10. Limitações restantes.
11. Sugestão de commit.

Não aplique grants no banco persistente.
Não exclua usuários persistentes.
Não faça commit, push ou publicação.

## Resultado e avaliação crítica

[Contrato](../harness/evidence/admin-delete-plan.md) e
[evidência](../harness/evidence/admin-delete.md) registram implementação, limites,
revisão, falhas intermediárias e resultados reais separados. Não se atribui
aprovação humana ou CI remoto ao novo diff.

## Autorização posterior — preparação do banco persistente

Autorizo preparar o banco persistente local para a exclusão administrativa.

Destino permitido:

- host: 127.0.0.1
- porta: 5432
- banco: imobilead

Execute exclusivamente pelos comandos canônicos:

1. db:inspect
2. db:grant
3. db:check
4. db:inspect
5. reinício da aplicação

Autorizações:

- conceder DELETE em users ao papel de runtime;
- revogar DELETE direto em sessions;
- preservar os grants existentes por coluna.

Proibições:

- não excluir nenhum usuário;
- não excluir sessões manualmente;
- não alterar dados cadastrais;
- não executar DROP, TRUNCATE ou recriar estruturas;
- não fazer commit ou push.

Confirme o destino antes da alteração e apresente a comparação dos privilégios antes e depois.

Complemento solicitado por limitação de db:inspect: o usuário respondeu
"Autorizar leitura das ACLs antes e depois". Essas leituras foram exclusivamente
de metadados, em READ ONLY; nenhum cadastro/segredo foi lido pelo agente.
[Resultado L1](../harness/evidence/admin-delete.md#admin-delete-001-l1--preparação-persistente-autorizada).
