# Log de prompts de AI

`docs/prompts/` é a fonte principal dos textos integrais, por data e assunto.
Este índice cronológico reúne objetivo, link, resultado e limitações. Evidências
detalhadas, verificações, falhas e correções ficam em `docs/harness/evidence/`.
Resumos históricos sem texto integral ou data continuam identificados como tais;
nenhum texto ou data ausente foi reconstruído.

## Ferramentas usadas

Codex: leitura local, consulta à documentação oficial e ao registro npm,
edição dos arquivos de tooling/documentação e execução das verificações locais.
Este registro descreve a avaliação do agente; não registra aprovação humana.

## Prompt 1 — diagnóstico anterior

- Objetivo: Diagnosticar dependências e tooling sem modificar arquivos.
- Registro: [resumo histórico e resultado](prompts/2026-10-28-estabilizacao.md#registro-1).
- Resultado: Identificados next lint removido e incompatibilidade de ESLint; typecheck/build passaram.
- Limitações/revisão: Somente resumo; data ausente na fonte. O agente gerou artefatos e alterou next-env.d.ts apesar da restrição. Autorização posterior para correção não equivale à revisão final.

## Prompt 2 — migração do lint (28/10/2026)

- Objetivo: Migrar lint preservando Next 16.4.3 e React.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-estabilizacao.md#registro-2).
- Resultado: ESLint 9.39.5/flat config; erro no efeito de Hello corrigido. Instalação, lint, typecheck, build e audit passaram.
- Limitações/revisão: ESLint 9/React 18 depreciados; extraneous não investigados, teste placeholder, navegador e CI remoto não executados; revisão humana pendente.

## Prompt 3 — preparação do clone para entrega (28/10/2026)

- Objetivo: Preparar o clone com transferência seletiva da estabilização.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-estabilizacao.md#registro-3).
- Resultado: Arquivos autorizados transferidos, ignore ajustado e origin base removido; verificações locais passaram.
- Limitações/revisão: tsconfig restaurado após alteração automática do build; sem browser/CI remoto, testes placeholder; revisão humana pendente.

## Prompt 4 — primeiro commit de estabilização (28/10/2026)

- Objetivo: Revisar a estabilização e criar o primeiro commit autorizado.
- Registro: [resumo histórico e resultado](prompts/2026-10-28-estabilizacao.md#registro-4).
- Resultado: Ajustes Next em tsconfig aceitos; segunda rodada lint/typecheck/build estável e diff revisado.
- Limitações/revisão: Somente resumo do pedido; audit/ci anteriores não repetidos, browser não exercitado. Autorização de commit não equivale à revisão humana, ainda pendente.

## Prompt 5 — Harness V2 (28/10/2026)

- Objetivo: Construir o Harness V2 sem implementar produto.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-harness.md#registro-5).
- Resultado: AGENTS, especialistas, skills, workflows, scripts e memória construídos; descoberta local observada.
- Limitações/revisão: Hooks reais, seleção nativa e retomada limpa não demonstrados; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/demo.md), [inventário](harness/evidence/final-state.md).

### Resultado do Prompt 5

[Resultado histórico completo](prompts/2026-10-28-harness.md#registro-5); resumo acima.

## Prompt 6 — Correção dos cinco achados do Harness (28/10/2026)

- Objetivo: Corrigir cinco achados do Harness (H-002).
- Registro: [prompt e registro da etapa](prompts/2026-10-28-harness-corrections.md#registro-6).
- Resultado: Checkpoint, probe, hooks, fixture e prova de testes corrigidos; 12 testes direcionados e verificações passaram.
- Limitações/revisão: Falha inicial de link corrigida; verify --product=1 esperado pelo placeholder. Hook/seleção nativa/retomada limpa e revisão humana pendentes.
- Evidências: [detalhes](harness/evidence/corrections.md).

### Resultados e avaliação crítica do Prompt 6

[Resultado histórico completo](prompts/2026-10-28-harness-corrections.md#registro-6); resumo acima.

## Prompt 7 — revisão humana pontual de docs/HARNESS.md (28/10/2026)

- Objetivo: Esclarecer componentes e limites da demonstração em HARNESS.md.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-revisoes-documentais-harness.md#registro-7).
- Resultado: Papéis/instâncias, retomada e timeout esclarecidos; validação documental passou.
- Limitações/revisão: Escapes não reproduzidos; revisão do texto compartilhado não conclui revisão humana integral.
- Evidências: [detalhes](harness/BUILD_LOG.md#h-003--revisão-humana-pontual-do-guia-28102026).

## Prompt 8 — prevenção de instruções desatualizadas em AGENTS.md (28/10/2026)

- Objetivo: Prevenir instruções temporárias desatualizadas em AGENTS.md.
- Registro: [prompt e registro da etapa](prompts/2026-10-28-revisoes-documentais-harness.md#registro-8).
- Resultado: Escopo vinculado ao pedido/fase e testes conferidos pelo estado real; validação passou.
- Limitações/revisão: Ajuste preventivo sem falha de execução alegada; produto não autorizado; revisão humana integral e especialistas pendentes à época.
- Evidências: [detalhes](harness/BUILD_LOG.md).

## Prompt 9 — revisão das instruções dos quatro especialistas (29/10/2026)

- Objetivo: Ajustar escopo e contexto seletivo dos quatro especialistas.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-especialistas.md#registro-9).
- Resultado: Quatro TOML atualizados; validação estrutural/configuração e reconhecimento de metadados observados.
- Limitações/revisão: Tentativa strict debug falhou; parser não prova aplicação em instâncias. Hooks/seleção nativa/retomada limpa e revisão humana pendentes.
- Evidências: [detalhes](harness/BUILD_LOG.md).

## Prompt 10 — seis achados consolidados dos scripts (29/10/2026)

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

- Objetivo: Preparar persistência DB-001 no PostgreSQL local.
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-11).
- Resultado: SQL/migrations e papéis mínimos preparados; 4 testes offline e checks locais passaram.
- Limitações/revisão: Restrição de destino cancelou cluster efêmero; preflight recusado não prova PostgreSQL. Execução real e revisão humana pendentes nessa etapa.
- Evidências: [detalhes](harness/evidence/database.md).

## Prompt 12 — DB-001-D2: correção de identidade e provisionamento (29/10/2026)

- Objetivo: Corrigir identidade e provisionar uma vez (DB-001-D2).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-12).
- Resultado: host(inet) e igualdade exata; 12 testes controlados, lint/typecheck e preflight real aprovados; papéis/schemas criados.
- Limitações/revisão: Sem migrations, integração descartável ou prova de privilégios das tabelas/runtime; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-d2--contrato-da-correção-autorizada-29102026).

## Prompt 13 — DB-001-M1: registrar execução manual (29/10/2026)

- Objetivo: Registrar execução manual informada (DB-001-M1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-13).
- Resultado: Relato de inspect/migrate/grant/check preservado sem repetir comandos ou atribuí-los ao agente.
- Limitações/revisão: Integração descartável e comprovação integral de constraints/permissões permaneciam pendentes; sem confirmação independente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-m1--execução-manual-informada-pelo-usuário-29102026).

## Prompt 14 — DB-001-I1: executar integração descartável (29/10/2026)

- Objetivo: Executar integração descartável autorizada (DB-001-I1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-14).
- Resultado: Um teste PostgreSQL real aprovado, zero skips; limpeza e metadados protegidos confirmados.
- Limitações/revisão: Asserções específicas do runner não equivalem a validação exaustiva nem a testes de auth/API/UI.
- Evidências: [detalhes](harness/evidence/database.md#db-001-i1--integração-local-autorizada-29102026).

## Prompt 15 — DB-001-P1: detectar divergência de privilégios (29/10/2026)

- Objetivo: Detectar divergências de privilégios efetivos (DB-001-P1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-database.md#registro-15).
- Resultado: Reprodução anterior; checker ampliado, 16 offline/16 integração, db:check de leitura e checks locais passaram.
- Limitações/revisão: Falhas de restauração de grants e lacuna USAGE corrigidas. Sem auditoria exaustiva RLS/funções/TOCTOU ou autorização API; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/database.md#db-001-p1--contrato-de-detecção-de-divergência-de-privilégios-29102026).

# REG-001 — cadastro pela API, 29/10/2026

- Objetivo: Implementar cadastro público pela API (REG-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-registration.md#registro-16).
- Resultado: Argon2id, validação compartilhada, SQL e testes reais; dois P2 de e-mail corrigidos após revisão.
- Limitações/revisão: Troca de pacote nativo, inferência TypeScript, launcher Node e links intermediários registrados; sem sessões/UI/clima. CI-base relatado pelo usuário; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/registration.md).

## REG-001-E1 — prompt integral da correção, 29/10/2026

- Objetivo: Corrigir limites de comprimento de e-mail (REG-001-E1).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-registration.md#registro-17).
- Resultado: Dois exemplos reproduzidos; limites 64/63/254 adotados e probes HTTP separados da quota.
- Limitações/revisão: Lacuna nova, não coberta pela revisão anterior; sem DNS. Sem nova revisão independente ou CI; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/registration.md#reg-001-e1--comprimento-de-e-mail-29102026).

## AUTH-001 — login, sessão persistida e logout, 29/10/2026

- Objetivo: Implementar login, sessão persistida e logout (AUTH-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-authentication.md#registro-18).
- Resultado: Escopo API, TTL absoluto e testes descartáveis aceitos; resultados no plano/evidência.
- Limitações/revisão: Sem publicação; revisão humana pendente. Falhas e limites detalhados na evidência.
- Evidências: [detalhes](harness/evidence/authentication.md).

## AUTHZ-001 — autorização e consulta, 29/10/2026

- Objetivo: Implementar autorização e consulta (AUTHZ-001).
- Registro: [prompt e registro da etapa](prompts/2026-10-29-authorization.md#registro-19).
- Resultado: Consulta própria/admin, listagem paginada e promoção explícita preparada; falhas nas três fases ajustadas após revisão.
- Limitações/revisão: Testes descartáveis; revisão humana pendente.
- Evidências: [detalhes](harness/evidence/authorization.md).

## Organização dos registros de prompts — 29/10/2026

- Objetivo: Restabelecer arquivos por data/assunto e índice resumido para todo o histórico.
- Registro: [prompt integral e resultado](prompts/2026-10-29-organizacao-prompts.md#prompt-integral).
- Resultado: 24 registros anteriores reorganizados, cinco arquivos reutilizados e nove criados, incluindo este pedido; orientações documentais corrigidas.
- Limitações/revisão: Prompts 1 e 4 só possuíam resumos; Prompt 1 sem data. Sem reconstrução de texto ou data; revisão humana pendente.
- Evidências: [inventário, comparação e verificações](harness/evidence/prompt-organization.md).

## Commit exclusivo da reorganização de prompts — 29/10/2026

- Objetivo: Versionar somente a reorganização documental, separada da entrega UI-001.
- Registro: [pedido integral e separação](prompts/2026-10-29-organizacao-prompts.md#pedido-de-commit-exclusivo--29102026).
- Resultado: Preparação por trechos, com entradas e prompts dependentes da UI reservados no diretório de trabalho; orientações e histórico anterior à UI no commit documental.
- Limitações/revisão: Validação documental sobre a árvore preparada, sem testes funcionais; aprovação do commit não equivale à revisão humana da UI.
- Evidências: [escopo, dependências e verificações](harness/evidence/prompt-organization.md#commit-documental-separado--29102026).
