# 2026-10-29-especialistas

Fonte: registros anteriores de docs/AI_PROMPTS.md. Textos integrais e resumos
conservados conforme a fonte; a data no nome corresponde às etapas datadas.

Registro histórico transferido do índice em 29/10/2026. Links navegáveis fora
dos prompts foram ajustados à localização atual; instruções históricas não foram
atualizadas. Resultados abaixo pertencem às respectivas rodadas.

<a id="registro-9"></a>

## Prompt 9 — revisão das instruções dos quatro especialistas (29/10/2026)

**Origem:** revisão do conteúdo compartilhado nesta conversa, sem afirmar acesso
remoto aos arquivos. Ferramenta: Codex; skill record-decision. Classificação:
ajustes de escopo e prevenção de instruções desatualizadas, sem alegar falha de
execução causada pelos textos, pois isso não foi demonstrado.

**Prompt integral:**

```text
Ajuste as instruções dos quatro especialistas em .codex/agents/
conforme a revisão abaixo e documente as alterações.

Leia AGENTS.md e preserve todo trabalho existente.
Localize os arquivos reais; não crie agentes duplicados.

CORREÇÕES

1. Restrições temporárias — quatro especialistas

Remova a frase fixa “Nesta etapa Harness não implementar...”.

Substitua por uma orientação equivalente a:

“Execute somente o escopo explicitamente atribuído pelo
orquestrador, respeitando AGENTS.md e a fase vigente.
Leitura é o padrão; escrita exige atribuição no contrato.
A mudança de fase, isoladamente, não autoriza implementação.”

Preserve as demais restrições de segurança, publicação,
configurações pessoais e criação de subagentes.

2. Escopo do Backend

Permita, quando explicitamente atribuídos:
- Rotas em app/api/**.
- Módulos de servidor para autenticação, autorização,
  validação, regras e integração com persistência.
- Testes correspondentes.

Não escolha antecipadamente pastas, bibliotecas ou arquitetura.
O contrato deve listar os caminhos autorizados.
Não transfira ao Backend a responsabilidade por schema
e migrations do especialista de Banco.

3. Escopo do Frontend

Delimite a escrita a arquivos de interface, lógica de cliente
e testes correspondentes explicitamente atribuídos.

Esclareça que:
- Estar em app/** ou services/** não torna um arquivo
  automaticamente responsabilidade do Frontend.
- Código executado no servidor e contratos compartilhados
  exigem definição de responsabilidade pelo orquestrador.
- Cada arquivo continua com um único responsável por escrita.

4. Missões

Nas descrições e instruções de Frontend, Backend e Banco,
deixe explícito que podem analisar, implementar e verificar,
sempre conforme autorização e contrato.

Preserve a missão de consolidação do especialista
de Documentação.

5. Contexto seletivo

Substitua listas de leitura obrigatória indiscriminada por
fontes consultadas conforme a tarefa.

Mantenha a leitura das instruções aplicáveis e do contrato.
Consulte apenas requisitos, decisões, trechos e evidências
necessários; amplie a leitura quando houver dependência
ou dúvida concreta.

Documentação não deve reler integralmente docs/AI_PROMPTS.md
em toda execução. Para acrescentar registros, confira a
estrutura e as entradas relevantes.

Se um caminho não existir, registre a ausência.
Não trate ausência como sucesso nem crie arquivos fora
do escopo para satisfazer uma referência.

6. Serviços externos

Esclareça a diferença entre escrever uma integração
e executá-la durante o trabalho do agente.

Implementar código de integração pode fazer parte de uma
tarefa autorizada. Chamadas externas pelo agente permanecem
proibidas por padrão e exigem autorização explícita no
contrato, compatível com as instruções superiores.

Não faça chamadas externas nesta etapa.

DOCUMENTAÇÃO

- Registre este prompt integral em docs/AI_PROMPTS.md,
  com data real, resultados e limitações.
- Acrescente o próximo registro disponível em
  docs/harness/BUILD_LOG.md.
- Classifique os achados como ajustes de escopo e prevenção
  de instruções desatualizadas.
- Não alegue falha de execução causada por esses textos:
  isso não foi demonstrado.
- Identifique a origem como revisão do conteúdo compartilhado
  nesta conversa, sem afirmar acesso remoto aos arquivos.
- Preserve o histórico e a revisão humana integral pendente.

VALIDAÇÃO

- Confira a sintaxe TOML e os campos obrigatórios dos agentes
  pelo mecanismo compatível já disponível.
- Execute validate e as verificações específicas existentes
  para esses arquivos.
- Execute git diff --check.
- Confira coerência com AGENTS.md e o contrato de delegação.
- Diferencie validação estática de carregamento e execução nativos.
- Não repita testes da aplicação por alterações de instruções.
- Se um validador exigir literalmente as frases antigas,
  relate a dependência antes de ampliar o escopo.

LIMITES

Altere somente:
- Os quatro arquivos existentes em .codex/agents/.
- docs/AI_PROMPTS.md.
- docs/harness/BUILD_LOG.md.

Não altere código funcional, scripts, skills, configuração
principal, dependências, lockfile ou CI.
Não inicie funcionalidades.
Não crie commits, faça push ou publique.

ENTREGA

Apresente:
1. Arquivos alterados e diff desta rodada.
2. Ajuste realizado para cada achado.
3. Comandos executados e resultados reais.
4. Limitações e pendências.

Não declare resolvidas as lacunas de hooks reais, seleção
nativa dos especialistas ou retomada em sessão limpa
sem novas evidências.
```

