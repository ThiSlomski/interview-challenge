# AUTHZ-001 — contrato, 29/10/2026

Base main/012f9caa2ef9513feca0b9bbca64b87dbf312eb7, árvore limpa.
README 2,7,8,10,14–18. Pedido atual autoriza API e promoção local preparada,
somente testes mutáveis descartáveis; nenhuma promoção em imobilead.

| Identidade servidor | GET /api/users | GET /api/users/[id] |
| --- | --- | --- |
| Ausente/inválida/expirada/revogada | 401 | 401 |
| user | 403 | próprio 200; qualquer outro identificador 403 |
| admin | 200, páginas de 100 | 200; UUID inválido 400; inexistente 404 |
| Papel desconhecido/incompleto | 403 | 403 |

Identidade pela função central; papel consultado novamente no banco, sem cache.
Política pura separada de HTTP e repository. Projeção: id e campos de cadastro
exceto senha/confirmação; sem role ou datas desnecessárias. no-store em respostas.
Listagem ordenada por UUID, cursor after opcional, 100 registros e nextCursor;
percorre todos os registros sem prometer snapshot entre páginas concorrentes.
Autorização anterior a validação/consulta de alvos impede oráculo de existência.
Falhas de banco 503 sanitizado; parâmetros desconhecidos 400 após autorização.

Orquestrador escreve server/users/**, rotas, procedimento scripts/database/admin-*,
testes e documentação. Preservar schema/grants/dependências/Harness/CI.
Aceite: matriz unitária, HTTP Next+PG real, demotion imediata, falsificação,
projeções, falhas e promoção válida/inválida/inexistente, regressões existentes.
Verificações exigidas no pedido; evidência authorization.md e diff fora da árvore.
Tempo operacional: implementação/verificação até 60 min; uma execução e até duas
correções por problema com hipótese nova. Limite dois especialistas simultâneos.
Revisão Backend independente de leitura após implementação: ganho concreto é
procurar IDOR/escalada/vazamento com contexto separado; nenhuma escrita atribuída.
Documentação consolidada pelo orquestrador após retorno. Revisão humana pendente.
