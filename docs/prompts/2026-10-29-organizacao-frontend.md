# 2026-10-29-organizacao-frontend

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-22"></a>

## Organização da entrega frontend — 29/10/2026

Ferramenta: Codex. Pedido integral a seguir. Escopo documental/capturas, com
alterações anteriores preservadas em snapshot sem index/commit.

```text
Consolide a entrega do frontend UI-001 e UI-001-P1: remova capturas superadas/repetidas, organize as evidências finais e unifique a documentação operacional, preservando o histórico real.

Esta tarefa é de organização da entrega. Não implementar funcionalidades nem alterar autenticação, autorização, banco, clima ou identidade visual.

1. Preparação
- Leia AGENTS.md e os documentos UI-001/UI-001-P1.
- Confira Git e preserve alterações anteriores.
- Inventarie capturas, referências nos documentos e código que gera as imagens antes de remover qualquer arquivo.
- Restrinja remoções aos arquivos de evidência explicitamente identificados nesta tarefa. Sem limpeza ampla por prefixo.

2. Capturas finais
- Remova as nove capturas da primeira rodada em docs/harness/evidence/ui-captures/, após confirmar que os estados relevantes estão representados pelas capturas finais com identidade Slomski Solutions.
- Em ui-p1-captures/, compare as imagens antes de excluir duplicatas.
- Remova 05-area-mobile-desktop.png e 05-area-mobile-mobile.png se confirmada a repetição de 04-area-user-desktop.png e 04-area-user-mobile.png.
- Renomeie:
  08-login-mobile-desktop.png → 08-login-desktop.png
  08-login-mobile-mobile.png → 08-login-mobile.png
  09-cadastro-mobile-desktop.png → 09-cadastro-desktop.png
  09-cadastro-mobile-mobile.png → 09-cadastro-mobile.png
- Preserve os pares desktop/celular dos estados distintos: inicial normal, inicial com foco, cadastro vazio, erros, sucesso, área user, área admin, indisponibilidade e login.
- Não elimine diferenças funcionais só por semelhança visual.
- Preserve referências oficiais em ui-p1-reference/, identificadas como referência do site, separadas das capturas da aplicação.
- Não altere imagens para simular estados ou esconder defeitos.

A captura administrativa desktop atual termina próximo ao título da listagem. Se precisar substituí-la, ajuste o enquadramento para mostrar o título e pelo menos um registro sintético, evitando capturar a página inteira com 100 cadastros. Use apenas a fixture descartável autorizada.

3. Geradores e índice
- Atualize os testes/scripts que produzem capturas para gerar somente os nomes finais.
- Remova a geração redundante; uma nova execução não deve recriar os arquivos excluídos.
- Preserve asserções e cenários de teste: eliminar captura duplicada não autoriza remover teste.
- Atualize o README da pasta com a lista final e links corretos.
- Use texto: “Dados sintéticos. Desktop: 1280 × 900; celular: 390 × 844”, ajustando somente se as dimensões reais forem outras.
- Inclua descrição breve do estado de cada captura.

4. Documentação unificada
Adote docs/harness/evidence/ui.md como entrada principal da entrega frontend:
- Escopo final e rotas: /, /cadastro, /login e /area.
- Como o frontend foi implementado e integrado às APIs.
- Validação compartilhada, resumo somente em memória, proteção no servidor, consulta própria/admin e logout.
- Identidade Slomski Solutions e link no rodapé.
- Problema assíncrono encontrado em Area.tsx, reprodução, correção e regressões efetivamente executadas.
- Resultados finais por tipo de verificação, com contagens sem dupla contabilização.
- Links para o índice das capturas finais.
- Limitações e requisitos ainda pendentes.

Unificar não significa apagar o histórico:
- Preserve planos, prompts integrais, falhas intermediárias e registros de correção.
- Mantenha ui-p1.md como detalhe histórico/técnico da correção, ligado à entrada principal, evitando repetir o relatório final inteiro.
- Identifique resultados antigos como históricos; não os apresente como execução do estado atual.
- Onde existiam links para capturas removidas, direcione para a captura final equivalente e deixe claro que ela mostra o estado final.
- Não faça parecer que a versão inicial já tinha a identidade ou as correções posteriores.
- Se algum documento for movido ou consolidado, reconcilie todas as referências antes de removê-lo.

Em SOLUTION.md, mantenha um único roteiro vigente e direto para avaliar o frontend:
1. Preparar o ambiente e executar a aplicação conforme os pré-requisitos existentes.
2. Abrir a inicial e cadastrar.
3. Conferir o resumo sem senha e entrar.
4. Consultar a própria área.
5. Avaliar a listagem com administrador provisionado pelo procedimento documentado.
6. Sair e conferir bloqueio da área.
7. Executar os testes pertinentes.

Não introduza conta/senha padrão nem promova usuários nesta tarefa. Preserve as instruções de ambiente e banco existentes.

Atualize arquitetura, requisitos, estado, handoff e índice de memória somente onde necessário para apontar à documentação final. Registre este prompt integral em AI_PROMPTS.md.

5. Verificação proporcional
- Confira que todos os arquivos removidos foram intencionais.
- Procure referências aos caminhos/nomes antigos em documentos e geradores.
- Valide links, âncoras, UTF-8 e Markdown.
- Execute o validador documental e git diff --check.
- Confira visualmente o conjunto final e o índice.
- Se alterar código executável dos testes, execute lint/typecheck pertinentes.
- Se mudar o enquadramento ou a geração das capturas, execute a suíte responsável uma vez e confirme que somente o conjunto final foi produzido.
- Não repita build, audit ou integrações sem relação com mudanças feitas nesta tarefa.
- Caso execute navegador/PostgreSQL, use somente recursos descartáveis autorizados e confirme sua limpeza.
- Não marque a correção assíncrona como aprovada apenas por reorganizar documentos: preserve os resultados reais existentes e declare qualquer pendência.

6. Entrega
Informe:
- Quantidade e nomes das capturas removidas, renomeadas e mantidas.
- Quais documentos passaram a ser a referência principal e o detalhe histórico.
- Ajustes nos geradores e verificações executadas.
- Pendências reais restantes.

Gere diff exclusivo desta organização, incluindo remoções e renomeações, e atualize o diff acumulado da entrega frontend. Não inclua segredos, dependências instaladas ou artefatos de build.

Sem commit, push, publicação, acesso a bancos remotos ou alterações funcionais. Conclua a organização integralmente, sem ampliar o escopo para novas melhorias visuais.
```

