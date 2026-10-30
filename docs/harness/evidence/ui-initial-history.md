# Histórico da rodada inicial UI-001

Padronização posterior de pastas,29/10/2026: links visuais navegáveis agora usam
ui-captures/ e ui-reference/. Nomes antigos em inventários, comandos e snapshots
abaixo documentam a época original; não foram substituídos indiscriminadamente.
A pasta ui-captures foi reutilizada apenas depois de confirmada vazia, recebendo
o conjunto final. Assim, um caminho citado como retirado no inventário anterior
pode hoje existir com conteúdo final distinto. O histórico não é inventário atual.

Relato preservado da implementação inicial, anterior à identidade Slomski e à
correção assíncrona P1. Resultados abaixo pertencem àquela rodada.
A entrega vigente está em [ui.md](ui.md); o detalhe P1 está em [ui-p1.md](ui-p1.md).

As nove imagens antigas foram retiradas na organização final. Os links visuais
abaixo mostram agora o ESTADO FINAL equivalente, com identidade e correções P1;
não são imagens da execução inicial. Planos, falhas e resultados textuais
foram preservados, inclusive menções históricas à quantidade antiga.

# UI-001 — evidência, 29/10/2026

Finalização vigente: [UI-001-P1](ui-p1.md), com reprodução/correção da corrida
assíncrona e identidade oficial Slomski Solutions. O relato abaixo é histórico.

Base `main/4c5c6fc7986dccaf88887fa5b1587853fc10c6b1`, árvore limpa inicial.
CI-base aprovado conforme usuário; CI do diff não consultado/disparado.
[Contrato e aceite](ui-plan.md). Revisão humana pendente.

## Entrega e fronteiras

| Tela | Resultado |
| --- | --- |
| `/` | Entrada útil, cadastro/login/área e navegação por teclado |
| `/cadastro` | Todos os campos, shared validation, normalização e erros associados/foco |
| Sucesso em `/cadastro` | Resumo sem senha, somente memória; reload retorna ao formulário; exige login |
| `/login` | Senha intacta, cookie HttpOnly recebido pelo browser, destino fixo `/area` |
| `/area` | Proteção servidor, falha segura de infraestrutura e consulta própria |
| `/area?after=UUID` | Listagem admin autorizada,100 itens/cursor e estado vazio |
| Sair | Revogação confirmada antes de limpar/navegar; falha permite nova tentativa |

Reutilizados authenticateSession, mayRead/readUsers/projectUser e contratos das
APIs. Sem HTTP servidor para si mesmo/Host arbitrário, hash/token enviado ao
cliente ou cache compartilhado da área. `force-dynamic`/revalidate0 na página.
O conteúdo pessoal começa oculto no cliente e só aparece após checagem de sessão
e consulta autorizada com papel fresco. O gate DOM fecha antes da pintura/cleanup
para retorno de snapshots Next; pagehide/visibilidade/foco também revalidam.
Polling30s detecta revogação em uso ativo; timer respeita expiresAt absoluto sem
renovar. O servidor verifica cada acesso protegido independentemente da UI.

Sem localStorage/sessionStorage/query string com dados pessoais ou credenciais,
POST repetido automaticamente, nova biblioteca visual, API/schema/grant alterado,
clima, recuperação/verificação de e-mail ou novas permissões.

## Execuções efetivas

| Verificação | Resultado real |
| --- | --- |
| npm test | 29/29 sem skips; launchers executam registro8/auth11/autorização6 |
| npm run test:ui, rodada final | 28/28 sem skips:12 cenários Chromium,15 checks SQL e teste principal |
| Lint e typecheck | Passaram explicitamente e novamente no verify --product |
| npm run build | Passou após correção de cache/foco; /area dinâmica, demais telas públicas estáticas |
| npm audit | Zero vulnerabilidades com Playwright instalado |
| doctor / validate | Passaram; validate documental final após consolidação |
| verify --product | ok:true, Node29/29 comprovados por eventos; partial:true/readiness:not-assessed |
| git diff --check | Passou; conferência final inclui arquivos novos pelo patch |

A suíte Chromium executa Next dev real com provider adaptado exclusivamente ao
PostgreSQL descartável local guardado. Não é HTTP mock disfarçado de navegador.
Criação, login, cookie, proteção, consultas, logout, revogação, expiração e erro
DB foram reais; respostas429/503 de feedback e transporte incerto são interceptados
somente nos casos declarados. Limites reais das APIs também foram exercitados na
suíte HTTP/PostgreSQL existente. Produção/TLS e CI remoto não foram testados.
Harness não afirma ter executado navegador/build: esses resultados são separados.

Casos Chromium aprovados: navegação pública/URL protegida/teclado; cadastro
inválido, confirmação divergente, nome151/150 codepoints Unicode e senha36/7;
cadastro válido/resumo sem senha/XSS como texto/sem sessão/URL/storage/reload;
conflito, loading/desabilitação, POST incerto único e429; login inválido/exato e
correto sem redirect externo; cadastro próprio e403 administrativo; logout503,
sucesso, voltar/avançar/refresh/URL e navegação cliente; revogação com dados
visíveis (aproximadamente32s na rodada final), expiresAt inalterado em consultas,
expiração no servidor; snapshot área→cadastro→revogar→voltar; admin paginado,
listagem vazia, rebaixamento de papel; erro DB seguro; mensagens429/503 e viewport
390×844 sem overflow. Desktop1280×900. Não é auditoria WCAG integral.

