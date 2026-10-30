# Organização dos registros de prompts — 29/10/2026

Origem: [pedido integral](../../prompts/2026-10-29-organizacao-prompts.md#prompt-integral).
Execução: Codex, sessão principal; skill record-decision. Autorrevisão sequencial,
sem delegação; revisão humana pendente.

## Contrato e preservação

Escopo: índice, arquivos de prompts, orientações documentais pertinentes e memória
da reorganização. Sem alteração funcional, exclusão de histórico, Git mutável,
navegador, banco, build ou suítes funcionais. Um escritor: sessão principal.
Aceite: texto histórico intacto, destino único, links/âncoras válidos, índice
resumido e instruções coerentes. Execução delimitada à organização documental,
com correções somente diante de falha concreta; sem ciclos de revisão funcional.

Fontes conferidas: AGENTS.md, handoff/estado, índice integral, cinco arquivos de
prompts existentes, skill record-decision, contrato, política de contexto, guia,
workflows, definição de Documentação, rules e referências encontradas por busca.
Não foram encontrados templates específicos de registro de prompts ou instruções
locais adicionais em docs/, .agents/ ou .codex/. Rules são prefixos de execução e
não orientam a localização de prompts; foram preservadas.

Base: main, HEAD 4c5c6fc7986dccaf88887fa5b1587853fc10c6b1, árvore já alterada pela
entrega frontend. Snapshot documental e manifesto de hashes de 169 arquivos
anteriores, excluindo arquivos de ambiente sem ler seus valores:
`C:\Users\thiag\AppData\Local\Temp\prompt-organization-Ish7en`.
Status anterior, inventário e comparação sanitizados ficam nesse diretório.
Nenhuma alteração de implementação anterior foi revertida ou incorporada como
autoria desta reorganização.

## Inventário anterior e destinos

O índice tinha 24 registros de etapas: 17 blocos integrais somente no índice,
cinco referências a arquivos próprios e dois resumos sem texto integral.
Comparação dos 17 blocos com os cinco arquivos anteriores não encontrou cópia
integral idêntica. Os registros REG-001/REG-001-E1 e as etapas DB/UI são pedidos
distintos, preservados nas respectivas seções. As continuações curtas `Continue !`
e `Continue` permanecem com suas etapas; não geraram arquivos separados.

| Registros anteriores | Arquivo em docs/prompts/ | Tratamento |
| --- | --- | --- |
| Prompts 1–4 | [2026-10-28-estabilizacao.md](../../prompts/2026-10-28-estabilizacao.md) | Novo; dois textos integrais e dois resumos |
| Prompt 5 | [2026-10-28-harness.md](../../prompts/2026-10-28-harness.md) | Reutilizado; registro/resultados acrescentados |
| Prompt 6 | [2026-10-28-harness-corrections.md](../../prompts/2026-10-28-harness-corrections.md) | Reutilizado; registro/resultados acrescentados |
| Prompts 7–8 | [2026-10-28-revisoes-documentais-harness.md](../../prompts/2026-10-28-revisoes-documentais-harness.md) | Novo; dois pedidos documentais relacionados |
| Prompt 9 | [2026-10-29-especialistas.md](../../prompts/2026-10-29-especialistas.md) | Novo |
| Prompt 10 | [2026-10-29-harness-six-findings.md](../../prompts/2026-10-29-harness-six-findings.md) | Reutilizado; reprodução/fechamento acrescentados |
| Prompts 11–15, DB-001/D2/M1/I1/P1 | [2026-10-29-database.md](../../prompts/2026-10-29-database.md) | Reutilizado; quatro continuações e registros acrescentados |
| REG-001 e REG-001-E1 | [2026-10-29-registration.md](../../prompts/2026-10-29-registration.md) | Reutilizado; correção E1 e registros acrescentados |
| AUTH-001 | [2026-10-29-authentication.md](../../prompts/2026-10-29-authentication.md) | Novo |
| AUTHZ-001 | [2026-10-29-authorization.md](../../prompts/2026-10-29-authorization.md) | Novo |
| UI-001 e UI-001-P1 | [2026-10-29-ui.md](../../prompts/2026-10-29-ui.md) | Novo; principal, continuação e correção juntos |
| Organização frontend e pastas visuais | [2026-10-29-organizacao-frontend.md](../../prompts/2026-10-29-organizacao-frontend.md) | Novo; duas etapas relacionadas |
| Campos cadastro/login | [2026-10-29-campos.md](../../prompts/2026-10-29-campos.md) | Novo; pedido e continuação |
| Este pedido | [2026-10-29-organizacao-prompts.md](../../prompts/2026-10-29-organizacao-prompts.md) | Novo; texto integral recebido |

Total: cinco arquivos reutilizados, nove novos; 25 entradas atuais no índice.
O Prompt 1 continua sem data; o nome do arquivo da estabilização usa a data
registrada dos Prompts 2–4, sem atribuí-la ao diagnóstico anterior. Prompts 1 e 4
continuam identificados como resumos; textos ausentes não foram reconstruídos.

## Orientações ativas

A skill record-decision permitia texto integral no índice ou em docs/prompts/;
a política de contexto dizia “prompt integral uma vez no log”. Foram corrigidas
para fonte integral em docs/prompts/, resumo/link no índice e evidências detalhadas
em docs/harness/evidence/. O mesmo padrão foi explicitado no guia HARNESS e nas
instruções do especialista Documentação. Não foi alterada a frase histórica em
nenhum prompt. Não houve reformulação de workflows, roles ou mecanismos do Harness.

Os registros completos de resultados antes extensos no índice foram transferidos
para as etapas, com decisões, falhas, limites e revisão humana originais. Links
navegáveis fora dos textos integrais foram ajustados ao novo diretório. Títulos
anteriores do índice e suas âncoras foram mantidos, inclusive subtítulos de
resultados; estes agora remetem ao detalhe histórico. Evidências anteriores não
foram reescritas nem tratadas como novas execuções.

## Verificações e falhas intermediárias

Comparação com o snapshot confirmou 24 registros completos preservados, incluindo
resultados e limitações, após ajustar somente links navegáveis externos aos textos
integrais. Os 17 blocos integrais extraídos coincidem byte a byte com suas fontes
e cada um ocorre em um único arquivo principal. Os cinco arquivos reutilizados
mantêm todos os bytes anteriores como prefixo. As 82 implementações/recursos fora
do escopo documental no manifesto mantêm seus hashes. O índice não tem blocos
integrais de prompt.

Falhas intermediárias: Python indisponível, substituído por Node sem instalação;
primeira contagem de seções esperava 25 em vez de 24 e interrompeu antes de escrever;
contagem corrigida. O primeiro validate encontrou o link para esta evidência ainda
em elaboração; o arquivo foi criado antes da validação final. Nenhuma dessas
falhas exigiu alteração funcional ou dos textos históricos.

Doctor aprovado, código 0. Validação final de links, âncoras, UTF-8, Markdown,
validador documental e git diff --check aprovados. Conferência adicional encontrou
30 títulos/âncoras anteriores do índice preservados, 70 arquivos Markdown em
UTF-8 estrito e cercas balanceadas nos documentos desta rodada. Links/âncoras foram
conferidos fora dos prompts históricos imutáveis; todos os 25 destinos de etapas
do índice são válidos. O validador existente confere caminhos, mas não âncoras;
a conferência temporária complementar cobre os fragmentos. Nenhuma nova ferramenta
permanente ou dependência foi adicionada. Avisos de futura conversão LF/CRLF do
Git não foram erros; os textos integrais extraídos mantêm os bytes da fonte.
`verify` não executado: agrega suíte do Harness, probe, lint/typecheck; o pedido
atual limita a rodada a verificações documentais. Testes funcionais, navegador,
PostgreSQL, build, audit e CI remoto não executados nesta reorganização. Resultados
históricos preservados não são novas aprovações. Revisão humana pendente.

## Diffs

Diff exclusivo contra o snapshot anterior, incluindo arquivos novos:
`C:\Users\thiag\AppData\Local\Temp\prompt-organization.diff`.
Diff acumulado da entrega existente atualizado contra HEAD:
`C:\Users\thiag\AppData\Local\Temp\ui-001.diff`.
Sem alteração do index Git, commit, push ou publicação; nenhum segredo, dependência
instalada ou artefato de build incluído.

Conferência do diff exclusivo: 23 arquivos, todos documentais ou instruções de
documentação; nenhum arquivo anterior removido. Os dois patches passaram por
`git apply --reverse --check`, sem aplicação efetiva, confirmando correspondência
com a árvore final e inclusão dos arquivos novos. O acumulado anterior foi
preservado no snapshot como ui-001-before.diff antes da atualização.

## Commit documental separado — 29/10/2026

Origem: [pedido de commit exclusivo](../../prompts/2026-10-29-organizacao-prompts.md#pedido-de-commit-exclusivo--29102026).
Este pedido posterior autoriza o commit documental e supera a restrição de não
criar commit da rodada anterior. As seções anteriores descrevem aquela rodada e
suas verificações locais; suas contagens não representam o conteúdo deste commit.

Contrato: sessão principal, skill record-decision, autorrevisão sequencial, sem
delegação. Um escritor; somente índice/prompts, quatro orientações documentais e
esta evidência. Aceite: árvore preparada autossuficiente, nenhuma implementação UI,
nenhuma dependência de arquivo/âncora disponível apenas no diretório de trabalho.
Sem navegador, banco, build ou suítes funcionais; sem push ou alteração de commits
anteriores. Identidade Git já configurada, sem modificá-la.

Git inicial: main/4c5c6fc7986dccaf88887fa5b1587853fc10c6b1, índice vazio.
Nenhuma alteração anteriormente preparada precisou ser removida ou reconstruída.
Snapshot de status, hashes e três documentos compartilhados antes da atualização:
`C:\Users\thiag\AppData\Local\Temp\prompt-commit-CNOpUY`.
Arquivos de ambiente excluídos da coleta, sem leitura de valores.

Preparação: 17 arquivos documentais/instruções. O índice preparado reúne 19
registros anteriores à UI e os dois pedidos desta reorganização. Os cinco registros
UI-001/UI-001-P1, organização frontend/pastas e campos continuam no índice do
diretório de trabalho. Os três arquivos de prompts correspondentes e todas as
evidências UI ficam para o commit futuro; nenhuma memória, arquitetura, requisitos,
SOLUTION, componente, estilo, teste, captura, fonte, marca ou dependência da UI é
incluída. A tabela histórica acima descreve o inventário local da reorganização;
os destinos reservados à UI não integram esta árvore preparada.

Verificações desta separação: doctor e validate no diretório de trabalho aprovados;
validate também aprovado sobre a árvore exata do índice Git, exportada para
diretório temporário sem arquivos pendentes da UI. Conferência complementar: 59
arquivos Markdown em UTF-8, 304 links locais e 65 fragmentos válidos, cercas
balanceadas, 24 títulos anteriores do índice preservados. Os 19 registros de HEAD
foram comparados integralmente aos destinos, ajustando somente links fora dos
prompts; os 12 blocos integrais extraídos de HEAD permanecem byte a byte iguais
nos blobs preparados, sem cópia integral no índice.

O diff preparado foi revisado pela lista explícita de 17 caminhos, pelas quatro
mudanças de orientação e pela comparação dos registros transferidos. Nenhum
arquivo de implementação ou documentação funcional UI está preparado.
git diff --cached --check aprovado. Hashes de 176 arquivos anteriores fora dos três
documentos atualizados nesta tarefa permaneceram iguais, incluindo todas as
alterações e recursos UI. Os três documentos atualizados foram o índice, o arquivo
de prompts desta organização e esta evidência; o conteúdo UI anterior foi
preservado neles. Textos históricos não foram atualizados retroativamente.

Na primeira conferência complementar, a exportação do Git converteu LF para CRLF
e a comparação de títulos acusou diferença de terminação de linha. A comparação
literal de prompts passou a usar diretamente os blobs do índice Git; a conferência
de títulos/links normaliza somente a terminação na cópia temporária. Não houve
alteração dos textos para contornar a checagem. Ausência esperada de arquivos novos
em HEAD foi tratada como tal, sem adicionar dependências à árvore preparada.

Verificações limitadas a documentação/Git. `verify`, navegador, banco, build e
suítes funcionais não executados. Revisão humana do produto permanece pendente.
