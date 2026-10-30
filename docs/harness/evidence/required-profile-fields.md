# REG-ESSENTIAL-001 — dados essenciais, 30/10/2026

## Contrato

Pedido atual autoriza nome/cidade/estado/país obrigatórios em cadastro e edição,
normalização externa, mensagens específicas, sem alterar layout ou credenciais.
E-mail/senha/confirmação preservam contratos. Endereço/CEP/mensagem opcionais.
Base main/c10747a com REG-UI-001 pendente; preservar snapshot e diff incremental.

Orquestrador: shared/registration.mjs, formulários/messages, testes de validação,
fixtures/testes HTTP/UI necessários, integração final e documentação compartilhada.
Banco de Dados: database/migrations (somente migration nova), script de preflight
somente leitura e teste novo específico da integridade; sem editar testes
compartilhados existentes. Ganho concreto: auditoria independente do schema e
compatibilidade agregada local em paralelo com validação/UI, sem escritores
concorrentes nos mesmos arquivos. Backend: testes Node/HTTP existentes sob
tests/registration, tests/profile (exceto browser.mjs e ui.test.mjs), tests/auth,
tests/authorization, tests/admin-delete (exceto browser.mjs e ui.test.mjs),
tests/database/integration.test.mjs e fixtures HTTP relacionadas. Ganho concreto:
atualizar dados sintéticos e testar servidor/API em paralelo sem tocar produto/UI.
Coordena quantidade de migrations com Banco. Contexto herdado; duas instâncias
especialistas conforme AGENTS. Prazo45min por frente, uma execução
e até duas correções por hipótese. Segurança/qualidade transversais.

Banco: verificar schema e contagens agregadas de incompatíveis somente no alvo
local autorizado127.0.0.1:5432/imobilead, sem valores pessoais nem segredos no
output. Não aplicar migration/grants nem alterar cadastros persistentes nesta
rodada. Restrição versionada só após confirmação de compatibilidade, sem inventar
valores antigos; testar SQL apenas em fixtures descartáveis. Se houver legados
incompatíveis, registrar contagens e impedimento de aplicar a restrição.

Aceite: validação compartilhada cliente/API/perfil, required semântico/textual,
primeiro campo inválido em foco, resumo com links e preservação de valores;
API direta rejeita inválidos, opcionais continuam aceitos, trim persistido,
user/admin mesma regra, credenciais ausentes em respostas/resumo/logs. Regressão
de cadastro/sucesso/clima/login/sessão/autorização; testes PostgreSQL descartáveis
com cleanup confirmado e metadados protegidos iguais. Sem Git mutável, deploy,
mudanças de auth/papéis/e-mail/hashing/meteorologia ou layout. Revisão humana e
CI remoto pendentes; resultados não equivalem a prontidão integral.

Complemento de auditoria: [pedido Zod](../../prompts/2026-10-30-zod-validation-audit.txt)
autoriza dependência direta, schemas compartilhados strict e adaptador público;
substitui a solução manual provisória desta rodada. API e UI mantêm os mesmos
entrypoints validateRegistration/validateProfile.

Autorização posterior explícita: “Pode aplicar a migration, em outra rodada vamos
atualizar o readme e CI / Compose.” Banco pode executar migration no persistente
local após novo preflight. A proibição inicial de DDL persistente acima fica
superada somente por essa aplicação. README e CI ficam para a próxima etapa.
Complemento seguinte: “se já tinha feito o compose, pode deixar !” autoriza manter
o ajuste já feito em scripts/container/smoke.mjs: estado no cadastro sintético e
contagem3 de migrations. Dockerfile/compose.yaml/configuraçãoCI intactos.

## Auditoria e decisão Zod

Leituras: README local integral, README-base oficial integral, package.json,
package-lock.json completo (444 registros antes da edição, parseados e relações
de dependências inspecionadas), módulos/formulários/APIs e testes relacionados.
Base anterior preservada em snapshot temporário required-profile-fields-before.

