# PROFILE-UI-003 — edição compartilhada user/admin, 30/10/2026

## Contrato e estado inicial

Base main/e2c80e454633749d2875f4950f9ce575401a1fab, árvore limpa. O refinamento
administrativo anterior já está commitado pelo usuário; não repetir Git mutável.
Pedido atual autoriza estender a substituição do cartão ao usuário comum por
estrutura compartilhada. Orquestrador único escritor/autorrevisão sequencial;
skills deliver-requirement, verify-delivery e record-decision. Sem delegação.
Escrita: components/ui/Area.tsx, app/globals.css, testes de perfil/UI, capturas
04 realmente afetadas e documentação/evidência/memória do projeto. Sem APIs,
banco/migrations/grants, auth/autorização, polling/operações, modal ou rodapé.
Aceite: uma representação por perfil, largura/alinhamento iguais, salvar/cancelar,
rascunho, foco e responsividade para ambos papéis; admin/exclusão sem regressão.
Uma execução e até duas correções por hipótese, tempo operacional25min.
Revisão humana e CI remoto deste diff pendentes; sem commit/push/deploy.

## Inspeção e correção

Código anterior renderizava ProfileForm para user como irmão anterior à seção
somente leitura. O formulário mantinha form-card estreito, enquanto admin já
alternava editor/article dentro de um slot. O novo JSX da seção/slot e da
alternância é único para ambos os papéis; variam título, selo/classe de destaque
e apresentação da mensagem vazia. ProfileForm embedded é reutilizado sem alterar
validação, versão, ETag, estado de rascunho ou callbacks.
Regra comum profile-slot aplica100% de largura, max-width none e margem0 a ambos
os cartões; classe admin mantém apenas a borda amarela. Nome/endereço/mensagem
amplos e pares restantes responsivos, coluna única no celular.
Título h2 estável; h3 de edição dentro do formulário. Foco inicial existente no
nome e retorno ao botão mantidos. A altura acompanha naturalmente os campos;
não se promete altura fixa. Não há timeout, scroll manual ou clique sintético
no produto. Lista administrativa permanece fora do slot e não é remontada.

## Verificação

Matriz compartilhada de teste cobre user/admin em desktop, tablets retrato e
paisagem e celular, card ausente durante edição, mesma largura/x/posição do slot,
zero PATCH ao cancelar, dados confirmados, save único, rascunho após polling e
lista administrativa mantida no mesmo nó. Asserção histórica que exigia dd
visível durante edição foi substituída por ausência do article e retorno dos
dados atualizados após cancelar. Testes completos e resultados serão registrados.

[Pedido integral](../../prompts/2026-10-30-shared-profile-edit.txt), preservado da mensagem user da sessão atual.

## Resultados finais e limites

| Execução local | Resultado |
| --- | --- |
| npm run test:profile:ui |35/35; mesma matriz para user/admin |
| npm run test:ui |51/51; somente capturas04 atualizadas |
| npm run test:admin-delete:ui |41/41; clique único/toque/teclado/duplo clique/zero DELETE ao abrir |
| node --test tests/ui/race.test.mjs |58/58; gerações, ocultação, expiração, logout e histórico |
| Harness doctor → validate → verify --product | Aprovados;62/62 Node, lint e typecheck incluídos |
| npm run build | Aprovado |
| git diff --check | Aprovado |

Zero falhas/skips/cancelamentos finais nesta rodada. Todos os runners PostgreSQL
confirmaram cleanup0 e metadados protegidos iguais. Asserções de console/pageerror/
hidratação sem erros inesperados; suíte de corridas preserva o teste que injeta
um aviso de hidratação deliberado como controle, sem erro nas páginas normais.
Resultados em [JSON](shared-profile-edit-results.json). Harness continua parcial,
readiness:not-assessed. Testes são locais; revisão humana/CI remoto pendentes.

Capturas04 desktop/mobile inspecionadas visualmente e atualizadas; demais18 PNGs
mais três referências iguais por SHA256, ver [hashes](shared-profile-edit-hashes.json).
Não há mudança visual administrativa pretendida. O layout do formulário foi
verificado por medidas DOM para cada papel/viewport, não por imagem simulada.

Produto alterado somente em components/ui/Area.tsx e app/globals.css. Reuso do
ProfileForm existente, sem alteração nele ou no DeleteUserDialog. Testes alterados
em tests/profile/browser.mjs e tests/ui/browser.mjs. Documentação: índice de prompts,
arquitetura/requisitos, prompt integral, esta evidência, resultados/hashes, galeria
e memória do projeto. Nenhum diff de API/server/database/shared/auth/rodapé.

Diff exclusivo contra baseline limpa e2c80e4, incluindo arquivos novos e PNGs:
C:/Users/thiag/AppData/Local/Temp/shared-profile-delivery-1OQuW5/exclusive.diff.
Sem commit, push ou deploy. Autorrevisão sequencial; revisão humana pendente.
