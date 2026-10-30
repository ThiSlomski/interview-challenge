# WEATHER-001 — contrato, 30/10/2026

- Requisitos: README 13, matriz 13.c/d; autorização pelo prompt integral
  [previsão](../../prompts/2026-10-30-weather.txt).
- Base: main/a640fa6733f9f263b12ea12164d71036dca391a0, árvore limpa.
- Responsável único: orquestrador, execução e autorrevisão sequenciais.
- Objetivo: previsão de amanhã no sucesso, REST no navegador, Open-Meteo sem
  chave, sem proxy, persistência ou alteração de contrato/auth/banco/admin/CI.
- Entradas: README integral, resumo React atual, Record, UI/capturas/testes,
  ARCHITECTURE, SOLUTION, headers/configuração e documentação oficial Open-Meteo.
- Escrita: módulo/tipos/testes de clima, componente novo, integração pontual no
  formulário, connect-src em next.config.mjs, runner UI/capturas apenas par03,
  documentação canônica, prompt/índice, memória versionada e evidência.
- Aceite: dados externos restritos à localização/coordenadas, validação de JSON,
  seleção determinística, segundo dia no fuso retornado, estados acessíveis,
  cancelamento/geração/retry, confirmação intacta e testes determinísticos.
- Verificação: unitários, browser, cadastro/UI canônicos quando compatíveis com
  autorização de fixture; lint/typecheck/build/documentos/links/UTF-8/Harness.
- Janela operacional: implementação e QA nesta sessão; uma execução e até duas
  correções por problema com hipótese nova. Sem revisões ilimitadas.
- Evidência final em [UI canônica](ui.md); revisão humana pendente.
- Esclarecimento do usuário: somente a fixture já prevista pode criar/remover
  recursos locais isolados usando TEST_ADMIN_DATABASE_URL em 127.0.0.1:5432,
  validando metadados principais antes/depois, cleanup inclusive na falha e sem
  logs de credenciais. imobilead, cadastros reais, persistentes e remotos intactos.
