# ADMIN-UI-002 — refinamento administrativo, 30/10/2026

## Contrato e baseline

Base main/d32c6d04a7db6a72083ecdf13b5de06826cbc287, árvore inicialmente limpa.
[Pedido integral](../../prompts/2026-10-30-admin-profile-separation.txt),
[complemento modal](../../prompts/2026-10-30-admin-profile-complement-1.txt),
[complemento edição/largura](../../prompts/2026-10-30-admin-profile-complement-2.txt).
Complementos recuperados integralmente das mensagens user da sessão corrente,
sem reconstrução ou reprodução de outras mensagens.
Orquestrador como único escritor; execução e autorrevisão sem delegação.
Skills resume-project, deliver-requirement, verify-delivery, record-decision.
Escrita: Area, Record, ProfileForm, CSS, testes administrativos/perfil/UI,
expectativas de navegação/histórico da corrida UI, quatro capturas administrativas e docs.
Sem API, banco/migrations/grants, permissões, sessão, login, cadastro, clima,
rodapé, dependências ou Git mutável. Fixtures mutáveis somente descartáveis.
Aceite: perfil independente do cursor, papéis separados, edição substitutiva em
largura total, primeiro clique abre confirmação sem DELETE, concorrência,
acessibilidade, responsividade e regressões. Uma execução e até duas correções
por hipótese nova; até40min por subtarefa; complementos incorporados no mesmo diff.
Revisão humana e CI remoto deste diff pendentes.

## Perfil, papéis e cursor

A inspeção confirmou botão isolado e próprio admin originado da listagem.
loadArea já consulta own separadamente com identidade autenticada: card superior
usa snapshot.own, iniciado por essa fonte sem consulta SSR adicional.
Revalidação admin lê GET /api/users/[próprio id], mantendo valores frescos mesmo
fora da página, com validação entre as checagens inicial/final de sessão,
geração/AbortController/validade. Falhas continuam fechando a área protegida.
Recarregamento após exclusão conserva own; edição mantém GET/PATCH /api/profile,
ETag, profile_version, draft, conflito, cancelamento e retorno de foco.

Partição visual da página: role user e id diferente do próprio na seção principal;
role admin e id diferente em Outros administradores, condicional e somente consulta.
Marcadores textuais distinguem papéis; detalhe amarelo no próprio. Mensagem própria
vazia omitida; UUID/senha/sessão/campos internos não são renderizados.
Cursor original percorre todos os cadastros, sem fill, agregação, filtro SQL ou
mudança no contrato. Card próprio não é item duplicado da lista. Páginas apenas
com admins mostram contexto explícito, seus cards e links. Próxima/Primeira página
preservadas; não foi acrescentado histórico de cursores. Página realmente vazia
após exclusão ainda retorna à primeira, como antes.

## Modal — reprodução e causa

Reprodução controlada em Chromium real com Next/PG descartável: evento de foco
da janela entregue entre pointerdown e click de UMA interação real do mouse,
com resposta de sessão retida. Antes da correção: falha ao abrir o diálogo
(admin-modal-repro-visible.log, expect do diálogo). Depois:25/25 incluindo casos
SQL/ACL; mesmo clique abre alvo correto, foco Cancelar, zero DELETE.
Isso comprova a corrida reproduzida; não identifica o ambiente exato do relato
manual do usuário. Teste inicial inválido usava coordenada de botão fora da
viewport; corrigido por scrollIntoViewIfNeeded antes de comparar versões.

Causa: listener window.focus chamava check restritivo, que executava close e
ocultava sincronicamente a árvore privada durante a sequência de ponteiro.
A seleção já usa deleteTarget único para montar o diálogo; não havia necessidade
de segundo estado de abertura, atraso ou clique programático.
Correção: foco em contexto administrativo já visível/validado usa revalidação de
fundo. check continua restritivo se oculto/não validado, mantém prazo absoluto,
identidade, papel fresco, descartes geracionais, falhas fechadas e logout. Retorno
de visibilidade/pageshow continua restritivo; usuário comum permanece inalterado.
askDelete invalida checagem pendente antes de selecionar UUID e montar diálogo.
Polling válido preserva alvo/nome/e-mail selecionados; se UUID deixa a página ou
muda de papel, cancela a seleção com mensagem, sem selecionar outro usuário.
DELETE continua exclusivamente no caminho de confirmação; API intacta.
Duplo clique pode mover foco dentro do diálogo com a segunda interação nativa;
o teste exige um diálogo, foco contido e zero DELETE, sem forçar Cancelar de novo.
A matriz móvel revelou que o segundo clique podia atingir Cancelar no diálogo
recém-aberto. onClickCapture ignora event.detail>1 dentro do diálogo, impedindo
que a continuação do gesto acione Cancelar ou a confirmação. Ativações simples
e teclado (detail0) permanecem; sem timeout, atraso ou clique sintético no produto.

