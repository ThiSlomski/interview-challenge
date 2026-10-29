# H-006 — contrato e aceite prévios

29/10/2026 · origem: revisão estática dos arquivos compartilhados nesta conversa;
reprodução local somente nesta rodada. [Pedido integral](../../prompts/2026-10-29-harness-six-findings.md).
Baseline: main/f1b6f437756eb3c86c141986818c34bb720ab9c8, trabalho anterior preservado
por snapshot de hashes/bytes temporário. Revisão humana integral pendente.

Orquestrador: reproduzir antes de corrigir seis achados; dono exclusivo dos cinco
scripts autorizados e documentação diretamente ligada. IDs H006-1 checkpoint,
H006-2 escopo parcial, H006-3 diagnósticos, H006-4 limites RPC, H006-5 identidade,
H006-6 relatório de casos. Sem aplicação/dependências/CI/configuração/permissões,
commits, publicação ou turnos de modelo para testes controlados.

Aceite: testes vermelhos causais por achado, depois regressões positivas/negativas;
nenhum conteúdo recebido/stderr privado em diagnóstico. JSON real do CLI observado
apenas para conhecer seu formato: tools → spawn_agent → parameters.properties.agent_type,
type string e description com catálogo delimitado Available roles. Nenhum campo de
caminho de origem é fornecido nesse formato; formatos diferentes ficam não comprovados.

Tempo: até 120 minutos; uma execução + até duas correções por problema com hipótese
nova. Só o orquestrador delega; até dois especialistas simultâneos. Revisão R-H006
independente delimitada após implementação (ganho: segunda análise de limites e
prova), sem escrita/subdelegação; entrada mínima sem histórico, até 15 minutos e
até dois seguimentos por achado. Retorno por arquivo/linha, consequência e evidência.

Fechamento: suíte Harness, doctor/validate/verify, verify --product (placeholder
atual implica falha esperada), lint/typecheck/diff-check; resultados e falhas em
six-findings.md. Testes controlados não comprovam hooks reais, seleção nativa ou
retomada limpa; nenhuma conclusão de validação integral do Harness.
