# Matriz de requisitos do desafio

Data: 28/10/2026. Origem: [README canônico](../README.md), inspecionado
integralmente, e retornos H-001-F/B/D/X. Estado: consolidação automatizada H-001-R;
revisão humana pendente. [Contrato](harness/evidence/demo-plan.md) e
[evidência da demonstração](harness/evidence/demo.md).

O README prevalece em divergência. IDs com letras abaixo de um número apenas
decompõem o mesmo item do enunciado. **Pendente** significa sem implementação
verificável; **Parcial** identifica uma parte existente e a lacuna. Nenhum
requisito funcional está concluído nesta etapa de Harness. Os critérios descrevem
o aceite futuro, sem inventar limites de campos que o enunciado não define.

Evidências de leitura: **F** = Frontend H-001-F; **B** = Backend H-001-B;
**D** = Banco H-001-D; **X** = revisão independente H-001-X. São avaliações
estáticas, sem teste de navegador, migrations ou CI remoto. Os caminhos nas
colunas indicam o estado atual, não a arquitetura futura. Testes do Harness não
satisfazem os testes funcionais exigidos pelo desafio.

## Atualização DB-001 — 29/10/2026

O pedido atual autoriza a etapa de banco. A matriz abaixo incorpora o schema,
migrations e contratos preparados em DB-001; os registros F/B/D/X continuam
históricos. PostgreSQL real, conexão da aplicação e permissões ainda dependem
das condições registradas na [evidência atual](harness/evidence/database.md).
Estrutura de banco não conclui cadastro, autenticação, autorização ou logout.
## Obrigações numeradas