## Editor substitutivo e largura

Apenas admin: mesma seção e admin-profile-slot abrigam alternadamente article ou
ProfileForm, nunca os dois. h2 permanece Meu cadastro administrativo; h3 Editar
meu cadastro fica dentro do formulário. Isto mantém posição do início do card,
inclusive quando o título mais longo quebraria em duas linhas no celular.
Slot e ambos cards têm100% de largura/max-width none/margens iguais; nome,
endereço e mensagem amplos, pares restantes responsivos. Foco inicial no nome,
sem timeout; salvar/cancelar restauram botão e dados confirmados. A altura cresce
naturalmente para acomodar campos/validação, mantendo a lista abaixo; não se
promete altura constante ou imobilidade vertical durante foco/scroll nativo.
Rascunho independente de snapshot/polling; lista permanece o mesmo nó DOM.
Comportamento da edição de usuário comum preservado.

## Ajustes e falhas intermediárias

Primeira execução administrativa: asserção histórica contava artigos como itens
paginados. Agora101 apenas quando próprio está fora da resposta,100 quando já
está; ajustada sem mudar cursor. Uma UI falhou por expectativa da descrição antiga;
corrigida para texto novo. Corrida UI falhou procurando CTA antigo Acessar minha;
home anterior já não o contém, corrigido para link Minha área existente no header.
O histórico também dependia de profundidade fixa e terminava em about:blank; agora testa uma volta/avanço sem dados privados e acesso direto protegido, independente da profundidade. Nenhuma alteração da home. Primeiro teste de duplo clique exigia Cancelar focado
após a segunda interação; ajustado à contenção real do foco descrita acima.
Primeiro Harness complementar detectou espaço indevido em três links novos;
corrigido. Documentos de trabalho com acentos danificados pelo pipe PowerShell
foram regravados em UTF-8; fontes por patch preservaram Unicode.
Tentativa inicial via Python não executou (não instalado); sem edição parcial.

## Resultados finais

| Verificação local | Resultado final |
| --- | --- |
| Administrativo/exclusão UI |41/41, incluindo zoom real200%, mouse/toque/teclado, polling e alvo antigo |
| Perfil UI |34/34, inclui largura/posição, substituição, draft, cancelamento e save |
| UI completa |51/51, sem alterar capturas fora do escopo |
| Concorrência UI |58/58, abortos/gerações/logout/ocultação/histórico |
| HTTP/PostgreSQL |65/65, inclui autorização, perfil e exclusão |
| Harness doctor/validate/verify --product | Aprovados; produto62/62, lint e tipos incluídos |
| Build | Aprovado após a última alteração de produto |
| git diff --check | Aprovado |

Zero falhas/skips/cancelamentos finais. Detalhes estruturados em
[resultados](admin-profile-separation-results.json). Cada runner PostgreSQL confirmou
cleanup0 e metadados protegidos iguais; nenhuma conta persistente acessada.
Asserções comuns/zoom/interações sem erros inesperados de console/pageerror/hidratação.
A suíte de corridas contém um teste diferencial que INJETA deliberadamente uma
mutação estrangeira e espera1 aviso de hidratação; não é erro da aplicação normal.
Harness segue parcial/readiness:not-assessed, não é aprovação integral de produto.

Desktop/tablets retrato e paisagem/celulares320/390px, viewport reduzida e zoom real
Chromium200% executados. Inspeção visual das capturas06 desktop/mobile confirmada.
Somente quatro PNGs alterados:06 e10 desktop/mobile. Demais16 PNGs e três referências
iguais por SHA256, ver [manifesto](admin-profile-separation-hashes.json).

Produto alterado: app/globals.css; components/ui/Area.tsx, Record.tsx,
ProfileForm.tsx e DeleteUserDialog.tsx. Testes: tests/admin-delete/browser.mjs,
tests/profile/browser.mjs, tests/ui/browser.mjs e tests/ui/races.mjs. Documentos:
índice de prompts, arquitetura/requisitos, três prompts integrais, esta evidência,
resultados/hashes, galeria e memória do projeto. APIs/server/database/shared,
rodapé e dependências sem diff.

Diff exclusivo completo contra baseline inicialmente limpa (inclui novos documentos
e PNGs): C:/Users/thiag/AppData/Local/Temp/admin-profile-delivery-4y0Qqy/exclusive.diff.
Sem commit/push/deploy. Sugestão: refactor(admin): separa perfil administrativo da gestão de usuários.
Autorrevisão sequencial concluída; revisão humana e CI remoto pendentes.
