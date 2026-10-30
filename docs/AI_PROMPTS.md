# Log de prompts de AI

Registros ordenados pelo envio original, do mais antigo para o mais recente.
Os horários abaixo usam America/Sao_Paulo (-03:00) e provêm das mensagens
`response_item` com `role=user` das transcrições JSONL do Codex, inclusive os
envios de anexos. Cópias herdadas por especialistas não são novos acontecimentos.
A numeração histórica, os textos, os resultados e as âncoras foram preservados.

`docs/prompts/` é a fonte principal dos textos integrais, por data e assunto.
Este índice cronológico reúne objetivo, link, resultado e limitações. Evidências
detalhadas, verificações, falhas e correções ficam em `docs/harness/evidence/`.
Os originais dos prompts 1 e 4 foram recuperados em 30/10/2026 de mensagens reais
do Codex de 28/10/2026; origem, datas e hashes estão nos respectivos registros.
Os resumos históricos foram preservados; nenhum texto ou data foi reconstruído.

## Ferramentas usadas

Codex: leitura local, consulta à documentação oficial e ao registro npm,
edição dos arquivos de tooling/documentação e execução das verificações locais.
Este registro descreve a avaliação do agente; não registra aprovação humana.

## Prompt 1 — diagnóstico anterior

Envio comprovado: **28/10/2026 18:14:25.431 -03:00**; Codex, sessão `01a1845d-362b-7dd0-93cd-e549d9c6e800`, linha 12.