| ID | Fonte | Requisito | Critério de aceite | Implementação atual | Teste/evidência | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | README Parte 1, item 1 | Cadastro persistido em banco; escolha justificada | Formulário cria registro durável; escolha e trade-offs documentados | PostgreSQL escolhido; schema inicial e conexão servidor preparados; formulário/POST ausentes | [DB-001](harness/evidence/database.md); persistência real ainda não comprovada | Parcial; estrutura preparada |
| 1.a | Item 1, Nome | Nome string, máximo 150 caracteres | Validar tipo e limite em cliente e servidor | Migration com name varchar(150) NOT NULL; cliente/API ausentes | DB-001; teste PostgreSQL preparado, não executado | Parcial |
| 1.b | Item 1, E-mail | E-mail validado e único | Endereço inválido rejeitado; duplicidade impedida pela persistência | Migration exige lower+trim canônico, formato básico e UNIQUE; validação client/API pendente | DB-001; concorrência em PostgreSQL preparada, não executada | Parcial |
| 1.c | Item 1, Senha | Senha alfanumérica, mínimo 8 e máximo 35; nunca texto puro | Limites/política verificados e somente hash persistido | Coluna password_hash text; sem senha/confirmação; hashing e política ainda não implementados | DB-001; schema não comprova algoritmo nem impede hash inválido | Parcial |
| 1.d | Item 1, Confirmação | Confirmação de senha | Divergência impede cadastro | Sem campo ou validação | F; sem teste funcional | Pendente |
| 1.e | Item 1, Endereço | Campo Endereço | Campo participa do cadastro e persistência | Coluna address text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 1.f | Item 1, Cidade | Campo Cidade | Cidade persistida e disponível para o fluxo de clima | Coluna city text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 1.g | Item 1, Estado | Campo Estado | Campo participa do cadastro e persistência | Coluna state text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 1.h | Item 1, País | Campo País | Campo participa do cadastro e persistência | Coluna country text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 1.i | Item 1, CEP | Campo CEP | Campo participa do cadastro e persistência | Coluna postal_code text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 1.j | Item 1, Mensagem | Campo Mensagem | Campo participa do cadastro e persistência | Coluna message text nullable preparada; cadastro/API/UI ausentes | DB-001; integração PostgreSQL não executada | Parcial |
| 2.a | README Parte 1, item 2 | REST em `app/api`: criação por POST | Requisição válida cria registro; inválida é rejeitada | Única rota é GET com mensagem fixa | B; `app/api/v1/route.tsx` | Pendente |
| 2.b | Item 2, GET | Consulta autenticada de registros | GET exige sessão e consulta dados persistidos | GET atual não consulta usuários | B/D | Pendente |
| 2.c | Item 2, exposição | Nunca expor senha ou hash | Nenhuma resposta de consulta inclui senha/hash | Não há consulta de registros; ausência não comprova o controle futuro | B; sem teste de serialização | Pendente |
| 2.d | Item 2, papéis | User consulta somente o próprio; admin lista tudo | API aplica as permissões de 8.a–8.c | Sem sessão ou autorização | B/D; sem teste funcional | Pendente |
| 3.a | README Parte 1, item 3 | Validação no cliente | Dados inválidos recebem feedback e não seguem pelo fluxo normal | Sem formulário/regras | F | Pendente |
| 3.b | Item 3 | Validação no servidor | API rejeita entrada inválida mesmo sem cliente | Sem API de cadastro/regras | B | Pendente |
| 4 | README Parte 1, item 4 | Schema versionado e migrations reproduzíveis | Banco sobe do zero pelos comandos documentados | Migration node-pg-migrate e provisionamento versionados; instruções em SOLUTION | DB-001; execução em PostgreSQL real pendente | Parcial; implementado sem verificação real |
| 5 | README Parte 2, item 5 | Login por e-mail e senha contra hash | Login válido cria sessão; inválido falha sem comparação em texto puro | Sem login ou hash | B; sem teste API | Pendente |
| 6 | README Parte 2, item 6 | Sessão autenticada com escolha justificada | Mecanismo funciona e arquitetura explica trade-offs | Contrato de sessão opaca e tabela preparados; login/cookies/consulta ausentes | DB-001; revisão Backend do contrato, sem teste auth | Parcial; contrato/estrutura |
| 7.a | README Parte 2, item 7 | Proteger endpoints sensíveis | Ausência/invalidade de sessão resulta em 401 | Sem endpoints sensíveis implementados | B; sem teste 401 | Pendente |
| 7.b | Item 7 | Ao menos uma página protegida | Sem sessão, acesso redireciona para login | Home pública sem controle de sessão | F; sem teste de navegação | Pendente |
| 8.a | README Parte 2, item 8 | Papel user vê só o próprio registro | API nega consulta de outro usuário | Sem modelo de papéis ou checagem | B/D; sem teste de autorização | Pendente |
| 8.b | Item 8 | Listagem completa exclusiva para admin | User não lista tudo; admin autorizado lista | Sem listagem de usuários | B/D; sem teste de autorização | Pendente |
| 8.c | Item 8, status HTTP | Autenticado sem permissão recebe 403 | Teste distingue 403 de 401/404 nesse caso | Sem regra implementada | B; sem teste 403 | Pendente |
| 8.d | Item 8, admin | Decidir/documentar como alguém vira admin | Provisionamento reproduzível e seguro, coerente com a escolha | Promoção administrativa explícita de usuário existente por UUID decidida; comando futuro pendente, sem conta padrão | DB-001 e arquitetura; nenhum admin real criado | Parcial |
| 9 | README Parte 2, item 9 | Logout invalida efetivamente a sessão | Sessão anterior deixa de acessar recursos protegidos | revoked_at modelado; logout e validação da sessão ausentes | DB-001; nenhum teste de logout | Pendente |
| 10.a | README Parte 2, item 10 | Armazenamento seguro da sessão/token | Escolha, riscos e controles documentados e coerentes com implementação | Contrato digest SHA-256 de token aleatório 32 bytes; emissão e cookie futuros | DB-001; estrutura não comprova auth funcional | Parcial |
| 10.b | Item 10 | CSRF se cookies forem usados | Decisão condicional documentada; controle testado se aplicável | Cookie futuro HttpOnly/Secure/SameSite=Lax acordado; proteção CSRF/origem não implementada | DB-001; nenhum cookie/controle exercitado | Pendente |
| 10.c | Item 10 | CORS | Política consciente e documentada para as origens necessárias | Sem decisão específica demonstrada | B; sem teste de política | Pendente |
| 10.d | Item 10 | Rate limiting/brute-force no login | Tentativas abusivas limitadas; comportamento verificável | Sem endpoint de login ou limitador | B; sem teste de abuso | Pendente |
| 10.e | Item 10 | Evitar enumeração de e-mail | Erros de login não revelam existência da conta | Sem login ou contrato de erro | B; sem comparação de respostas | Pendente |
| 10.f | Item 10 | Expiração/renovação de sessão | Ciclo de vida definido, implementado e testado | Expiração absoluta de 1h sem renovação acordada; constraints temporais versionadas | DB-001; ciclo funcional/teste real pendentes | Parcial |
| 10.g | Item 10 | Controle de acesso no servidor | API valida papel; esconder interface não concede permissão | Sem autorização na API | B; sem teste de bypass do cliente | Pendente |
| 11.a | README Parte 3, item 11 | Formulário com feedback de erros | Erros úteis visíveis associados às entradas | Sem formulário; `Hello` só registra erro no console | F | Pendente |
| 11.b | Item 11 | Estados de carregamento | Usuário percebe envio/carregamento e resultado | Mensagem inicial vazia; sem estado de envio | F | Pendente |
| 11.c | Item 11 | Acessibilidade básica | Formulário e estados utilizáveis com teclado e semântica adequada | Sem controles de formulário; layout mantém `lang="en"` | F; sem teste de acessibilidade/browser | Pendente |
| 12.a | README Parte 3, item 12 | Fluxo login/logout e área protegida | Navegação autentica, protege e encerra sessão de modo coerente com API | Sem telas ou estado de sessão | F/B | Pendente |
| 12.b | Item 12 | Área respeita user/admin | User vê próprio registro; admin recebe listagem autorizada | Sem registros ou UI por papel | F/B; controle servidor também exigido | Pendente |
| 13.a | README Parte 3, item 13 | Tela de sucesso confirma cadastro | Confirmação aparece após criação bem-sucedida | Sem cadastro/tela de sucesso | F/X | Pendente |
| 13.b | Item 13 | Resumo submetido sem senha | Resumo mostra dados apropriados e omite senha | Sem resumo | F/X; sem teste de exposição | Pendente |
| 13.c | Item 13 | Previsão do dia seguinte para cidade informada | Cidade e data de amanhã determinam a previsão exibida | Sem cidade, data ou consulta de clima | F/X | Pendente |
| 13.d | Item 13 | API RESTful gratuita chamada a partir do client; sem embed | Evidência de chamada REST do navegador à API escolhida para previsão | REST cliente existente busca só `/api/v1`, que retorna mensagem fixa | F/X; revisão independente por fluxo, sem tráfego de navegador demonstrado | Pendente |
| 14.a | README Parte 5, item 14 | Unitários de validação | Casos relevantes válidos/inválidos executados em runner real | Node test runner em configuração de conexão; validação de cadastro ainda ausente | DB-001; não substitui os unitários funcionais do README | Parcial; escopo de configuração |
| 14.b | Item 14 | Unitários de autorização | User não acessa outro; só admin lista todos | Sem regras/testes funcionais | B | Pendente |
| 14.c | Item 14 | Ao menos um teste de API | Comportamento relevante de API é exercitado, por exemplo login ou 401/403 | Sem teste de API | B | Pendente |
| 15.a | README Parte 5, item 15 | Comando de testes documentado e runner justificado | Instrução reproduzível executa testes reais | npm test usa Node test runner em arquivos explícitos; integração PostgreSQL separada | SOLUTION e DB-001; integração real pendente | Parcial |
| 15.b | Item 15 | Testes executados no CI | Passo test executa runner real e falha quando testes falham | CI existente chama npm test; script passou a testes offline, sem alterar workflow; integração futura pendente | CI não executado nesta etapa; aprovação anterior informada pelo usuário é histórica | Parcial |
| 16 | README Parte 6, item 16 | Arquitetura e porquês: banco, camadas, fluxo, auth e trade-offs | Decisões funcionais documentadas correspondem ao código | ADRs DB-001 documentam persistência, modelo, sessões e privilégios; auth funcional futura | [Arquitetura](ARCHITECTURE.md), DB-001 | Parcial |
| 17 | README Parte 6, item 17 | Log de prompts, ferramenta e aceites/ajustes/rejeições justificados | Uso crítico rastreável sem atribuir aprovação humana não recebida | Prompt DB-001 integral e atualização de destino preservados; decisões e limites registrados | [Log](AI_PROMPTS.md), [prompt](prompts/2026-10-29-database.md) | Parcial; revisão humana pendente |
| 18.a | README Parte 6, item 18 | README ou SOLUTION ensina app+banco+testes+CI localmente | Outra pessoa consegue iniciar a solução inteira do zero | SOLUTION descreve instalação, papéis, conexão, migrations e testes; app ainda esqueleto | DB-001; instalação PostgreSQL do zero e fluxo completo não verificados | Parcial |
| 18.b | Item 18 | Variáveis de ambiente necessárias documentadas | Exemplo sem segredos e instruções correspondem à solução real | .env.example documenta URLs separadas, destino e confirmação local, somente placeholders | SOLUTION e DB-001; arquivo local não criado/sobrescrito | Parcial |