Aceito: inventariar/comparar antes de remover, retirar9 antigas e2 duplicatas
confirmadas pixel a pixel, renomear4, preservar18 finais e todas as asserções.
ui.md vira entrada, ui-p1.md detalhe e relato inicial arquivado sem apagar falhas.
Sem mudança funcional/identidade ou nova aprovação da corrida por documentação.
[Inventário e verificação](../harness/evidence/ui-organization.md),
[contrato](../harness/evidence/ui-organization-plan.md). Autorrevisão documental sequencial;
revisão humana permanece pendente.


<a id="registro-23"></a>

## Padronização das pastas visuais do frontend — 29/10/2026

Ferramenta: Codex. Prompt integral:

```text
Padronize os nomes das pastas de evidências visuais do frontend, revisando todas as referências a P1 sem apagar o histórico da correção.

Destino final:
- docs/harness/evidence/ui-captures/
- docs/harness/evidence/ui-reference/

1. Confira antes de alterar
- Leia AGENTS.md e confira Git.
- Preserve todas as alterações anteriores.
- Inventarie ui-captures/, ui-p1-captures/ e ui-p1-reference/.
- Procure referências a ui-p1, UI-001-P1 e aos caminhos dessas pastas no repositório.
- Não leia segredos ou arquivos de ambiente.

2. Consolide as pastas
- Mova as 18 capturas finais e o README de ui-p1-captures/ para ui-captures/.
- Como ui-captures/ já existe, compare o conteúdo antes de mover. Não sobrescreva silenciosamente.
- Se houver capturas antigas, remova somente as identificadas como superadas, preservando o conjunto final aprovado.
- Renomeie ui-p1-reference/ para ui-reference/, preservando as duas imagens oficiais e reference.json.
- Remova as pastas antigas quando estiverem vazias.
- Preserve os nomes finais dos PNGs e confira que seus conteúdos não mudaram, usando hashes antes/depois.

3. Revise todas as menções a P1
Distinga nome operacional de registro histórico:
- Atualize caminhos ativos, links, índices, tabelas, geradores e testes para ui-captures/ e ui-reference/.
- Confira SOLUTION.md, arquitetura, requisitos, ui.md, documentação de organização, memória, galeria e scripts de captura.
- Confira caminhos armazenados dentro de reference.json e outros arquivos de metadados.
- Mantenha ui-p1.md, ui-p1-plan.md e o identificador UI-001-P1 onde registram o erro, reprodução, correção e testes.
- Nos documentos históricos, atualize links navegáveis para os destinos atuais e explique a mudança de pasta quando necessário.
- Preserve prompts integrais, comandos históricos, resultados e caminhos de snapshots/diffs que documentam o que realmente ocorreu. Acrescente nota de atualização fora desses registros, sem reescrevê-los.
- Não faça substituição global indiscriminada de “P1”.

4. Verifique
- Confirme 18 PNGs finais e README em ui-captures/.
- Confirme as três referências oficiais em ui-reference/.
- Confirme ausência das pastas antigas.
- Procure novamente os nomes antigos: cada ocorrência restante deve ter justificativa histórica.
- Valide links, âncoras, UTF-8, Markdown e git diff --check.
- Se modificar código executável dos geradores, execute lint/typecheck pertinentes.
- Não repita navegador, banco ou build apenas por renomeação de caminhos. Se houver necessidade concreta de execução, explique e use somente os recursos descartáveis já autorizados.

5. Documente e entregue
- Registre este prompt integral em AI_PROMPTS.md.
- Acrescente ao registro de organização o motivo, as movimentações e verificações realizadas.
- Atualize o diff acumulado UI-001 e gere diff exclusivo desta padronização, incluindo movimentações e remoções.
- Informe arquivos movidos, referências atualizadas e menções históricas preservadas.

Escopo estritamente organizacional: sem mudanças funcionais, novas capturas, dependências, Harness, CI, banco, commit, push ou publicação.
```

Aceito: somente padronização de caminhos operacionais. Atualização fora dos registros
anteriores: galeria em ui-captures e referências em ui-reference; P1 identifica a
correção histórica. Prompts anteriores conservados integralmente, com seus caminhos
originais. [Movimentações e verificação](../harness/evidence/ui-organization.md#padronização-posterior-das-pastas-visuais--29102026).
