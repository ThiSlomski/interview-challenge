# REG-001 — contrato e plano, 29/10/2026

Base: main, 835537da073c26c89ea546be73e41d1a41085472, árvore limpa.
CI desse commit aprovado conforme relato do usuário; integração local não é CI.

ID/requisitos: REG-001; README 1, POST de 2, servidor de 3, 14 e SEC-1/2/5.
Objetivo: POST /api/users, validação reutilizável independente de banco,
hash Argon2id conforme decisão DB-001, INSERT parametrizado, papel default user,
conflito UNIQUE real, respostas mínimas, limite de corpo/origem/abuso sem sessão.
Nome/e-mail/senha/confirmação obrigatórios; demais campos opcionais conforme
contrato DB-001 (text nullable, sem limites ou formatos brasileiros inventados).
Senha ASCII alfanumérica 8–35; nome string até 150 pontos de código,
sem mínimo adicional (string vazia aceita pelo contrato DB-001).
Limite operacional de corpo 16 KiB, documentado como proteção de transporte.

Escrita: orquestrador em todos os arquivos. Sem mudanças no schema, grants,
Harness ou CI previstas. Sem login/logout, cookies, promoção, telas ou clima.
Fontes: README integral, AGENTS, SOLUTION, requisitos, arquitetura DB-001,
server/db, migration e runner descartável existente.
Aceite: unitários, handler controlado, endpoint Next HTTP real e PostgreSQL
descartável com concorrência, hash verificável, sem vazamentos, limpeza comprovada;
lint/typecheck/build/audit, doctor/validate/verify --product e diff --check.
Uma execução e até duas correções por hipótese, janela operacional de 90 minutos.

Delegação: revisão Backend independente de leitura ao estabilizar o diff.
Ganho concreto: segunda avaliação de fronteiras, exposição e abuso sem compartilhar
escrita. Contrato: nenhuma escrita; README/arquitetura/plano, diff da API e testes;
pergunta aberta sobre falhas e lacunas de aceite. Contexto selecionado, uma instância,
até 15 minutos, uma análise e seguimento delimitado após correções. Orquestrador
consolida documentação após retorno. Revisão humana permanece pendente.

## REG-001-E1 — correção de comprimento, 29/10/2026

Requisito: README 1, e-mail único/validado; pedido específico do usuário.
Base HEAD permanece 835537d, mas os 23 arquivos pendentes da REG-001 foram
preservados em snapshot temporário antes de editar. Diff E1 deve comparar esse
snapshot, nunca HEAD, para excluir a implementação anterior.
Reprodução antes da correção: label de domínio com 64 bytes e parte local com
65 bytes retornaram ok:true. Descoberta desta rodada, não coberta pela revisão
anterior. Impacto: cadastro aceitava endereços fora dos limites SMTP/DNS.
Contrato atual: local <=64 bytes, cada label <=63, endereço normalizado <=254,
ASCII antes da normalização, mesmo INVALID_EMAIL, sem DNS/envio/prova de posse.
Fontes oficiais: RFC 5321 §4.5.3.1 e RFC 1035 §2.3.4, conferidas nesta execução.
Escrita única: orquestrador; shared/registration.mjs, testes de validação/fixture
HTTP e documentação de contrato/SOLUTION/arquitetura/evidência/estado/handoff/prompts.
Sem alteração em banco/grants/migrations/dependências/Harness/CI ou demais fluxos.
Plano: reproduzir, corrigir, testar fronteiras controladas e HTTP/PG reais,
executar verificações solicitadas, consolidar e gerar diff exclusivo.
Aceite: 64/63/254 aceitos, 65/64/255 rejeitados; HTTP 400/INVALID_INPUT/INVALID_EMAIL
sem entrada ecoada e sem linhas inseridas; válidos persistidos. Instância HTTP
separada para comprimentos, com orçamento próprio inalterado, evita confundir 400
com 429; cenário anterior de abuso preservado. Limpeza própria/catalogação exigida.
Tarefa delimitada na sessão principal, sem ganho concreto em delegação adicional;
autorrevisão sequencial, revisão humana pendente. Até 45 minutos, uma execução
e até duas correções com hipótese nova. Evidência: seção REG-001-E1 em registration.md.
