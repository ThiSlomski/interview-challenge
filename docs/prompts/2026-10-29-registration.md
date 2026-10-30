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

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-16"></a>

# REG-001 — cadastro pela API, 29/10/2026

Prompt integral preservado em [registro REG-001](../prompts/2026-10-29-registration.md).
Ferramenta: Codex; skills resume-project, plan-requirement, deliver-requirement,
review-security, verify-delivery e record-decision lidas. Orquestrador único
escritor; Backend delegado somente para revisão independente de leitura conforme
[contrato](../harness/evidence/registration-plan.md).

Aceito: contrato DB-001, hash Argon2id, validação browser-safe, SQL parametrizado,
allowlists, origem configurada e testes reais isolados. Ajustado: argon2@0.45.1
exigia compilação nativa indisponível; substituído por @node-rs/argon2@2.2.2 pinado,
sem instalação de toolchain ou ampliação de permissões. Callback de diagnóstico
ajustado após erro TypeScript de inferência da assinatura JS.
O provider PostgreSQL só é substituído na cópia temporária do teste HTTP;
o runtime real continua restrito ao destino/papel originais. Sem banco principal
mutável, sessões, UI, clima, Harness/CI ou Git mutável.
Resultados e revisão em [evidência](../harness/evidence/registration.md).
Revisão humana pendente; CI do commit-base conforme relato do usuário,
sem atribuir integração local ao CI.

Revisão independente corrigiu dois P2 de e-mail (sintaxe e ASCII antes de lowercase),
confirmados por regressões e repetição HTTP/PostgreSQL real. O launcher de servidor
recusou resumo vazio com código zero: NODE_TEST_CONTEXT herdado provocava execução
recursiva ignorada pelo Node; variável removida apenas do subprocesso, agora exige
oito casos sem skips. Verificação documental intermediária encontrou links para
evidência ainda em consolidação; arquivo criado e validate passou em seguida.


<a id="registro-17"></a>

## REG-001-E1 — prompt integral da correção, 29/10/2026

Ferramenta: Codex. Skills já carregadas e reaplicadas: resume-project,
plan-requirement, deliver-requirement, verify-delivery e record-decision.
Tarefa pequena executada pelo orquestrador, sem nova delegação; autorrevisão.

```text
Corrija o achado de comprimento de e-mail da etapa REG-001, mantendo aderência ao README.

Preparação
- Leia AGENTS.md e o estado/handoff atuais.
- Confira o requisito de e-mail válido no README, a validação compartilhada, seus testes e as evidências REG-001.
- Registre Git e preserve integralmente as alterações anteriores ainda não commitadas.

Achado
O validador atual aceita:
1. 'a@' + 'b'.repeat(64) + '.test'
2. 'a'.repeat(65) + '@example.test'

Reproduza ambos antes da correção e registre o resultado observado. Não apresente esta descoberta como falha já coberta pela revisão anterior.

Correção
- Preserve o contrato de e-mail ASCII, normalização e sintaxe já implementado.
- Exija no máximo 64 bytes na parte anterior ao @.
- Exija no máximo 63 bytes por segmento do domínio.
- Adote limite de 254 bytes para o endereço normalizado completo, compatível com o caminho SMTP de 256 bytes incluindo < e >.
- Confira e registre as referências oficiais pertinentes: RFC 5321, seção 4.5.3.1, e RFC 1035, seção 2.3.4.
- Como o contrato é ASCII, explique que caracteres e bytes coincidem após a checagem ASCII.
- Retorne o erro de campo existente, sem expor a entrada.
- Mantenha o validador compartilhado seguro para uso futuro no navegador.
- Não acrescente consulta DNS, envio de e-mail ou verificação de posse.

Testes
- Acrescente regressões para os dois exemplos reproduzidos.
- Teste aceitação em 64 bytes na parte local e 63 por segmento, e rejeição em 65 e 64 respectivamente.
- Teste endereço completo com 254 bytes aceito e 255 rejeitado, mantendo válidos os demais componentes para isolar essa regra.
- Preserve os casos de normalização, Unicode recusado e sintaxe já cobertos.
- No HTTP Next + PostgreSQL descartável, comprove 400/INVALID_INPUT para os comprimentos inválidos e ausência de linhas inseridas.
- Comprove também cadastro válido nas fronteiras pertinentes.
- Ajuste o orçamento ou a organização dos testes para não confundir rejeição de validação com 429 do limitador. Não enfraqueça o controle de abuso para acomodar testes.

Banco e escopo
- Use somente os recursos descartáveis autorizados e as proteções existentes.
- Preserve imobilead, seus dados, permissões e metadados.
- Não altere migrations, grants, dependências, Harness ou CI.
- Não implemente login, sessão, cookies, telas, autorização ou clima nesta correção.

Verificação
- Execute npm test, testes de servidor e integração HTTP/PostgreSQL pertinente.
- Execute lint, typecheck, build, doctor, validate, verify --product e git diff --check.
- Confirme limpeza dos recursos próprios.
- Separe testes controlados, execução HTTP/PostgreSQL real e verificações não executadas.
- Se houver falha, registre causa e correção; não conte testes ignorados como aprovação.

Documentação e entrega
- Registre este prompt integral em AI_PROMPTS.md.
- Atualize contrato, SOLUTION.md, arquitetura, evidência REG-001, estado e handoff onde necessário.
- Preserve o histórico e registre explicitamente: erro encontrado, reprodução, impacto, correção e regressões.
- Corrija a afirmação anterior de que não havia limite de comprimento, distinguindo o estado histórico do atual.
- Gere um diff exclusivo desta correção, incluindo arquivos novos se houver, sem segredos ou artefatos gerados.
- Ao concluir, informe arquivos alterados, resultados e pendências do desafio.

Sem commit, push ou publicação. Após esta correção, a próxima etapa será login e sessão; não a inicie neste pedido.
```

Aceito integralmente: limites oficiais, ASCII/normalização/sintaxe existentes,
mesmo erro sem entrada, ausência de DNS e escopo estrito. Reprodução anterior à
edição confirmou os dois exemplos como ok:true. Esta lacuna é descoberta E1 e não
foi coberta pela revisão anterior. Ajuste de testes: segunda instância HTTP para
seis probes de comprimento, sem mexer em quota/relógio/handler. Resultado e fontes
oficiais em [evidência E1](../harness/evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026).
Nenhuma falha intermediária nova observada nos testes controlados e HTTP/PG desta
correção. Revisão humana pendente; sem nova revisão independente ou aprovação de CI.
