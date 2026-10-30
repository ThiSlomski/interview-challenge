# 2026-10-29-authorization

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-19"></a>

## AUTHZ-001 — autorização e consulta, 29/10/2026

Ferramenta: Codex. Prompt integral recebido:

```text
Implemente a etapa AUTHZ-001: autorização no servidor e consulta de usuários, conforme o README.

Contexto
- Cadastro, login, sessão persistida e logout estão implementados.
- O usuário apresentou CI aprovado do commit 012f9ca.
- Sessões têm validade absoluta de 3600 segundos, sem renovação.
- Autorização por papel, consulta de usuários, páginas/telas e clima permanecem pendentes. Confira o estado atual antes de assumir essas pendências.

1. Preparação
- Leia AGENTS.md, README.md integral, handoff e project-state.
- Consulte requisitos, arquitetura, SOLUTION.md, autenticação, persistência e permissões conforme necessário.
- Confira Git e preserve alterações anteriores.
- Carregue as skills aplicáveis e siga o contrato de delegação, com ganho concreto, limite configurado e um escritor por arquivo.
- Registre plano, matriz de acesso e critérios de aceite antes da implementação.
- Use os caminhos exigidos pelo README. Quando houver ambiguidade, escolha a alternativa mínima compatível e documente.

2. Autorização e consulta
Implemente os contratos de consulta do README, incluindo GET /api/users quando previsto:
- Usuário autenticado com papel user acessa somente seu próprio registro.
- Administrador pode listar todos os usuários, conforme o requisito.
- Consulta individual por identificador, se fizer parte do contrato, exige autorização explícita antes de retornar dados.
- Sem sessão válida: 401.
- Autenticado sem permissão: 403.
- Identificador inválido e recurso inexistente devem ter comportamento documentado, sem revelar existência de registros a quem não pode acessá-los.
- Preserve POST /api/users público para cadastro.

Reutilize a autenticação central:
- Identidade vem da sessão validada no servidor.
- Papel vem do banco, nunca de body, query, cabeçalho arbitrário ou cookie controlado pelo cliente.
- Não preserve papel em cache que permita manter acesso administrativo após rebaixamento.
- Papel desconhecido ou resultado incompleto não concede acesso.
- Não altere o endpoint mínimo de sessão para expor dados desnecessários.
- Não dependa de ocultar botões ou de middleware como única barreira.
- Falhas de banco devem impedir acesso e retornar diagnóstico sanitizado.

Separe a política de autorização da camada HTTP e da consulta, mantendo a implementação simples e testável.

3. Dados e SQL
- Use consultas parametrizadas e listas explícitas de colunas.
- Retorne somente os campos previstos no README e necessários ao consumidor.
- Nunca retorne password_hash, senha, confirmação, token_hash, cookies ou registros de sessão.
- Não use SELECT * para montar respostas públicas.
- Respostas com dados pessoais devem usar Cache-Control: no-store.
- Não registre dados pessoais, credenciais ou corpos de respostas em logs.
- Se a listagem precisar de paginação, use limites e ordenação determinística, preservando o requisito de permitir ao administrador consultar todos os registros por páginas. Documente o contrato.
- Não amplie permissões do papel imobilead_app.

4. Provisionamento administrativo
Prepare o procedimento exigido pelo README para tornar administrador um usuário já existente:
- Operação local explícita, identificada por UUID.
- Executada com credencial administrativa, separada da aplicação.
- Sem conta ou senha padrão.
- Sem endpoint público de promoção.
- Sem conceder UPDATE(role) ao runtime.
- Destino validado e confirmação de que exatamente um usuário foi encontrado/alterado.
- Erros e saída sanitizados, sem listar usuários ou credenciais.

Implemente/documente o mecanismo e teste-o somente no ambiente descartável. Não promova ninguém nem altere papéis em imobilead nesta rodada.

5. Testes
Inclua testes unitários da matriz de autorização e testes HTTP Next + PostgreSQL reais com, no mínimo:
- Dois usuários comuns distintos e um administrador de fixture.
- Requisição sem sessão, com sessão inválida, expirada e revogada.
- Usuário consultando seu próprio registro.
- Usuário tentando consultar outro registro ou obter listagem administrativa.
- Tentativas de forjar identidade/papel por parâmetros, corpo e cabeçalhos.
- Administrador consultando os registros permitidos.
- Administrador rebaixado no banco perdendo o acesso privilegiado na requisição seguinte, mesmo mantendo a sessão.
- Papel desconhecido ou resultado incompleto nos testes controlados.
- Ausência de campos sensíveis em todas as projeções.
- Falha de banco sem vazamento ou acesso indevido.
- Provisionamento administrativo válido, UUID inválido e usuário inexistente.
- Regressões de cadastro, login, expiração e logout.

Os testes devem comprovar também ausência de dados do outro usuário nas respostas recusadas.

Use somente os recursos descartáveis autorizados, com as proteções e limpeza existentes. Não leia linhas pessoais, crie usuários, promova contas ou altere dados/permissões em imobilead. Não acesse bancos remotos.

6. Escopo desta rodada
- Implementar autorização, consultas e procedimento administrativo.
- Não implementar ainda telas, página protegida, clima, recuperação de senha ou verificação de e-mail.
- Não declarar requisito de página protegida concluído por haver somente API protegida.
- Preservar migrations já aplicadas, grants, dependências, Harness e CI, salvo necessidade concreta demonstrada. Não mudar contrato de banco silenciosamente.

7. Verificação e documentação
- Execute testes pertinentes, lint, typecheck, build, audit, doctor, validate, verify --product e git diff --check.
- Confirme encerramento dos processos e limpeza dos recursos próprios.
- Faça revisão independente delimitada, com foco em acesso a registros de outros usuários, escalada de privilégio e exposição de dados.
- Registre e corrija achados com regressões.
- Separe testes controlados, HTTP/PostgreSQL reais e o que não foi executado.

Registre o prompt integral em AI_PROMPTS.md. Atualize SOLUTION.md, arquitetura, requisitos, evidência AUTHZ-001, estado e handoff. Preserve histórico, falhas intermediárias e limitações. Confira links, âncoras e Markdown.

Gere diff exclusivo da rodada, incluindo arquivos novos, sem segredos ou artefatos gerados. Ao concluir, informe matriz de acesso implementada, arquivos alterados, comandos/resultados e pendências do desafio.

Sem commit, push ou publicação. A próxima etapa será a interface com cadastro, login e página protegida; não a inicie neste pedido.
```

Aceito: API autorizada, promoção explícita preparada, testes descartáveis e limites de escopo.
Escolhas: consulta individual própria/admin e listagem admin paginada por UUID.
Ajustado após revisão: falhas controladas nas três fases de consulta.
[Contrato](../harness/evidence/authorization-plan.md) e [evidência](../harness/evidence/authorization.md). Revisão humana pendente.
