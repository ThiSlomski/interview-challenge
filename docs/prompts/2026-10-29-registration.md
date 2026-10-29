# REG-001 — prompt integral, 29/10/2026

Ferramenta: Codex, sessão principal; revisão independente Backend delimitada.

```text
Implemente a próxima etapa do desafio: cadastro de usuários pela API, seguindo integralmente o README e os contratos existentes.

Contexto
- Harness V1 e persistência PostgreSQL estão versionados.
- O commit 835537d recebeu CI aprovado, conforme informado pelo usuário.
- DB-001 inclui migrations, usuários, sessões e separação de papéis.
- A integração PostgreSQL real foi executada localmente; não confundir com cobertura do CI.
- Cadastro, login, cookies, autorização, logout e clima ainda precisam ser implementados. Confira o estado atual antes de assumir essas pendências.

1. Preparação
- Leia AGENTS.md, README.md integral, handoff e project-state.
- Consulte SOLUTION.md, requisitos, arquitetura e código de persistência conforme necessário.
- Confira Git e preserve alterações anteriores.
- Carregue as skills aplicáveis e siga o contrato de delegação. Delegue apenas com ganho concreto, respeitando o limite configurado e um escritor por arquivo.
- Registre um plano curto com escopo, contratos e critérios de aceite antes de implementar. Resolva escolhas rotineiras autonomamente; interrompa apenas por conflito material.

2. Escopo autorizado
Implemente o endpoint de cadastro e os módulos de servidor necessários:
- Validação dos campos exigidos pelo README, incluindo nome, e-mail, senha, confirmação e demais dados cadastrais.
- Respeite os limites e a obrigatoriedade definidos nas fontes; não invente regras silenciosamente.
- Separe a validação reutilizável da persistência. Nenhum módulo compartilhado com o navegador pode importar código de banco ou segredos.
- Normalize o e-mail conforme o contrato existente.
- Armazene apenas um hash seguro de senha, com salt e parâmetros justificados. Nunca armazene confirmação ou senha em texto.
- Garanta papel inicial user, sem aceitar papel ou campos internos enviados pelo cliente.
- Use consultas parametrizadas e o papel imobilead_app.
- Trate concorrência no cadastro de e-mail repetido usando a restrição real do banco.
- Defina respostas HTTP consistentes, projeção mínima e diagnósticos sanitizados.
- Não exponha senha, hash, confirmação, material de sessão, SQL ou credenciais em respostas e logs.
- Implemente proteção proporcional contra abuso, limite de corpo e tratamento seguro da origem da requisição. Documente o comportamento de CORS/CSRF aplicável e as limitações da solução.
- Não emita sessão automaticamente nesta etapa.

Justifique dependências novas, se necessárias, fixe versões e atualize o lockfile. Reutilize o que já estiver adequado. Não amplie privilégios do runtime para facilitar a implementação.

Não implementar nesta rodada telas, login/logout, cookies de sessão, promoção de administrador ou integração de clima. Não alterar o Harness ou o CI sem necessidade concreta demonstrada.

3. Testes
Inclua testes significativos de:
- Validações válidas, inválidas e limites.
- Correspondência entre senha e confirmação.
- Hash verificável, sem armazenamento da senha original.
- Tentativa de enviar role=admin e outros campos internos.
- Contrato HTTP do endpoint real, incluindo cadastro válido, entrada inválida, duplicidade e falha sanitizada.
- Persistência e duplicidade concorrente no PostgreSQL.
- Proteções contra abuso e requisições rejeitadas.

Mocks podem apoiar testes unitários, mas não substituem a execução HTTP e PostgreSQL reais.

Preserve imobilead e seus dados. Para testes mutáveis, reutilize o mecanismo descartável existente somente dentro da autorização documentada e das proteções atuais. Não presuma que a autorização permite limpar ou inserir usuários no banco principal. Confirme a limpeza dos recursos criados pela própria execução.

4. Verificação e documentação
- Execute testes pertinentes, lint, typecheck, build, audit e verificações do Harness, incluindo verify --product.
- Execute git diff --check.
- Não trate código zero isolado, testes ignorados ou ausência de testes como aprovação.
- Faça revisão independente delimitada antes de concluir, conforme o contrato.
- Registre o prompt integral em AI_PROMPTS.md.
- Atualize SOLUTION.md, arquitetura, evidências, estado e handoff conforme as mudanças.
- Preserve falhas intermediárias relevantes, com causa, correção e resultado.
- Separe claramente testes controlados, HTTP real, PostgreSQL real e pendências.

Conclua com arquivos alterados, comportamento implementado, comandos/resultados, limitações e próximo passo. Gere um diff exclusivo desta rodada, incluindo arquivos novos e excluindo segredos e artefatos gerados.

Sem commit, push, publicação, chamadas de clima ou acesso a bancos remotos.
```