O item3 do [README original](https://github.com/imobilead-app/interview-challenge#o-desafio)
diz exatamente: “Validação no servidor e no cliente, seguindo boas práticas.”
Não há menção nominal a Zod ou biblioteca de schemas nesse original. O README
local descreve validação compartilhada, sem declarar tecnologia de schemas.
Não alterar o requisito histórico para afirmar que ele exigia nominalmente Zod.

Antes: funções manuais validateRegistration/validateProfile compartilhavam
validateProfileFields; isso compartilhava regras, mas não constituía biblioteca
de schemas. package-lock já continha Zod4.6.7 dev transitivo via
eslint-plugin-react-hooks/zod-validation-error e Ajv6.15.0 dev via ESLint.
Nenhum era usado pelo fluxo de cadastro/perfil. Yup/Joi/Valibot ausentes.
Zod transitivo do lint não atende ao pedido de uso efetivo na aplicação.

Decisão pelo pedido complementar: Zod4.6.7 fixo como dependência direta runtime,
sem duplicar versão; lock só adiciona dependência raiz e remove dev:true de Zod.
Regras passam a shared/schemas.mjs, usando z.strictObject/safeParse/transforms
e refinamentos. Exporta registrationSchema, profilePatchSchema, profileTextSchema,
profileVersionSchema e listas de campos. Wrappers registration.mjs/profile.mjs
delegam ao mesmo validateSchema, consumido por formulários e handlers existentes.
Não resta validador manual concorrente. Refinamentos de domínio preservam a
sintaxe ASCII/RFC e os limites de e-mail anteriores, que diferem do z.email padrão;
nenhuma validação de negócio foi trocada silenciosamente pela regex padrão.
Referência de API: [documentação Zod](https://zod.dev/api).

Nome/cidade/estado/país passam por trim ECMAScript e recusa de ausente/null/vazio/
branco. Nome até150 pontos Unicode após trim; localização sem novo limite
individual, body16KiB preservado. Endereço/CEP/mensagem mantêm ausência=>null,
null/strings vazias e conteúdo original permitido; PATCH omitido não é escrito.
Senhas não sofrem trim/coerção;8–35 alfanuméricas e igualdade preservadas.
Confirmação é removida do resultado antes da persistência. E-mail mantém ASCII
antes de casefold, limites64/63/254 e duplicidade UNIQUE. Strict recusa campos
internos/extra; adaptador publica somente códigos controlados no formato antigo,
sem ZodError/inputs/stack/chaves desconhecidas. POST409/mensagem pública genérica
mantidos; distinção HTTP de conflito já existia, sem nova consulta enumerativa.

UI mantém layout de REG-UI-001: required7/4, texto solicitado e mensagens locais
específicas para essenciais ausentes; erro de tamanho mantém mensagem e hint150.
Resumo preserva todos links, foco vai ao primeiro campo inválido e ao alerta em
erro geral. Senha/valores não são limpos em erro; tentativa inválida não faz POST/
PATCH. Busy e guarda contra duplicação preservados. Resumo/clima usam a submissão
validada e normalizada, sem senha. Não há alteração na integração meteorológica.

## Banco e aplicação autorizada

Auditoria: name varchar150 NOTNULL permitia branco; city/state/country text
nullable sem CHECKnonblank. Fresh preflight somente leitura em127.0.0.1:5432/
imobilead confirmou0 incompatíveis por campo e conjunto, sem ler valores/IDs.
Migration nova1793491200000-required-profile-fields.cjs usa lock e guarda atômica,
NOTNULL para localização e quatro CHECKnonblank com o mesmo whitespace de trim.
Nenhuma migration antiga editada e nenhum valor inventado/reescrito.

Após autorização explícita, migrate exit0/applied1 no persistente. Pós-preflight:
0 incompatíveis, quatro NOTNULL e quatro CHECK validatedtrue. inspect/check-app
aprovados. Sem grants, alterações de cadastros/sessões, reset ou restart.
[Identidade, resultados e schema antes/depois](required-profile-fields-persistent.json).
Os testes PostgreSQL confirmam também recusa atômica de legado incompatível e
preservação de IDs/e-mails/hashes/papéis/timestamps/sessões/versões no descartável.

## Verificações, revisão e limites

| Verificação local | Resultado final |
| --- | --- |
| Node pelo verify --product |69/69; zero falhas/skips |
| HTTP/Next/PostgreSQL |74/74; cadastro direto/perfil/segurança e4 testes novos de integridade |
| UI geral Chromium/Next/PG |78/78; formulário, sucesso/clima, login/sessão/autorização |
| UI perfil |41/41; user/admin, required, trim/foco/erros e concorrência existente |
| UI exclusão administrativa |45/45; nenhuma alteração de auth/papel/exclusão |
| doctor → validate → verify --product |Aprovados; lint/TypeScript/Harness Node aprovados |
| Build |Aprovado |
| npm audit |Zero vulnerabilidades; Zod4.6.7 direto e deduplicado |
| validate documental final e git diff --check |Aprovados |

[Resultados Backend](required-profile-fields-backend-results.json),
[resumo geral/auditoria](required-profile-fields-results.json),
[Harness](required-profile-fields-harness.json),
[hashes incrementais](required-profile-fields-hashes.json).
[Inventário incremental dos arquivos](required-profile-fields-files.json).
Diff exclusivo versus snapshot preservado fora do checkout em
TEMP/required-profile-fields-exclusive.diff; não inclui alterações anteriores
idênticas ao snapshot. Manifestos finais adicionados após a captura do inventário
não incluem seu próprio hash.
Todos os runners DB/UI terminaram com cleanupconfirmed0 e metadados protegidos
iguais; Next/Chromium próprios encerrados. Testes usam somente cadastros sintéticos
descartáveis; a aplicação persistente acima não executou DML de cadastro.

Revisão Banco independente encontrou duas diferenças de agregação do Zod:
superRefine não executava confirmação quando outro campo tinha invalid_type,
nem EMPTY_PATCH/undefined essencial com versão malformada. Corrigidas usando
refine/when independentes nos schemas; testes combinados aprovados e seguimento
sem achados materiais. Backend rodou22 validações finais separadas; Harness69
posterior confirma o conjunto completo. Não foi aceita apenas instalação de Zod.

Falha intermediária adminUI:4/6, pois fixture restaurava city=NULL, agora recusado
pelo banco; agregador também falhou. Fixture passa a restaurar Curitiba, valor
sintético original. Rodada seguinte45/45. Sem ajuste de regra para admitir NULL.
Typecheck inicial acusou inferência do retorno adaptador; JSDoc da união pública
foi explicitado, sem cast que burle a validação. Build/tipos finais aprovados.

Somente pares02/09 e três capturas normais do cadastro atualizados nesta rodada;
demais imagens preservadas por hash. CSS do refinamento anterior byte-idêntico ao
snapshot, sem alteração de layout. Capturas normais e estados de erro inspecionados
visualmente. Clima externo determinístico em teste; serviço real não certificado.
Teclado virtual real, outros navegadores e revisão humana permanecem pendentes.

Harness partial:true/readiness:not-assessed. README e CI remotos não atualizados
ou executados por decisão do usuário. Apenas fixture/contagem do smoke Compose
ajustados e mantidos por autorização; execução Docker/Compose não repetida nesta
rodada. Não declarar o pipeline/container atualizado verificado integralmente.
Documentação de requisitos/arquitetura/solução e memória do projeto consolidadas
pelo orquestrador após os retornos. Sem commit/push/publicação/deploy.