## Segurança e automação obrigatórias

O README pede priorização explícita e documentação das lacunas na Parte 4;
isso não dispensa o núcleo obrigatório de autenticação/autorização da Parte 2.

| ID | Fonte | Requisito | Critério de aceite | Implementação atual | Teste/evidência | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-1 | README Parte 4 | Hashing e política de senha | Algoritmo/custo e política justificados; nunca texto puro | Sem cadastro/hash; liga-se a 1.c e 5 | B/D | Pendente |
| SEC-2 | Parte 4 | Decisões de sessão, CSRF, abuso e enumeração | Controles e justificativas coerentes com 6 e 10 | Sem auth funcional | B | Pendente |
| SEC-3 | Parte 4 | Validação e sanitização; injeção SQL/NoSQL e XSS | Entradas tratadas em fronteiras e consultas/saídas seguras | Sem fluxo de entrada/persistência implementado | B/D; nenhuma exploração alegada | Pendente |
| SEC-4 | Parte 4 | `.env` fora do Git e `.env.example` versionado | Segredos não entram na entrega; exemplo suficiente à solução | `.gitignore` ignora `.env*` exceto exemplo; exemplo versionado | B; leitura de regras e inventário, sem ler valores privados; não é scan integral de histórico | Parcial |
| SEC-5 | Parte 4 | Proteção básica de abuso no cadastro e login | Limitação dos dois fluxos demonstrada | Sem endpoints/limitadores | B | Pendente |
| SEC-6 | Parte 4 | Headers de segurança | Headers escolhidos, justificativa e respostas verificadas | `next.config.mjs` sem configuração específica; padrões do framework não foram medidos | B; sem teste HTTP | Pendente |
| SEC-7 | Parte 4 | Dependências pinadas e audit limpo ou findings justificados | Versões reprodutíveis e avaliação de advisories documentada | Novas dependências exatas; npm audit após adições retornou zero vulnerabilidades | DB-001; avisos ESLint/React históricos permanecem | Parcial; audit atual aprovado |
| CI-1 | Parte 4 | CI GitHub Actions: lint, typecheck e build | Pipeline real executa etapas com falha bloqueante | Etapas existem; Node 20 no workflow | B; configuração lida, execução remota não verificada | Parcial |
| CI-2 | Parte 4 | Passo de segurança escolhido e documentado | SAST/SCA/secret scan efetivamente executado e avaliado | Audit existe em modo report-only com `\|\| true` | B; tornar bloqueante é melhoria esperada do README; sem alteração nesta etapa | Parcial |
| CI-3 | Parte 5, item 15 | Passo de testes reais | Runner funcional executado no CI | Script npm test agora contém 4 casos offline; workflow não alterado/disparado | DB-001; execução remota e integração PostgreSQL pendentes | Parcial |

