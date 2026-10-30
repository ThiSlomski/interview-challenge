# UI-001 — contrato, 29/10/2026

Base main/4c5c6fc7986dccaf88887fa5b1587853fc10c6b1 limpa; doctor aprovado.
Pedido atual autoriza UI integrada; restrições de fases anteriores são históricas.
Requisitos README 1,3,7.b,8,9,11,12,13.a/b,14–18. Clima 13.c/d excluído.

- Orquestrador: testes reais Next/PostgreSQL descartável/navegador, package/lock,
  testes UI, documentação compartilhada e consolidação; sem bancos remotos ou DML
  em imobilead. Pode carregar configuração somente via helpers sem expor valores.
- Frontend delegado: ganho concreto de implementação paralela enquanto o
  orquestrador prepara execução descartável. Dono exclusivo app/page.tsx,
  app/layout.tsx, app/globals.css, app/cadastro/**, app/login/**, app/area/**,
  components/ui/** e server/ui/**. Inclui integração servidor segura por serviços
  existentes, sem alterar contratos APIs/schema/grants/shared. Sem testes/docs/package.
- Revisão independente posterior: leitura do diff de interface e fronteiras de
  segurança/acessibilidade, nenhuma escrita. Ganho: detectar bypass/exposição e
  regressões com contexto separado. Até duas instâncias simultâneas, só raiz cria.
- Fontes: README integral, AGENTS, handoff/estado, shared/registration,
  server/auth, server/users e respectivas APIs. Contexto herdado declarado.
- Aceite: / entrada útil; /cadastro todos campos, validação compartilhada/erros
  acessíveis/resumo só memória; /login cookie HttpOnly e senha intacta;
  /area proteção servidor, projeção mínima/política existente/admin paginado;
  logout confirmado, expiração/revogação e navegação protegida; PT-BR responsivo.
- Verificações: testes existentes + navegador real com fixtures descartáveis,
  capturas sintéticas, lint/typecheck/build/audit/doctor/validate/verify --product,
  diff --check. Browser executado separadamente do adaptador Node do Harness.
- Tempo por subtask: 35 minutos, uma execução e até duas correções por hipótese;
  parar e relatar bloqueios concretos. Revisão humana permanece pendente.
- Retorno: papel/skills/arquivos/decisões/comandos/falhas/riscos/pendências.

Sem commit/push/publicação, clima, reset, verificação de e-mail ou novas permissões.

## Ajuste visual dos campos — 29/10/2026

Pedido atual autoriza pequena alteração compartilhada em app/globals.css para
inputs/textarea de cadastro/login, sem regras funcionais novas. Valores fornecidos
pelo usuário prevalecem sobre comentários de arquivos externos. Original local
ContactForm.module.css confirma gradiente90deg/amarelo suave/transparente58%.
Raiz é escritora única de CSS, testes UI pertinentes e documentação mínima
(AI_PROMPTS, ui.md e índice da galeria). Sem delegação por escopo pequeno;
skills deliver-requirement/record-decision, autorrevisão sequencial.
Aceite: fundo/borda/texto oficiais, campos retos, foco3px/offset3px sem deslocamento
ou corte; erro+foco distinguíveis, seleção/caret/autofill/desabilitado legíveis.
Preservar tamanhos/fonts/labels/tipografia/painéis,18 capturas/novepares e referências.
Verificar em Chromium real desktop/celular com fixture descartável existente;
sem teste que só espelhe declarações CSS, sem nova galeria. Lint/typecheck/validação
 documental/diff --check. Uma execução +até duas correções por hipótese, tempo30min.
Sem dependências, fontes/recursos externos, APIs/validação/auth/banco/clima/commit/push.

## Correção funcional React/console — 29/10/2026

Pedido atual interrompe ajuste visual. Base real HEAD80297ad com alterações UI e
organização documental anteriores preservadas em snapshot, sem commit/index.
Raiz escritora única: Area.tsx, testes UI/concorrência e monitor de console, docs
existentes/memória e novo prompt conforme convenção. Sem mudanças de CSS/galeria,
APIs, banco, permissões, SSR ou dependências. Autorrevisão sequencial; tarefa
restrita, sem delegação/novos escritores.
Aceite: reproduzir warning flushSync antes, remover flush de lifecycle mantendo
gate DOM síncrono independente de render antigo, gerações/aborto/contexto/TTL/
identidade/role/logout; monitorar console.warn/error e pageerror nos fluxos e races.
Buscar cz-shortcut-listen antes; comparar HTML/DOM em perfil Chromium limpo sem
extensões e injeção controlada anterior à hidratação, sem supressão/SSR desligado.
Verificações: regressão atual +concorrência existente +suíte UI, lint/typecheck,
validação documental/doctor/verify proporcionais e diff. Apenas fixtures PG locais
descartáveis já autorizadas; não ler usuários/mutar imobilead ou acessar remoto.
Tempo35min, uma execução+até duas correções por hipótese, sem revisão ilimitada.

Diagnóstico adicional: monitor capturou resource404 fora da API no Chromium
completo. Incluído no escopo metadata.icons do layout para reutilizar a marca
local existente, sem arquivo/dependência nova ou alteração de SSR. Teste confere
link do ícone e resposta200; não se ignora404 genérico para aprovar console.