- Objetivo: Diagnosticar dependências e tooling sem modificar arquivos.
- Registro: [prompt integral recuperado, resumo e resultado](prompts/2026-10-28-estabilizacao.md#registro-1).
- Resultado: Identificados next lint removido e incompatibilidade de ESLint; typecheck/build passaram.
- Limitações/revisão: Original e data recuperados da transcrição real de 28/10/2026, preservando o resumo anterior. O agente gerou artefatos e alterou next-env.d.ts apesar da restrição. Autorização posterior para correção não equivale à revisão final.

## Prompt 2 — migração do lint (28/10/2026)

Envio comprovado: **28/10/2026 18:16:39.647 -03:00**; Codex, sessão `01a1845d-362b-7dd0-93cd-e549d9c6e800`, linha 57.

- Objetivo: Migrar lint preservando Next 16.4.3 e React.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-estabilizacao.md#registro-2).
- Resultado: ESLint 9.39.5/flat config; erro no efeito de Hello corrigido. Instalação, lint, typecheck, build e audit passaram.
- Limitações/revisão: ESLint 9/React 18 depreciados; extraneous não investigados, teste placeholder, navegador e CI remoto não executados; revisão humana pendente.

## Prompt 3 — preparação do clone para entrega (28/10/2026)

Envio comprovado: **28/10/2026 18:27:02.424 -03:00**; Codex, sessão `01a18468-ba4d-7a72-9f20-a35efeb0a699`, linha 12.

- Objetivo: Preparar o clone com transferência seletiva da estabilização.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-estabilizacao.md#registro-3).
- Resultado: Arquivos autorizados transferidos, ignore ajustado e origin base removido; verificações locais passaram.
- Limitações/revisão: tsconfig restaurado após alteração automática do build; sem browser/CI remoto, testes placeholder; revisão humana pendente.

## Prompt 4 — primeiro commit de estabilização (28/10/2026)

Envio comprovado: **28/10/2026 18:30:52.924 -03:00**; Codex, sessão `01a18468-ba4d-7a72-9f20-a35efeb0a699`, linha 80.

- Objetivo: Revisar a estabilização e criar o primeiro commit autorizado.
- Registro: [prompt integral recuperado, resumo e resultado](prompts/2026-10-28-estabilizacao.md#registro-4).
- Resultado: Ajustes Next em tsconfig aceitos; segunda rodada lint/typecheck/build estável e diff revisado.
- Limitações/revisão: Original recuperado da transcrição real de 28/10/2026, preservando o resumo anterior; audit/ci anteriores não repetidos, browser não exercitado. Autorização de commit não equivale à revisão humana, ainda pendente.

## Prompt 5 — Harness V2 (28/10/2026)

Envio comprovado: **28/10/2026 19:49:44.955 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 16.

- Objetivo: Construir o Harness V2 sem implementar produto.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-harness.md#registro-5).
- Resultado: AGENTS, especialistas, skills, workflows, scripts e memória construídos; descoberta local observada.
- Limitações/revisão: Hooks reais, seleção nativa e retomada limpa não demonstrados; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/demo.md), [inventário](harness/evidence/final-state.md).

### Resultado do Prompt 5

[Resultado histórico completo](prompts/2026-10-28-harness.md#registro-5); resumo acima.

## Prompt 6 — Correção dos cinco achados do Harness (28/10/2026)

Envio comprovado: **28/10/2026 20:17:00.164 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 401.

- Objetivo: Corrigir cinco achados do Harness (H-002).
- Registro: [prompt e registro da etapa](prompts/2026-10-28-harness-corrections.md#registro-6).
- Resultado: Checkpoint, probe, hooks, fixture e prova de testes corrigidos; 12 testes direcionados e verificações passaram.
- Limitações/revisão: Falha inicial de link corrigida; verify --product=1 esperado pelo placeholder. Hook/seleção nativa/retomada limpa e revisão humana pendentes.
- Evidências: [detalhes](harness/evidence/corrections.md).

### Resultados e avaliação crítica do Prompt 6

[Resultado histórico completo](prompts/2026-10-28-harness-corrections.md#registro-6); resumo acima.

## Prompt 7 — revisão humana pontual de docs/HARNESS.md (28/10/2026)

Envio comprovado: **28/10/2026 20:46:55.873 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 567.

- Objetivo: Esclarecer componentes e limites da demonstração em HARNESS.md.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-revisoes-documentais-harness.md#registro-7).
- Resultado: Papéis/instâncias, retomada e timeout esclarecidos; validação documental passou.
- Limitações/revisão: Escapes não reproduzidos; revisão do texto compartilhado não conclui revisão humana integral.
- Evidências: [detalhes](harness/BUILD_LOG.md#h-003--revisão-humana-pontual-do-guia-28102026).

## Prompt 8 — prevenção de instruções desatualizadas em AGENTS.md (28/10/2026)

Envio comprovado: **28/10/2026 20:52:39.137 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 629.

- Objetivo: Prevenir instruções temporárias desatualizadas em AGENTS.md.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-revisoes-documentais-harness.md#registro-8).
- Resultado: Escopo vinculado ao pedido/fase e testes conferidos pelo estado real; validação passou.
- Limitações/revisão: Ajuste preventivo sem falha de execução alegada; produto não autorizado; revisão humana integral e especialistas pendentes à época.
- Evidências: [detalhes](harness/BUILD_LOG.md).

## Prompt 9 — revisão das instruções dos quatro especialistas (29/10/2026)

Envio comprovado: **29/10/2026 09:29:31.995 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 660.

- Objetivo: Ajustar escopo e contexto seletivo dos quatro especialistas.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-especialistas.md#registro-9).
- Resultado: Quatro TOML atualizados; validação estrutural/configuração e reconhecimento de metadados observados.
- Limitações/revisão: Tentativa strict debug falhou; parser não prova aplicação em instâncias. Hooks/seleção nativa/retomada limpa e revisão humana pendentes.
- Evidências: [detalhes](harness/BUILD_LOG.md).

## Prompt 10 — seis achados consolidados dos scripts (29/10/2026)

Envio comprovado: **29/10/2026 10:02:27.749 -03:00**; Codex, sessão `01a184b3-fea3-74c0-9d43-8677419a6894`, linha 729.

- Objetivo: Reproduzir e corrigir seis achados dos scripts (H-006).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-harness-six-findings.md#registro-10).
- Resultado: Seis reproduções vermelhas; 27 testes finais passaram, assim como doctor/validate/verify/lint/typecheck.
- Limitações/revisão: Falhas intermediárias de reporter, execpolicy e cleanup corrigidas; --product=1 por placeholder. Sem build ou prova de produto; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/six-findings.md), [inventário](harness/evidence/six-findings-final-state.md).

### Reprodução e correções do Prompt 10

[Resultado histórico completo](prompts/2026-10-29-harness-six-findings.md#registro-10); resumo acima.

### Fechamento do Prompt 10

[Resultado histórico completo](prompts/2026-10-29-harness-six-findings.md#registro-10); resumo acima.

## Prompt 11 — DB-001: etapa de banco Imobilead (29/10/2026)

Envio comprovado: **29/10/2026 11:37:11.275 -03:00**; Codex, sessão `01a18817-e055-77a1-9eaf-e1d9e310dbdc`, linha 16.

- Objetivo: Preparar persistência DB-001 no PostgreSQL local.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-11).
- Resultado: SQL/migrations e papéis mínimos preparados; 4 testes offline e checks locais passaram.
- Limitações/revisão: Restrição de destino cancelou cluster efêmero; preflight recusado não prova PostgreSQL. Execução real e revisão humana pendentes nessa etapa.
- Evidências: [detalhes](harness/evidence/database.md).

## Prompt 12 — DB-001-D2: correção de identidade e provisionamento (29/10/2026)

Envio comprovado: **29/10/2026 12:42:37.425 -03:00**; Codex, sessão `01a18817-e055-77a1-9eaf-e1d9e310dbdc`, linha 598.

- Objetivo: Corrigir identidade e provisionar uma vez (DB-001-D2).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-12).
- Resultado: host(inet) e igualdade exata; 12 testes controlados, lint/typecheck e preflight real aprovados; papéis/schemas criados.
- Limitações/revisão: Sem migrations, integração descartável ou prova de privilégios das tabelas/runtime; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-d2--contrato-da-correção-autorizada-29102026).

## Prompt 13 — DB-001-M1: registrar execução manual (29/10/2026)

Envio comprovado: **29/10/2026 13:43:51.819 -03:00**; Codex, sessão `01a18817-e055-77a1-9eaf-e1d9e310dbdc`, linha 698.

- Objetivo: Registrar execução manual informada (DB-001-M1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-13).
- Resultado: Relato de inspect/migrate/grant/check preservado sem repetir comandos ou atribuí-los ao agente.
- Limitações/revisão: Integração descartável e comprovação integral de constraints/permissões permaneciam pendentes; sem confirmação independente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-m1--execução-manual-informada-pelo-usuário-29102026).

## Prompt 14 — DB-001-I1: executar integração descartável (29/10/2026)

Envio comprovado: **29/10/2026 14:02:30.094 -03:00**; Codex, sessão `01a18817-e055-77a1-9eaf-e1d9e310dbdc`, linha 740.

- Objetivo: Executar integração descartável autorizada (DB-001-I1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-14).
- Resultado: Um teste PostgreSQL real aprovado, zero skips; limpeza e metadados protegidos confirmados.
- Limitações/revisão: Asserções específicas do runner não equivalem a validação exaustiva nem a testes de auth/API/UI.
- Evidências: [detalhes](harness/evidence/database.md#db-001-i1--integração-local-autorizada-29102026).

## Prompt 15 — DB-001-P1: detectar divergência de privilégios (29/10/2026)

Envio comprovado: **29/10/2026 14:14:34.546 -03:00**; Codex, sessão `01a18817-e055-77a1-9eaf-e1d9e310dbdc`, linha 866.

- Objetivo: Detectar divergências de privilégios efetivos (DB-001-P1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-15).
- Resultado: Reprodução anterior; checker ampliado, 16 offline/16 integração, db:check de leitura e checks locais passaram.
- Limitações/revisão: Falhas de restauração de grants e lacuna USAGE corrigidas. Sem auditoria exaustiva RLS/funções/TOCTOU ou autorização API; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).

# REG-001 — cadastro pela API, 29/10/2026

Envio comprovado: **29/10/2026 14:36:43.413 -03:00**; Codex, sessão `01a188bc-3600-7083-90c1-4d50b3b9531f`, linha 16.

- Objetivo: Implementar cadastro público pela API (REG-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-registration.md#registro-16).
- Resultado: Argon2id, validação compartilhada, SQL e testes reais; dois P2 de e-mail corrigidos após revisão.
- Limitações/revisão: Troca de pacote nativo, inferência TypeScript, launcher Node e links intermediários registrados; sem sessões/UI/clima. CI-base relatado pelo usuário; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/registration.md).

## REG-001-E1 — prompt integral da correção, 29/10/2026

Envio comprovado: **29/10/2026 15:13:05.989 -03:00**; Codex, sessão `01a188bc-3600-7083-90c1-4d50b3b9531f`, linha 245.

- Objetivo: Corrigir limites de comprimento de e-mail (REG-001-E1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-registration.md#registro-17).
- Resultado: Dois exemplos reproduzidos; limites 64/63/254 adotados e probes HTTP separados da quota.
- Limitações/revisão: Lacuna nova, não coberta pela revisão anterior; sem DNS. Sem nova revisão independente ou CI; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026).

## AUTH-001 — login, sessão persistida e logout, 29/10/2026

Envio comprovado: **29/10/2026 16:33:44.554 -03:00**; Codex, sessão `01a18927-60f0-7180-b3d0-37ac41a64989`, linha 16.

- Objetivo: Implementar login, sessão persistida e logout (AUTH-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-authentication.md#registro-18).
- Resultado: Escopo API, TTL absoluto e testes descartáveis aceitos; resultados no plano/evidência.
- Limitações/revisão: Sem publicação; revisão humana pendente. Falhas e limites detalhados na evidência.
- Evidências: [detalhes](harness/evidence/authentication.md).

## AUTHZ-001 — autorização e consulta, 29/10/2026

Envio comprovado: **29/10/2026 17:08:48.466 -03:00**; Codex, sessão `01a18947-7c81-7ed1-8069-e9798048c145`, linha 16.

- Objetivo: Implementar autorização e consulta (AUTHZ-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-authorization.md#registro-19).
- Resultado: Consulta própria/admin, listagem paginada e promoção explícita preparada; falhas nas três fases ajustadas após revisão.
- Limitações/revisão: Testes descartáveis; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/authorization.md).

## UI-001 — interface integrada, 29/10/2026

Envio comprovado: **29/10/2026 17:25:50.239 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 16.

- Objetivo: Integrar interface às APIs (UI-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-ui.md#registro-20).
- Resultado: Cadastro/login/logout, SSR protegido e consulta própria/admin; revisão ajustou gate de snapshots, foco e fixtures.
- Limitações/revisão: Continuação preservada no arquivo da etapa; clima fora do escopo, revisão humana pendente.
- Evidências: [detalhes](harness/evidence/ui.md).

## UI-001-P1 — corrida e identidade, 29/10/2026

Envio comprovado: **29/10/2026 18:09:51.432 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 445.

- Objetivo: Corrigir corrida assíncrona e aplicar identidade oficial (UI-001-P1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-ui.md#registro-21).
- Resultado: Geração/aborto, identidade/permissão, deadline e recuperação; tokens/assets/fontes locais aplicados e regressões registradas.
- Limitações/revisão: Interceptações/controlados identificados na evidência; clima fora do escopo, revisão humana pendente.
- Evidências: [detalhes](harness/evidence/ui-p1.md).

## Organização da entrega frontend — 29/10/2026

Envio comprovado: **29/10/2026 19:12:15.010 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 719.

- Objetivo: Consolidar documentação e capturas da entrega frontend.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-organizacao-frontend.md#registro-22).
- Resultado: 9 antigas e 2 duplicatas retiradas, 4 renomeadas e 18 finais preservadas; ui.md como entrada e ui-p1.md como detalhe.
- Limitações/revisão: Organização não é nova aprovação funcional; autorrevisão sequencial e revisão humana pendente.
- Evidências: [detalhes](harness/evidence/ui-organization.md).

## Padronização das pastas visuais do frontend — 29/10/2026

Envio comprovado: **29/10/2026 19:29:52.359 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 841.

- Objetivo: Padronizar pastas visuais preservando o histórico P1.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-organizacao-frontend.md#registro-23).
- Resultado: Galeria em ui-captures e referências em ui-reference; caminhos ativos atualizados e prompts históricos preservados.
- Limitações/revisão: Escopo organizacional; identificadores históricos P1 mantidos. Verificações e limites na evidência.
- Evidências: [detalhes](harness/evidence/ui-organization.md#padronização-posterior-das-pastas-visuais--29102026).

## Campos de cadastro/login — 29/10/2026

Envio comprovado: **29/10/2026 20:03:24.877 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 928.

- Objetivo: Padronizar visual dos campos de cadastro/login.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-campos.md#registro-24).
- Resultado: CSS compartilhado, foco/geometry/autofill e capturas ajustados; gradiente original encontrado localmente.
- Limitações/revisão: Continuação preservada; autofill com preenchimento opaco de 14%, distinto do gradiente comum. Sem funcionalidades novas; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/ui.md#ajuste-visual-dos-campos--29102026).

## Organização dos registros de prompts — 29/10/2026

Envio comprovado: **29/10/2026 22:57:22.423 -03:00**; Codex, sessão `01a18a86-8fea-7351-aeea-5c385e380759`, linha 16.

- Objetivo: Restabelecer arquivos por data/assunto e índice resumido para todo o histórico.
- Registro: [prompt integral e resultado](prompts/2026-10-29-organizacao-prompts.md#prompt-integral).
- Resultado: 24 registros anteriores reorganizados, cinco arquivos reutilizados e nove criados, incluindo este pedido; orientações documentais corrigidas.
- Limitações/revisão: Prompts 1 e 4 só possuíam resumos; Prompt 1 sem data. Sem reconstrução de texto ou data; revisão humana pendente.
- Evidências: [inventário, comparação e verificações](harness/evidence/prompt-organization.md).

## Commit exclusivo da reorganização de prompts — 29/10/2026

Envio comprovado: **29/10/2026 23:09:33.272 -03:00**; Codex, sessão `01a18a86-8fea-7351-aeea-5c385e380759`, linha 141.

- Objetivo: Versionar somente a reorganização documental, separada da entrega UI-001.
- Registro: [pedido integral e separação](prompts/2026-10-29-organizacao-prompts.md#pedido-de-commit-exclusivo--29102026).
- Resultado: Preparação por trechos, com entradas e prompts dependentes da UI reservados no diretório de trabalho; orientações e histórico anterior à UI no commit documental.
- Limitações/revisão: Validação documental sobre a árvore preparada, sem testes funcionais; aprovação do commit não equivale à revisão humana da UI.
- Evidências: [escopo, dependências e verificações](harness/evidence/prompt-organization.md#commit-documental-separado--29102026).

## Correção funcional React e hidratação — 29/10/2026

Envio comprovado: **29/10/2026 23:16:46.312 -03:00**; Codex, sessão `01a18957-13db-7e21-b4c9-953d269ccdea`, linha 1077.

- Objetivo: Corrigir flushSync de lifecycle preservando a proteção da área; investigar atributo externo no body e detectar diagnósticos nos testes.
- Registro: [prompt integral](prompts/2026-10-29-react-console.md#prompt-integral).
- Resultado: Gate DOM síncrono separado da apresentação React; testes de console/pageerror, fluxo limpo e mutação controlada.
- Limitações/revisão: Sem identificação da extensão do usuário; revisão humana pendente. Ajuste visual pausado e histórico preservado.
- Evidências: [causas, verificações e diff](harness/evidence/ui.md#correção-funcional-react-e-hidratação--29102026).

## Revalidação periódica estável — 30/10/2026

Envio comprovado: **30/10/2026 00:00:47.914 -03:00**; Codex, sessão `01a18ac0-a5c9-77c2-a7dd-6d16aa56d2b4`, linha 16.

- Objetivo: Eliminar a oscilação na consulta periódica preservando as proteções da área.
- Registro: [prompt integral](prompts/2026-10-30-revalidacao-sessao.md#prompt-integral).
- Resultado: Modos restritivo e de fundo, conferência de respostas/identidade e regressões Chromium.
- Limitações/revisão: Autorrevisão sequencial; revisão humana pendente. Sem continuação visual, commit, push ou publicação.
- Evidências: [diagnóstico, garantias, testes e diffs](harness/evidence/ui.md#revalidação-periódica-estável--30102026).

## Refinamento administrativo — 30/10/2026

Envio comprovado: **30/10/2026 01:19:40.913 -03:00**; Codex, sessão `01a18b08-e535-7d80-93e7-503f3f6f44e1`, linha 16.

- Objetivo: distinguir user/admin em /area e eliminar duplicação visual, preservando segurança.
- Registro: [prompt integral](prompts/2026-10-30-area-administrativa.md).
- Resultado: cabeçalho administrativo, marcador próprio, paginação contextual e CEP visual; navegação raiz preservada pela arquitetura estática. Evidências/testes em [UI](harness/evidence/ui.md#refinamento-administrativo--30102026); revisão humana pendente.

## Previsão de amanhã WEATHER-001 — 30/10/2026

Envio comprovado: **30/10/2026 01:36:45.368 -03:00**; Codex, sessão `01a18b18-87a2-7492-b41a-a314cb43e064`, linha 16.

- Pedido aceito: implementar README13 com Open-Meteo client, privacidade, estados,
  CSP mínima, testes/capturas e documentação. [Prompt integral](prompts/2026-10-30-weather.txt).
- Esclarecimento aceito: suíte completa somente em fixture local descartável,
  TEST_ADMIN_DATABASE_URL/127.0.0.1:5432, metadados principais preservados e cleanup.
- Ferramenta: Codex; execução/autorrevisão sequenciais com skills locais de plano,
  entrega, verificação e registro. Sem agentes adicionais, commit/push/publicação.
- Resultado e ajustes: validação externa, seleção, cancelamento/retry e UI pontual;
  base não tinha CSP, por isso acrescentado somente connect-src. Lint apontou um
  aviso de cleanup/ref, corrigido sem desativar regra. [Evidência](harness/evidence/ui.md#weather-001--previsão-do-dia-seguinte-30102026).
- Limites: teste externo real e CI remoto não executados; revisão humana pendente.

### Revisão da configuração de clima — 30/10/2026

Envio comprovado: **30/10/2026 02:03:49.873 -03:00**; Codex, sessão `01a18b18-87a2-7492-b41a-a314cb43e064`, linha 283.

- Pedido aceito: conferir consumidores, remover configuração legada do exemplo e
  documentos, preservar sessão e restringir endpoints/CSP; sem commit/push.
- Resultado: apenas o exemplo ainda continha placeholders; nenhum consumidor ou
  validador dependia deles. Endpoints mantidos como constantes internas, sem chave
  ou variáveis públicas. [Registro e verificações](harness/evidence/ui.md#revisão-da-configuração-de-clima--30102026).
- A nomenclatura legada não é repetida na documentação para manter a busca
  solicitada sem ocorrências; este resumo registra a correção complementar.

### Refinamento visual do clima — 30/10/2026

Envio comprovado: **30/10/2026 02:14:21.560 -03:00**; Codex, sessão `01a18b18-87a2-7492-b41a-a314cb43e064`, linha 332.

- Pedido: SVGs locais derivados dos códigos WMO e remoção do aviso ambíguo do
  resumo, preservando persistência e integração. [Prompt integral](prompts/2026-10-30-weather-visual.txt).
- Resultado: WeatherIcon decorativo/estático, condição textual preservada,
  composição responsiva com tokens existentes e remoção somente do aviso.
- Testes, capturas, hashes e limites na [evidência UI](harness/evidence/ui.md#refinamento-visual-do-clima--30102026).
  Autorrevisão sequencial; revisão humana pendente, sem commit/push/publicação.

## Pipeline obrigatório DevSecOps — 30/10/2026

Envio comprovado: **30/10/2026 02:38:58.709 -03:00**; Codex, sessão `01a18b51-7e28-76a3-8f05-efde5f3565cd`, linha 16.

- Pedido aceito: três jobs bloqueantes, PostgreSQL descartável, SCA high,
  validações locais e documentação; sem commit/push. [Prompt integral](prompts/2026-10-30-devsecops-ci.txt).
- Ferramenta: Codex; skills locais de retomada/entrega/verificação/registro;
  execução e autorrevisão sequenciais. UI mantida local e CodeQL não adicionado,
  pelas decisões na arquitetura. [Resultados e limites](harness/evidence/ci.md).
- Fase2 e revisão humana pendentes; CI verde anterior não aprova este diff.

## PROFILE-001 — 30/10/2026

Envio comprovado: **30/10/2026 03:27:31.243 -03:00**; Codex, sessão `01a18b78-b43d-7702-a689-08f7957d4ff0`, linha 80.

[Pedido integral](prompts/2026-10-30-profile.md): plano ajustado e edição do
próprio cadastro. Codex aceitou o recorte exclusivo de perfil, reutilizou regras
do cadastro e versão integer/número, mantendo e-mail imutável. Descartou limites
novos e o mecanismo anterior de proteção administrativa; exclusão só planejada,
sem implementação/commit/push. [Evidência e avaliação crítica](harness/evidence/profile.md),
com resultados locais separados de CI/revisão humana.

## PROFILE-001-L1 — aplicação persistente local, 30/10/2026

Envio comprovado: **30/10/2026 03:43:10.700 -03:00**; Codex, sessão `01a18b78-b43d-7702-a689-08f7957d4ff0`, linha 347.

[Autorização integral](prompts/2026-10-30-profile.md#autorização-posterior-de-aplicação-persistente--texto-integral):
Codex executou apenas migration/grants/checks canônicos e restart. Destino
confirmado antes/depois; applied:1 e privilégios aprovados. Sem operação destrutiva
ou DML de cadastro pelo agente. Usuário digitou credenciais e confirmou os dois
papéis; agente conferiu respostas HTTP200. Conector browser indisponível,
sem inspeção visual independente. [Evidência](harness/evidence/profile.md#profile-001-l1--aplicação-persistente-local-autorizada).

## ADMIN-DELETE-001 — 30/10/2026

Envio comprovado: **30/10/2026 03:53:38.442 -03:00**; Codex, sessão `01a18b78-b43d-7702-a689-08f7957d4ff0`, linha 468.

[Pedido integral](prompts/2026-10-30-admin-delete.md): excluir somente user por
admin, com transação/cascade, concorrência, confirmação acessível e paginação.
Codex aceitou as exclusões de escopo e a separação entre implementação/fixtures
e aplicação persistente. Ajustou projeção admin para role e retirou DELETE direto
de sessions; não criou migration artificial. [Contrato](harness/evidence/admin-delete-plan.md),
[evidência e avaliação crítica](harness/evidence/admin-delete.md). Sem commit/push,
grants/exclusão no persistente; CI/revisão humana do diff não presumidos.

## ADMIN-DELETE-001-L1 — preparação persistente, 30/10/2026

Envio comprovado: **30/10/2026 04:12:31.453 -03:00**; Codex, sessão `01a18b78-b43d-7702-a689-08f7957d4ff0`, linha 732.

[Autorização integral](prompts/2026-10-30-admin-delete.md#autorização-posterior--preparação-do-banco-persistente):
Codex executou inspect/grant/check/inspect e restart no destino local autorizado.
Expôs a limitação de db:inspect e obteve autorização adicional para ACLs READ ONLY;
comparação confirmou só as duas mudanças DELETE, com grants por coluna preservados.
Sem exclusões/DML cadastral/migration/fixtures/commit/push.
[Evidência](harness/evidence/admin-delete.md#admin-delete-001-l1--preparação-persistente-autorizada).

## ADMIN-DELETE-UI-001 — contraste visual, 30/10/2026

Envio comprovado: **30/10/2026 04:22:11.797 -03:00**; Codex, sessão `01a18b78-b43d-7702-a689-08f7957d4ff0`, linha 839.

[Pedido integral](prompts/2026-10-30-admin-delete-visual.md): correção isolada dos
botões danger, sem mudança funcional. Codex reproduziu contraste1.05:1, corrigiu
cascata com paleta existente e validou cinco estados/mouse/teclado em desktop e
celular emulado. Capturas06 atualizadas, par10 incluído, demais16 PNGs/3 referências
preservados. [Evidência/cores/testes/hashes](harness/evidence/admin-delete-visual.md).
Sem commit/push; revisão humana pendente.

## Containerização DevSecOps — 30/10/2026

Envio comprovado: **30/10/2026 04:43:03.051 -03:00**; Codex, sessão `01a18bc3-15f8-7250-9a5c-94ae886f632a`, linha 16.

- [Prompt integral](prompts/2026-10-30-containerization.txt).
- Codex; skills resume-project, deliver-requirement, verify-delivery e record-decision;
  execução/autorrevisão sequenciais. Aceito namespace compartilhado para preservar
  guardas; acrescentado gateway TLS porque autenticação de produção exige HTTPS.
- Dockerfile/Compose/smoke/CI e documentação; erros de tmpfs, capability Caddy e
  expectativa de logout corrigidos sem alterar produto. [Evidência](harness/evidence/containerization.md).
  Sem commit/push/deploy; revisão humana e CI remoto pendentes.

## HOME-UI-001 — composição da página inicial, 30/10/2026

[Pedido integral](prompts/2026-10-30-home-refinement.txt): remover card redundante,
acrescentar painel informativo de três benefícios e corrigir responsividade/altura
mínima somente na home. Skills resume-project, deliver-requirement e
verify-delivery; um escritor, execução/autorrevisão sequenciais.
[Evidência e contrato](harness/evidence/home-refinement.md), com testes de
Chromium dev/produção, sessões descartáveis, capturas seletivas e hashes.
Nenhum fluxo funcional alterado; sem commit/push/deploy. Revisão humana pendente.

## HOME-UI-001-F1 — rodapé compartilhado, 30/10/2026

[Complemento integral](prompts/2026-10-30-home-footer-refinement.txt): incorporar
marca/slogan/copyright ao único rodapé do RootLayout e compartilhar o shell
vertical em todas as páginas. Mantém hero/painel da home e todos os fluxos.
Codex, um escritor, execução/autorrevisão sequenciais, skills de entrega e
verificação. [Contrato/evidência](harness/evidence/home-footer-refinement.md)
registra snapshot anterior, testes, capturas seletivas por hash e diffs incremental
e acumulado. Sem commit/push/deploy; revisão humana/CI remoto pendentes.

## ADMIN-UI-002 — refinamento administrativo, 30/10/2026

Perfil próprio independente, usuários comuns e outros administradores separados; edição no mesmo espaço e abertura da confirmação no primeiro clique. [Pedido integral](prompts/2026-10-30-admin-profile-separation.txt) e [evidência](harness/evidence/admin-profile-separation.md).

Complementos integrais: [modal no primeiro clique](prompts/2026-10-30-admin-profile-complement-1.txt) e [edição no mesmo cartão e largura](prompts/2026-10-30-admin-profile-complement-2.txt).

## PROFILE-UI-003 — edição compartilhada, 30/10/2026

Pedido complementar para compartilhar substituição e largura do cartão de perfil entre user/admin. [Pedido integral](prompts/2026-10-30-shared-profile-edit.txt) e [evidência](harness/evidence/shared-profile-edit.md).

## LOGIN-UI-001 — equilíbrio do login, 30/10/2026

Centralizar o conjunto de autenticação e equilibrar ações responsivas preservando contratos de segurança. [Pedido integral](prompts/2026-10-30-login-refinement.txt) e [evidência](harness/evidence/login-refinement.md).
# REG-UI-001 — refinamento visual do cadastro, 30/10/2026

Centralizar introdução e formulário em até920px, com grade responsiva e estados
preservados. [Pedido integral](prompts/2026-10-30-registration-refinement.txt) e
[evidência](harness/evidence/registration-refinement.md).
## REG-ESSENTIAL-001 — dados essenciais e Zod, 30/10/2026

Tornar nome/localização obrigatórios no cadastro/perfil e migrar validação manual
para schemas compartilhados com Zod direto. [Pedido campos](prompts/2026-10-30-required-profile-fields.txt),
[auditoria/migração Zod](prompts/2026-10-30-zod-validation-audit.txt),
[autorizações posteriores](prompts/2026-10-30-required-profile-fields-authorizations.txt)
e [evidência](harness/evidence/required-profile-fields.md).

## REG-SUCCESS-UI-001 — largura da conclusão, 30/10/2026

Reutilizar o contêiner do cadastro na conclusão e tratar o foco do título sem
remover acessibilidade. [Pedido integral](prompts/2026-10-30-registration-success-layout.txt)
e [evidência](harness/evidence/registration-success-layout.md).