## Uso de IA e entrega

| ID | Fonte | Requisito | Critério de aceite | Implementação atual | Teste/evidência | Status |
| --- | --- | --- | --- | --- | --- | --- |
| AI-1 | README Uso de AI e item 17 | Registrar prompts/ferramenta e uso crítico | Prompts e decisões aceitas/ajustadas/rejeitadas são rastreáveis | Log histórico, prompt integral V2 e resultados consolidados | [AI_PROMPTS](AI_PROMPTS.md), [prompt](prompts/2026-10-28-harness.md) e [demonstração](harness/evidence/demo.md) | Parcial; revisão humana pendente |
| AI-2 | README Uso de AI | Responsabilidade de revisar segurança, correção e manutenção | Avaliações automatizadas diferenciadas de revisão humana explícita | Revisões delimitadas dos especialistas; revisão humana não presumida | H-001-F/B/D/X e demonstração | Revisão humana pendente |
| ENT-1 | README Como entregar | Clone e repositório independente, sem fork vinculado | Destino de entrega atende à orientação da empresa | Histórico local preparado; publicação fora desta etapa | Log anterior documenta clone; destino público não criado/verificado aqui | Pendente para entrega |
| ENT-2 | Como entregar | Repositório público; alternativa privada comunicada à empresa | Avaliadores têm acesso ao destino indicado | Nenhuma publicação ou mensagem autorizada nesta etapa | Não executado | Pendente para entrega |
| ENT-3 | Como entregar | Commits pequenos/descritivos e push da solução | Histórico/destino contêm entrega autorizada | Há estabilização anterior; sem commit/push desta etapa | Git inicial e log; publicação futura exige autorização | Pendente para entrega |
| ENT-4 | Como entregar | CI verde e execução do zero pelo README | Pipeline remoto e instruções completas demonstrados | CI remoto não executado; produto ausente | DB-001; testes offline locais não comprovam CI/instalação completa | Pendente |
| ENT-5 | Como entregar | Responder e-mail com link e branch, se diferente de main | Comunicação enviada ao concluir a entrega autorizada | Nenhuma mensagem enviada | Não executado; fora do escopo Harness | Pendente para entrega |

