# 2026-10-29-authentication

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-18"></a>

## AUTH-001 — login, sessão persistida e logout, 29/10/2026

Ferramenta: Codex. Prompt integral recebido:

```text
Implemente a etapa AUTH-001: login, sessão persistida e logout, seguindo o README e os contratos existentes.

Contexto
- Persistência DB-001 e cadastro REG-001 estão versionados.
- O usuário apresentou CI aprovado do commit 1c96acb.
- Cadastro não emite sessão.
- Contrato acordado: sessão com validade absoluta de 3600 segundos, sem renovação.
- Confira o estado real do repositório antes de assumir qualquer pendência.

1. Preparação
Leia AGENTS.md, README.md integral, handoff e project-state. Consulte arquitetura, requisitos, SOLUTION.md, implementação de cadastro, modelo de sessões e permissões conforme necessário.

Confira Git e preserve alterações anteriores. Carregue as skills aplicáveis. Siga o contrato de delegação, com ganho concreto, limite configurado e um escritor por arquivo.

Registre plano e critérios de aceite antes da escrita. Defina os caminhos dos endpoints conforme o README; quando ele não definir, escolha e documente uma convenção consistente.

2. Login
- Receba e-mail e senha por POST JSON.
- Reutilize a normalização de e-mail e a verificação Argon2id existentes, sem acoplar login à validação completa de cadastro.
- Não transforme, remova espaços ou altere a senha.
- Use consultas parametrizadas e projeção interna mínima.
- Para conta inexistente e senha incorreta, retorne o mesmo status e mensagem genérica.
- Evite diferenças óbvias de trabalho entre esses dois caminhos usando verificação de hash fictício com custo equivalente. Não prometa tempo constante da requisição inteira.
- Limite corpo, prazo de leitura e concorrência.
- Implemente proteção contra tentativas repetidas, com estruturas de memória limitadas. Não confie em IP ou Forwarded arbitrário.
- Documente valores, critérios, limitações entre instâncias e necessidade de controles de produção. Não introduza bloqueio permanente de conta.
- Não registre e-mail, senha, hash, cookie ou token em logs.

3. Sessão
- Use token opaco gerado com fonte criptográfica, com pelo menos 32 bytes aleatórios.
- Persista somente o digest do token no modelo existente; nunca o token original.
- Transporte o token exclusivamente em cookie de sessão, sem retorná-lo no JSON ou armazená-lo em localStorage.
- Cookie HttpOnly, SameSite explícito, Path=/, sem Domain e Secure obrigatório em produção.
- Defina nome e comportamento do cookie para desenvolvimento HTTP local e produção HTTPS. Não enfraqueça produção para acomodar testes.
- Validade absoluta de 3600 segundos, validada no servidor; navegação e consultas não renovam a sessão.
- Rejeite configuração ausente ou inválida conforme contrato, sem aceitar TTL arbitrário silenciosamente.
- Gere novo token a cada login; não reutilize identificador fornecido pelo cliente.
- Defina o comportamento diante de sessão anterior e logins simultâneos. Preserve sessões de outros dispositivos salvo decisão explícita documentada.
- Não emita cookie de sucesso antes de confirmar a persistência.
- Use no-store nas respostas de autenticação e sessão.

4. Verificação e logout
- Implemente uma função central de autenticação reutilizável por rotas e páginas no servidor.
- Consulte sessão e usuário no servidor; rejeite token inválido, sessão inexistente, expirada ou revogada.
- Não confie em userId ou role recebidos do cliente.
- Acrescente um endpoint mínimo de consulta da sessão atual para comprovar a integração, retornando somente os campos necessários.
- Ausência de sessão válida retorna 401; indisponibilidade do banco retorna erro sanitizado, sem liberar acesso.
- Implemente logout por POST, com revogação persistida e remoção do cookie usando os mesmos atributos pertinentes.
- Logout deve ser repetível; depois de revogado, o token antigo não pode voltar a autenticar.
- Se a revogação falhar, não declare logout concluído apenas porque o cookie foi removido.
- Não use GET para ações que alteram sessão.

5. Origem e CSRF
- Proteja login e logout contra requisições de outra origem, usando APP_ORIGIN como fonte confiável.
- Defina tratamento explícito para Origin ausente ou null e metadados de navegação.
- SameSite será uma defesa adicional, não a única proteção.
- Não habilite CORS amplo ou credenciais para origens arbitrárias.
- Consulte documentação oficial atual quando necessário e registre as decisões.

6. Banco e escopo
Reutilize schema, grants e checker existentes. Não amplie privilégios para facilitar a implementação.

Se identificar necessidade real de mudança no contrato de banco, explique-a antes de aplicar qualquer alteração no banco principal. Não altere migrations já aplicadas.

Testes mutáveis somente nos recursos descartáveis autorizados, com isolamento e limpeza existentes. Não crie usuários de teste nem revogue sessões em imobilead.

Nesta rodada não implementar telas, listagem de usuários, autorização user/admin, promoção de administrador, clima, recuperação de senha ou verificação de e-mail. A função de autenticação prepara essas etapas, sem declarar os requisitos de autorização concluídos.

7. Testes
Inclua testes unitários e HTTP Next + PostgreSQL reais para:
- Login válido, senha incorreta e conta inexistente.
- Resposta uniforme para credenciais incorretas.
- Corpo inválido, origem recusada e limites de abuso.
- Cookie e seus atributos; ausência de token no JSON.
- Digest persistido, sem token original no banco.
- Sessão válida, token adulterado/malformado, sessão ausente, expirada e revogada.
- Fronteira exata de expiração e ausência de renovação.
- Novo token a cada login e comportamento de sessões simultâneas.
- Logout, repetição e tentativa de reutilizar o cookie antigo.
- Falhas sanitizadas de leitura, criação e revogação no banco.
- Preservação do cadastro e das verificações de permissões existentes.

Não espere uma hora nos testes: use relógio controlado nos unitários e fixtures expiradas somente no banco descartável.

Separe testes controlados, HTTP real, PostgreSQL real e comportamento efetivamente exercitado em navegador. Não declare cookies seguros em produção apenas por conferir uma string de cabeçalho em desenvolvimento.

8. Verificação e entrega
Execute testes pertinentes, lint, typecheck, build, audit, doctor, validate, verify --product e git diff --check. Confirme encerramento dos processos e limpeza dos recursos próprios.

Faça revisão independente delimitada de autenticação, sessão, cookies e CSRF conforme o contrato. Corrija achados com regressões.

Registre o prompt integral em AI_PROMPTS.md. Atualize SOLUTION.md, arquitetura, requisitos, evidência AUTH-001, estado e handoff. Preserve falhas intermediárias, resultados e limitações. Mantenha Markdown válido sem modificar o texto integral dos prompts registrados.

Dependências novas somente se necessárias, justificadas e com versão exata e lockfile atualizado. Não altere Harness ou CI sem necessidade concreta demonstrada.

Gere diff exclusivo da rodada, incluindo arquivos novos, sem segredos ou artefatos gerados. Informe comportamento implementado, arquivos alterados, comandos/resultados e pendências do desafio.

Sem commit, push, publicação, acesso a bancos remotos ou chamadas de clima. Não afirme prontidão integral ou CI remoto aprovado para alterações ainda não versionadas.
```

Aceito: escopo API, TTL fixo, banco descartável e nenhuma publicação. Contrato e
resultados: [plano](../harness/evidence/authentication-plan.md) e
[evidência](../harness/evidence/authentication.md). Revisão humana pendente.
