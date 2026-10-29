# AUTH-001 — evidência, 29/10/2026

Base main/1c96acb1a5c707c443daa53eb63dbca268ca561d, somente AI_PROMPTS.md
previamente modificado; preservado. CI do commit-base informado pelo usuário,
sem confirmação remota nem CI deste diff. [Plano](authentication-plan.md).

## Implementação e aceite

POST /api/auth/login recebe JSON email/password, normalização compartilhada sem
validação completa do cadastro, senha intacta, Argon2id com dummy verificável de
custo equivalente. Credenciais incorretas/inexistentes:401 INVALID_CREDENTIALS.
SQL parametrizado, projeção mínima. Limites:4096 bytes/5s, concorrência2,
30/min global,5/min digest de e-mail,Map<=1024; sem IP/Forwarded confiados.

Sessão32 bytes aleatórios, digest SHA256 no modelo existente, cookie somente
HttpOnly/SameSite=Lax/Path=/, sem Domain. Local HTTP imobilead_session; produção
HTTPS __Host-imobilead_session/Secure obrigatório. TTL configuração literal3600;
expiração absoluta sem renovação, relógio reavaliado após await SQL. Cookie só
após persistência. Preserva sessões anteriores/dispositivos. Respostas no-store.
GET /api/auth/session consulta sessão/usuário servidor e retorna id/expiresAt,
401 inválida/ausente/expirada/revogada. POST logout revoga antes de remover cookie;
repetição200, replay401, falha DB503 AUTH_FAILED sem cookie de sucesso/remoção.
Função central authenticateSession reutilizável em rotas/páginas servidor.
POST exige Origin exata APP_ORIGIN; ausente/null recusado. Metadata cross-site,
same-site/navigate/document recusada; sem CORS aberto. Consulte SOLUTION/arquitetura.

## Execuções e falhas preservadas

1. Pré-inspeção: tentativa de caminho lib/server não existente, corrigida com rg
   para server/registration; nenhum efeito. Python indisponível ao preparar
   integração; nenhuma escrita ocorreu nessa tentativa, usada ferramenta Node.
2. Primeira integração real:33 testes contados,31 pass/2 fail (pai+subteste).
   Único cenário falhou porque fetch/Undici sobrescreve Sec-Fetch-Mode:navigate
   com cors, resultando400 de input em vez403. Hipótese confirmada pela semântica
   do cliente; probe passou a node:http bruto para preservar header. Não alterou
   proteção de produção. Cleanup confirmado mesmo na falha.
3. Segunda integração real:33/33 pass,zero skips, incluindo nove auth HTTP/PG,
   oito cadastro HTTP e15 permissões, mais principal. Banco/papéis descartáveis
   removidos, metadados/ACLs protegidos de imobilead iguais.
4. Revisão independente Backend encontrou P2: e-mail normalizado254 bytes com
   espaços era aceito cadastro, mas comprimento bruto login retornava400.
   Corrigido com limite após normalização e regressão uppercase/espaços/254.
   Consulta passou também a reavaliar relógio após SQL, com regressão de expiração
   durante await. Revisão independente de seguimento:11/11 controlados,sem achados
   pendentes no escopo; nenhum acesso DB/escrita pelo revisor.
5. QA final após correções: npm test28 pass/zero skips (inclui launchers cadastro8
   e auth11); npm run test:auth:server11/11; integração final33/33,zero skips,
   cleanup confirmado,remainingResources0,protectedMetadata unchanged. Lint e typecheck foram confirmados pelo agregador final após as correções, conforme o fechamento.
6. npm run build passou com rotas auth dinâmicas; npm audit zero vulnerabilidades.
   Aviso de depreciação React18 mantido, sem mudança de dependência. tsconfig sem diff.

Os testes HTTP usam Next dev real em cópia temporária e PostgreSQL real local
127.0.0.1:5432/banco e papéis descartáveis com sufixo único. Provider de fixture
aceita apenas destino descartável, mantém checker/grants, não afrouxa runtime.
Revogação/grants de falha/fixtures expiradas só nesse banco. Processos Next e
junction/diretório temporários encerrados/removidos pelo finally, comando final
retornou0. Nenhum usuário/sessão de teste ou DML em imobilead; leitura de metadados
protegidos pelo runner conforme implementação anterior. Sem banco remoto.

## Limites e revisão

Controlados: relógio exato, configuração/cookie produção em string, timeout/corpo/
concorrência/quota global e identidade, SQL/falhas. HTTP real: criação/login/cookie,
digest/TTL persistido/não renovação, sessões simultâneas, replay/revogação, falhas DB,
origem/body/metadata/abuso por identidade. Nenhum navegador ou HTTPS produção
exercitado: atributos em string/HTTP local não comprovam aceitação __Host/Secure
pelo navegador. Quotas locais não coordenam instâncias; produção requer controles
no ingresso e compartilhados, sem promessa de tempo constante/segurança exaustiva.

Revisão humana pendente. Páginas protegidas/roles403/listagem/telas/clima/reset e
verificação e-mail fora da etapa. Nenhum commit/push/publicação/dependência nova,
Harness/CI/migration/grant principal alterado. Prompt integral acrescentado uma vez
em AI_PROMPTS preservando alteração prévia. Documentação consolidada pelo
orquestrador após retornos (sem instância adicional de Documentação).

## Fechamento

Doctor, validate e verify --product código0. Agregador confirmou lint/typecheck,
Harness/probe e28 testes produto; partial:true/readiness:not-assessed. Build/audit
demonstrados separadamente. Diff --check final conferido após consolidação.
Revisão do diff detectou problema de codificação no script documental passado por
stdin ao Node: acentos viraram ?, uma busca truncou SOLUTION. Corrigido antes da
entrega restaurando conteúdo histórico do HEAD e aplicando seção AUTH em UTF-8;
nenhum código/prompt integral alterado por essa falha. Diff final e comparação do
prompt/preexistente verificam preservação. Sem resíduo gerado versionado.
