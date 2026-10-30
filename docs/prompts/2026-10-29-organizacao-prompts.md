# Organização dos registros de prompts — 29/10/2026

Ferramenta: Codex. Origem: pedido do usuário nesta sessão. Escopo exclusivamente
documental; autorrevisão sequencial, sem delegação. Revisão humana pendente.

## Prompt integral

```text
Reorganize os registros de prompts do projeto, retomando o padrão de arquivos individuais em docs/prompts/.

Esta tarefa é exclusivamente documental. Preserve todas as alterações de implementação existentes.

PADRÃO DEFINITIVO

- docs/prompts/: fonte principal do texto integral dos prompts, organizada por data e assunto.
- docs/AI_PROMPTS.md: índice cronológico com objetivo, link para o prompt, resumo do resultado e limitações.
- docs/harness/evidence/: evidências detalhadas, verificações, falhas e correções.

Não manter cópias integrais do mesmo prompt no índice e nos arquivos individuais.

1. Examine antes de alterar

Leia AGENTS.md e as instruções aplicáveis de documentação.

Confira:
- docs/prompts/
- docs/AI_PROMPTS.md
- Regras, skills, templates e documentos que orientam o registro de prompts.
- Links e âncoras que apontam para as seções atuais.

Identifique quais prompts já possuem arquivo próprio, quais estão somente no índice e quais aparecem nos dois lugares. Preserve o trabalho em andamento e não leia segredos.

2. Organize todos os registros

Revise todo o AI_PROMPTS.md, inclusive as etapas iniciais, para aplicar um único padrão.

- Reutilize os arquivos existentes em docs/prompts/.
- Extraia os textos integrais que estão somente no AI_PROMPTS.md para arquivos nessa pasta.
- Siga a convenção existente de nomes: AAAA-MM-DD-assunto.md.
- Use a data registrada na fonte. Não invente datas ou textos ausentes.
- Agrupe o prompt principal e suas continuações/correções no arquivo da mesma etapa, com seções claras e ordem cronológica. Crie outro arquivo quando o assunto justificar.
- Preserve exatamente o texto dos prompts: não corrigir sua redação, comandos, caminhos ou instruções históricas.
- Preserve identificadores, decisões, resultados, falhas, limitações e situação da revisão humana.
- Se o registro original contém apenas um resumo, mantenha-o identificado como resumo; não reconstrua um suposto prompt integral.
- Compare registros aparentemente duplicados antes de consolidar. Preserve versões que tenham diferenças relevantes.

Cada prompt deve ter um único local principal. Não crie um arquivo por mensagem curta nem uma nova pasta de arquivo histórico.

3. Enxugue o índice sem perder informação

Em docs/AI_PROMPTS.md, mantenha para cada registro:
- Data e identificador existentes.
- Objetivo.
- Link direto para o arquivo e seção correspondentes.
- Resumo breve do resultado.
- Limitações e revisão humana, quando registradas.
- Link para evidências detalhadas, quando existirem.

Mova detalhes extensos para o arquivo da etapa ou para a evidência correspondente, sem duplicação desnecessária e sem perder conteúdo.

Preserve os títulos/âncoras atuais do índice sempre que possível para não quebrar referências. Quando necessário, atualize os links que dependem deles.

Inclua uma explicação curta no início sobre a função de cada local de documentação.

4. Previna a repetição do problema

Atualize apenas as instruções ativas, regras e templates pertinentes para estabelecer:

“Registrar o texto integral em docs/prompts/, seguindo a convenção existente. Em docs/AI_PROMPTS.md, acrescentar somente o resumo e o link. Evidências detalhadas ficam em docs/harness/evidence/.”

Não altere essa frase dentro de prompts históricos: eles devem continuar mostrando as instruções realmente recebidas.

Não reformule o Harness nem crie mecanismos adicionais sem necessidade. Esta solicitação autoriza ajustar pontualmente as orientações documentais para manter o padrão.

Registre este próprio prompt em docs/prompts/ e adicione sua entrada resumida ao índice.

5. Valide

- Compare o conteúdo antes e depois para confirmar que nenhum prompt ou registro relevante foi perdido ou alterado.
- Confira que todos os registros do índice possuem destino válido.
- Valide links, âncoras, Markdown e UTF-8.
- Execute o validador documental existente e git diff --check.
- Confira que o diff ficou limitado aos documentos e às instruções documentais pertinentes.

Não execute navegador, banco, build ou suítes funcionais por causa desta reorganização.

6. Entregue

Informe:
- Arquivos criados e reutilizados.
- Quais registros foram extraídos ou consolidados.
- Quais orientações ativas foram corrigidas.
- Resultado das verificações e eventuais lacunas encontradas.

Apresente um diff exclusivo desta reorganização e atualize o diff acumulado existente da entrega, se aplicável.

Sem alterações funcionais, exclusão de histórico, commit, push ou publicação.
```

## Resultado e limites

Os registros foram reorganizados no índice e nos arquivos das respectivas etapas.
Inventário, comparação de conteúdo, verificações e diffs na
[evidência documental](../harness/evidence/prompt-organization.md).
Sem execução funcional; revisão humana pendente.

## Pedido de commit exclusivo — 29/10/2026

```text
Crie um commit exclusivo da reorganização dos registros de prompts, separado da entrega UI-001.

Leia AGENTS.md e confira o estado do Git antes de agir. Preserve todas as alterações existentes da UI.

Inclua no commit somente:
- Organização dos prompts em docs/prompts/.
- Conversão de docs/AI_PROMPTS.md em índice resumido.
- Ajustes das orientações documentais em record-decision, especialista Documentação, TOKEN_POLICY.md e HARNESS.md.
- Evidência da reorganização e correções de referências necessárias.

Separe arquivos compartilhados por trechos. Não inclua componentes, estilos, testes, capturas ou documentação de implementação da UI apenas porque estão no mesmo arquivo.

Confira dependências: o conteúdo commitado não pode apontar para arquivos ou âncoras que existam somente nas alterações pendentes da UI. Se necessário, reserve as entradas específicas da UI para o futuro commit dela, mantendo-as no diretório de trabalho.

Registre este pedido em docs/prompts/ e adicione resumo e link ao índice, seguindo o padrão restabelecido.

Antes do commit:
- Execute a validação documental existente.
- Confira links, âncoras, UTF-8 e Markdown.
- Revise git diff --cached e execute git diff --cached --check.
- Confirme que o conteúdo preparado contém exclusivamente o ajuste documental.
- Se houver alterações previamente preparadas no índice, preserve-as e não as inclua inadvertidamente neste commit.
- Não execute navegador, banco, build ou suítes funcionais.

Crie o commit:
docs: reorganiza registros de prompts em arquivos por etapa

Use a identidade Git já configurada. Não faça push.

Ao terminar, informe:
- Hash e resumo do commit.
- Arquivos incluídos.
- Verificações executadas.
- Alterações da UI que continuam pendentes.

Não descarte alterações, não altere commits anteriores e não corrija funcionalidades nesta tarefa.
```

### Resultado da separação

Preparação exclusiva dos registros anteriores à UI e das orientações documentais.
Entradas e arquivos de prompts que dependem das evidências pendentes da UI ficam
reservados no diretório de trabalho. Escopo, verificação da árvore preparada e
preservação registrados na [evidência](../harness/evidence/prompt-organization.md#commit-documental-separado--29102026).
Autorização de commit não equivale à revisão humana do produto.
