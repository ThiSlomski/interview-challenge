# Correção dos cinco achados — pedido integral

Corrija os cinco achados da revisão do Harness V1.

Leia AGENTS.md e use o harness existente. Preserve alterações
anteriores e mantenha o escopo restrito ao harness.

CORREÇÕES

1. Checkpoint e Git
- Diferencie árvore limpa de falha na consulta ao Git.
- Em caso de erro, apresente diagnóstico e retorne código não zero.
- Não grave um checkpoint que apresente a consulta malsucedida
  como estado válido.
- Teste árvore limpa, árvore alterada e falha do Git.

2. Probe de capacidades
- Diferencie presença, habilitação, configuração efetiva
  e execução demonstrada.
- Confira a camada de projeto e a concorrência pelos mecanismos
  oficiais disponíveis na versão instalada.
- Configuração desabilitada não pode aparecer como operacional.
- Quando não for possível verificar, registre como não comprovado.
- Não habilite recursos nem amplie permissões automaticamente.

3. Validação de hooks
- Rejeite grupos sem handlers.
- Valide os campos exigidos pelo formato oficialmente suportado.
- Exija timeout numérico explícito, finito e positivo,
  na unidade esperada.
- Teste configurações válidas e cada condição inválida.

4. Fixture do teste negativo
- Inclua .env.example e as demais referências necessárias.
- Primeiro comprove que a fixture válida passa.
- Depois introduza apenas o erro intencional e comprove
  a rejeição com diagnóstico correspondente.
- Evite testes que passem por uma falha diferente da esperada.

5. verify --product
- Remova a conclusão fixa de que os testes são placeholder.
- Examine a configuração real dos testes.
- Diferencie testes ausentes, placeholder, execução com falha
  e execução bem-sucedida.
- Não considere a mera presença de um script como prova
  de testes reais.
- Cubra esses cenários sem implementar testes da aplicação
  ou modificar seu package.json nesta etapa.

LACUNAS DE VALIDAÇÃO

Avalie se é possível demonstrar com segurança:
- Disparo real dos hooks em ambiente isolado.
- Seleção de especialistas pelo nome nativo.
- Retomada em uma sessão realmente limpa.
- Encerramento dos processos descendentes após timeout.

Não confunda simulação com execução real.
Não declare sessão limpa se houver contexto herdado.
Se a demonstração depender de outra sessão ou recurso indisponível,
mantenha a lacuna e documente o procedimento para verificá-la.
Não ative hooks globalmente nem altere configurações pessoais.

VERIFICAÇÃO E DOCUMENTAÇÃO

- Execute os testes direcionados às correções.
- Execute doctor, validate e verify.
- Execute lint, typecheck e git diff --check.
- Organize uma revisão independente delimitada das correções.
- Atualize docs/AI_PROMPTS.md com este prompt integral,
  resultados e avaliação crítica.
- Atualize o registro de construção, evidências e matriz
  de capacidades conforme os fatos.
- Preserve falhas anteriores no histórico.
- Mantenha revisão humana como pendente.

Não altere funcionalidades, dependências, lockfile ou CI.
Não crie commits, faça push ou publique.

ENTREGUE

Para cada achado: correção, arquivos e testes correspondentes.
Informe resultados, lacunas restantes, git status --short
e resumo das alterações, incluindo arquivos não rastreados.
Recomende a próxima etapa sem iniciá-la.