**Alterações:** atualizados os quatro arquivos existentes backend.toml,
frontend.toml, database.toml e documentation.toml, sem criar papéis duplicados.
Escopo e fase agora dependem de atribuição explícita; leitura permanece padrão,
escrita depende de contrato, e mudança de fase não autoriza implementação.
Preservadas restrições de segredos, publicação, Git/configuração pessoal e
subdelegação, bem como permissões herdadas e ausência de sandbox independente.

Backend pode receber rotas, módulos de servidor e testes nos caminhos listados
no contrato, sem escolher pastas/bibliotecas e sem assumir schema/migrations.
Frontend cuida de interface/cliente/testes atribuídos; localização em app/services
não concede propriedade. Código de servidor e contratos compartilhados exigem
responsabilidade definida pelo orquestrador e escritor único.
Frontend/Backend/Banco podem analisar, implementar e verificar quando autorizados;
Documentação preserva a missão de consolidação e não recebe código funcional.
Fontes passam a ser seletivas, com ausência registrada e ampliação por dependência
ou dúvida concreta; para o log, Documentação confere estrutura/entradas relevantes.
Escrever integração é distinto de executá-la: chamadas externas continuam proibidas
por padrão e exigem contrato compatível com instruções superiores.

**Coerência e limites:** instruções compatíveis com AGENTS.md e contrato de delegação;
nenhuma autorização para iniciar o produto. Busca nos scripts não encontrou
dependência literal dos textos substituídos. Nenhuma chamada externa nesta rodada;
testes da aplicação não repetidos.

**Resultados reais das verificações (29/10/2026):**

- `node scripts/harness/harness.mjs validate`: código 0, ok:true, sem erros.
  Confere estrutura, campos obrigatórios e referências; não comprova execução nativa.
- `node --test --test-name-pattern="native capability state" scripts/harness/harness.test.mjs`:
  código 0, um teste específico de capacidades aprovado. Demais testes não executados.
- `codex --strict-config app-server --print-startup-config`: código 0, CLI
  0.164.0-alpha.11.1; validação local de configuração, sem iniciar o app-server.
- Primeira tentativa `codex --strict-config debug prompt-input ...`: código 1,
  sem JSON; reconhecimento não comprovado por essa combinação. Não se atribui a
  falha aos textos das instruções. Nenhuma alteração de configuração para contornar.
- `codex debug prompt-input ...`, mecanismo local já utilizado: código 0,
  resposta JSON válida e as quatro descrições exatas reconhecidas. O carregamento
  dos metadados pelo parser/renderizador não demonstra aplicação do corpo das
  instruções em instâncias nem seleção pelo nome nativo. Somente resultados
  sanitizados extraídos; saída bruta não exposta nem persistida. Zero turnos de modelo.
- `git diff --check`: código 0. Comparação com a baseline desta rodada confirmou
  somente os seis arquivos autorizados alterados, nenhum novo agente/arquivo e
  preservação de scripts, skills, configuração principal e demais arquivos.

Revisão humana integral permanece pendente; ajustes não demonstram seleção nativa,
disparo real dos hooks ou retomada em sessão limpa.