## Revisão independente e correções

Frontend delegado implementou telas, CSS e serviço servidor com propriedade
exclusiva registrada. Skills resume-project/plan-requirement/deliver-requirement
carregadas; raiz consolidou documentação com record-decision/verify-delivery.
A instância Frontend atingiu limite do serviço após entregar arquivos e relatar
lint/typecheck. A raiz assumiu seus arquivos, refez verificações e integrou ajustes.
Backend realizou revisão independente de leitura com review-security/verify-delivery.
Houve interrupção inicial por limite do serviço; retomada e seguimento concluíram.

Achado P2: restaurar área por cache cliente poderia mostrar snapshot antes do
polling. Corrigido por conteúdo inicialmente oculto, gate antes da pintura/cleanup
e consulta autorizada antes de revelar. Regressão real de retorno após revogação
passou. Seguimento independente não identificou novo risco material no escopo.
Também foram apontados encoding de fixtures, seleção de alertas e captura com
skip-link sobre a marca. Corrigidos com escapes/edição direta, seletores limitados
a main, foco após commit e padrão de clipping para skip-link até receber foco.
Capturas finais inspecionadas pela raiz. Revisão humana continua pendente.

## Falhas intermediárias e mudança de estratégia

- validate intermediário falhou por links para evidência ainda não criada;
  o destino foi criado e a validação passou.
- Primeiras duas rodadas combinadas:45/51 aprovações, falhas da suíte UI por
  encoding PowerShell→stdin Node, alertas Next fora de main e asserção de POST
  antes da chegada da requisição. A primeira também deixou sessões da fixture
  para o assert SQL final; limpeza explícita dos usuários UI corrigiu isso.
- Terceira rodada combinada: novo seletor de foco ainda continha caractere
  corrompido, causando falhas dependentes por id não coletado; corrigido com
  edição direta. Não se aceitou código zero/ausência de testes como aprovação.
- Após o limite de correções, a estratégia mudou: patches diretos para Unicode,
  id coletado antes de asserções secundárias e suite UI separada das regressões
  HTTP já verificadas. A rodada UI isolada passou28/28. Inspeção visual ainda
  encontrou skip-link sobre a marca; clipping corrigido e nova execução justificada
  pela mudança visual, por teste de lista vazia e revogação com dados visíveis.
  Rodada final28/28. Sem repetição de revisões ilimitadas.
- Playwright1.64.1 exato/lockfile adicionado para navegador real. Instalador oficial
  baixou Chromium/FFmpeg no cache local e removeu automaticamente versões antigas
  desse cache. Não houve alteração de configuração pessoal pelo agente.
- Aviso preexistente React18 depreciado no Next16 permanece; versões preservadas.

## Referências visuais finais equivalentes

Somente chrome de desenvolvimento do Next é ocultado na captura; a aplicação
não é alterada pela captura. Sem traces, cookies, URLs de conexão ou senhas.

- [Entrada desktop](ui-captures/01-home-focus-desktop.png) (skip-link focado por teclado).
- [Erros do cadastro](ui-captures/02-cadastro-erros-desktop.png).
- [Resumo confirmado](ui-captures/03-cadastro-sucesso-desktop.png).
- [Área user desktop](ui-captures/04-area-user-desktop.png).
- [Área user celular](ui-captures/04-area-user-mobile.png).
- [Área admin](ui-captures/06-area-admin-desktop.png).
- [Indisponibilidade segura](ui-captures/07-area-indisponivel-desktop.png).
- [Login celular com falha](ui-captures/08-login-mobile.png).
- [Cadastro celular](ui-captures/09-cadastro-mobile.png).

## Limpeza, diff e pendências

Todas as rodadas confirmaram cleanup:confirmed/remainingResources:0 e
protectedMetadata:unchanged (metadados/ACLs protegidos, sem ler dados pessoais).
Next foi encerrado por PID próprio, Chromium/contexto fechados e fixture temporária
removida com fronteira validada. Sem mutações ou leitura de usuários em imobilead,
bancos remotos, credenciais registradas, commit/push/publicação.

Diff exclusivo final, incluindo novos arquivos/capturas solicitadas, em
`C:\Users\thiag\AppData\Local\Temp\ui-001.diff`; gerado a partir do HEAD limpo,
sem alterar index, sem .env, dependências instaladas ou artefatos Next/build.

Pendente: previsão de amanhã por REST no navegador (README13.c/d), revisão humana,
HTTPS/produção, CI remoto do diff e validação em outros navegadores. Limites de
rate limiting local por processo e segurança de infraestrutura continuam conforme
AUTH/REG existentes. Nenhuma prontidão integral de produção foi declarada.

Complemento da rodada final: `npm run test:db:integration` executado separadamente
após separar runners:40/40 aprovados, zero skips, cleanup confirmado e metadados/
ACLs protegidos iguais. Preserva as24 verificações HTTP reais e15 checks SQL,
além do teste principal. O browser permanece em test:ui, sem adaptação do Harness.

Fechamento documental: checker UTF-8 estrito passou nos textos alterados; validate
conferiu links/âncoras. O check que inclui arquivos novos encontrou linhas vazias
extras no EOF de LoginForm/RegistrationForm/area.ts; removidas sem mudança funcional.
Inventário final: nenhum node da fixture Next ativo e0 diretórios temporários da
fixture. Nove capturas mantidas como evidência solicitada; demais recursos limpos.
