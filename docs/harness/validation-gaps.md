# Procedimentos para as lacunas de validação

28/10/2026 · origem H-002 · estado não executado, exceto timeout em Windows.
Este procedimento não concede autorização para publicar, enviar dados ou alterar
configuração pessoal. Não usar flags que contornem confiança de hooks.

## Disparo real de hooks

1. Preparar uma cópia descartável do esqueleto/Harness em pasta temporária, com
   raiz Git própria e sem segredos, node_modules ou dados pessoais. Nenhum commit
   é necessário. Usar Node/Git/CLI já disponíveis.
2. Abrir um terminal separado com CODEX_HOME apontando apenas a um perfil
   temporário vazio. Não copiar auth/config pessoal; autenticação eventual deve
   ser feita explicitamente pelo usuário nesse perfil isolado.
3. Iniciar `codex -C <copia>`; revisar a camada de projeto e as definições em
   `/hooks`, se disponível nessa superfície, antes de conceder confiança local.
4. Depois da revisão de confiança, iniciar outra conversa nova no mesmo perfil
   isolado. Registrar execução real de SessionStart e, após uma tarefa de leitura
   curta, Stop no trace do cliente. Exigir evidência de evento, handler e resultado,
   sem persistir transcrição privada ou entrada bruta. Saída manual do handler não basta.
5. Desativar as integrações no perfil descartável e encerrar somente processos
   criados pelo teste. Não tocar no perfil pessoal nem usar trust bypass.

Não executado: esta sessão não controla um novo cliente interativo com a revisão
de confiança necessária. Configuração local e teste de handler permanecem úteis
sem afirmar ativação. Comandos doctor/validate são a alternativa explícita.

## Seleção dos especialistas por nome nativo

Na cópia/perfil isolados, depois de conferir a camada e agentes disponíveis,
solicitar uma tarefa de leitura ao especialista `backend` pelo nome. Conferir no
trace do runtime a seleção do tipo/nome customizado e o arquivo de definição usado;
se o cliente não fornecer esse dado, manter não comprovado. Uma resposta dizendo
ser Backend ou a leitura manual do TOML não é prova de seleção nativa. Não ampliar
permissões nem trocar modelo apenas para obter a demonstração.

## Retomada em sessão realmente limpa

Abrir nova conversa no cliente, sem resume/fork e sem fornecer histórico anterior.
Registrar que a conversa foi criada sem mensagens herdadas. Dar somente o pedido
de usar resume-project e reconciliar checkpoint/Git; exigir branch, revisão,
alterações, tarefa e próximo passo corretos. Instruções de sistema e arquivos
descobertos normalmente não são histórico de conversa; registre essa distinção.
Subagente com contexto herdado ou instância reutilizada não satisfaz o critério.

## Timeout/descendentes

Demonstrado automaticamente em Windows por
`node --test scripts/harness/harness.test.mjs`: árvore de processos QA própria,
timeout real e confirmação de desaparecimento dos dois PIDs. Nenhum processo do
usuário é selecionado por nome. Cobertura não inclui filhos desanexados, negação do
SO ao encerramento ou outro sistema operacional. Falha de limpeza é reportada,
sem tratá-la como confirmação de encerramento da árvore.