## Diferenciais opcionais do enunciado

| ID | Fonte | Requisito | Critério de aceite | Implementação atual | Teste/evidência | Status |
| --- | --- | --- | --- | --- | --- | --- |
| PLUS-1 | README Parte 2, diferenciais | Verificação de e-mail | Se escolhida, fluxo verificável sem prejudicar núcleo | Não implementada | B | Opcional; não iniciado |
| PLUS-2 | Parte 2, diferenciais | Reset de senha | Se escolhido, recuperação segura demonstrada | Não implementado | B | Opcional; não iniciado |
| PLUS-3 | Parte 2, diferenciais | Papéis/permissões adicionais | Se escolhidos, autorização coerente e testada | Nem user/admin implementados | B/D | Opcional; não iniciado |
| PLUS-4 | README Parte 4, plus | Dockerfile e compose para app+banco | Se escolhidos, ambiente sobe e funciona | Sem containerização específica | D; inventário | Opcional; não iniciado |
| PLUS-5 | Parte 4, plus | IaC apropriada ao provisionamento | Se escolhida, decisão e configuração verificáveis | Sem IaC | Inventário | Opcional; não iniciado |

## Escolhas nossas e limites desta etapa

O Harness e seus oito componentes são uma escolha de ferramentas da Slomski
Solutions solicitada no Prompt 5, não uma obrigação extra imposta pela Imobilead.
AGENTS.md, quatro especialistas, seis skills, scripts Node e política de contexto
servem à execução/revisão/retomada do trabalho. Seus estados próprios ficam na
matriz de capacidades do Harness; não promovem requisitos funcionais a concluídos.
O prazo de três dias orienta a priorização do núcleo antes dos diferenciais.

DB-001 escolhe PostgreSQL, pg, node-pg-migrate e Node test runner para esta etapa.
Sessão opaca foi acordada com Backend; login/cookies e validação/autorização
continuam pendentes. Concluir verificação real da persistência antes da próxima
etapa funcional, respeitando credenciais e destino exclusivo registrados no handoff.
