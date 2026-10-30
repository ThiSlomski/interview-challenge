# UI-001-P1 — contrato, 29/10/2026

Base HEAD4c5c6fc com alterações UI-001 anteriores preservadas em snapshot Temp
ui-001-p1-before-* (manifesto de caminhos/hashes, sem segredos/index/commit).
Pedido autoriza correção assíncrona e identidade Slomski, não clima.

- Raiz: Area.tsx e eventual módulo de operações, tests/ui/**, integração runner,
  docs/evidência/prompts/memória e diffs. Primeiro regressão determinística contra
  versão anterior; depois correção e mesma regressão. Um escritor por arquivo.
- Frontend delegado: ganho concreto de inspeção e implementação visual paralelas
  enquanto raiz reproduz/corrige corrida. Dono app/globals.css, app/layout.tsx,
  app/page.tsx, app/{cadastro,login,area}/page.tsx, components/ui/{RegistrationForm,
  LoginForm,Record,messages}.tsx/ts, public/brand/** e app/fonts/**. Não Area.tsx,
  não testes/package/docs compartilhados. Fontes/assets públicos autorizados.
- Revisão independente posterior: somente leitura da invalidação/recuperação e
  fronteiras, sem escrita. Até duas instâncias, somente raiz cria; contexto herdado.
- Aceite: operações antigas invalidadas após cada await e antes de efeitos;
  ocultar/pagehide/unmount/contexto/expiry/logout cancelam, retorno desbloqueia;
  identidade igual/visibilidade/permissão antes de revelar, prazo e recuperação.
  Regressões Chromium declarando respostas retidas/eventos sintéticos/controlados.
- Visual: inspecionar site oficial desktop/celular antes de editar, assets oficiais
  locais, tokens/fonts confirmados, rodapé/link requerido, skip-link sem sobreposição,
  TSX/CSS legíveis. Sem biblioteca visual ou mudanças Harness/CI/API/schema/grants.
- Verificação: testes anterior/posterior, Chromium completo/capturas/inspeção,
  npm test, HTTP/PG descartável, lint/typecheck/build/doctor/validate/verify --product,
  audit se dependências mudarem, diff --check e limpeza.
- Tempo: 35min por subtask, uma execução + duas correções por hipótese; mudar
  estratégia ou registrar bloqueio no limite. Revisão humana pendente.
- Retorno: skills/arquivos/decisões/fontes/comandos/resultados/falhas/limitações.

Sem leitura de dados pessoais/alteração em imobilead, bancos remotos, commit/push
ou publicação. Referência https://www.slomskisolutions.com.br, só leitura/assets.
