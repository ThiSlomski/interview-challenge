# Revalidação periódica da área protegida — 30/10/2026

Ferramenta: Codex. Pedido do usuário; texto integral abaixo. Resultados e limites
na [evidência UI existente](../harness/evidence/ui.md#revalidação-periódica-estável--30102026).

## Prompt integral

Corrija a oscilação visual da área protegida durante a revalidação periódica da sessão.

DIAGNÓSTICO CONFIRMADO

A aba Network não registra nova requisição do tipo Document nem navegação para /area.

Durante o efeito visual aparecem somente requisições fetch iniciadas por Area.tsx:

1. GET da sessão — Area.tsx:91
2. GET do usuário autorizado — Area.tsx:116
3. nova conferência da sessão — Area.tsx:91

Todas retornam HTTP 200.

Portanto, não há refresh real. A impressão de recarregamento é causada pelo conteúdo privado sendo ocultado e revelado durante uma revalidação periódica bem-sucedida.

As mensagens “runtime.lastError: message channel closed before a response was received” pertencem a extensões do Chrome. Não altere a aplicação para capturá-las ou suprimi-las.

OBJETIVO

Manter o conteúdo visualmente estável durante a revalidação periódica bem-sucedida de uma sessão já verificada, sem enfraquecer as proteções existentes.

IMPLEMENTAÇÃO

1. Revise Area.tsx e identifique todos os gatilhos de check:
   - montagem inicial;
   - intervalo periódico;
   - focus;
   - pageshow;
   - visibilitychange;
   - expiração;
   - logout;
   - troca dos dados recebidos pelo componente.

2. Diferencie explicitamente dois modos de revalidação:

Revalidação restritiva:
- usada na montagem inicial, retorno à página, pageshow, focus após afastamento, troca de identidade e situações em que o conteúdo não pode ser considerado atual;
- oculta o conteúdo antes da consulta.

Revalidação de fundo:
- usada somente pelo intervalo periódico enquanto a página permanece visível, a identidade não mudou e a sessão anteriormente validada ainda não venceu;
- mantém o conteúdo atual visível enquanto as três verificações estão em andamento;
- não altera layout, foco, scroll ou visibilidade quando todas as respostas forem válidas.

3. Na revalidação de fundo, o conteúdo deve ser ocultado imediatamente quando ocorrer qualquer um destes casos:
   - 401 ou 403;
   - sessão ausente, inválida ou expirada;
   - identidade diferente;
   - usuário retornado diferente do usuário visível;
   - falha da conferência final da sessão;
   - resposta inconsistente;
   - logout;
   - expiração pelo timer local;
   - operação invalidada por troca de identidade.

4. Preserve:
   - AbortController e cancelamento;
   - contador de geração;
   - descarte de respostas antigas;
   - conferência de sessão antes e depois da consulta;
   - ocultação antes de redirecionamentos;
   - bloqueio de revelação por resposta antiga;
   - logout seguro;
   - expiração no instante correto;
   - proteção ao voltar pelo histórico;
   - comportamento seguro em desmontagem.

5. Não use router.refresh, reload, nova navegação ou remount para resolver o efeito.
Não reduza a frequência atual sem justificativa.
Não remova a conferência final da sessão.
Não trate erros de extensões do navegador no código.
Não use suppressHydrationWarning.

TESTES

Adicione regressões que comprovem:

1. Revalidação periódica com três respostas válidas:
   - conteúdo permanece visível durante todo o ciclo;
   - não muda hidden;
   - não ocorre navegação;
   - não ocorre nova requisição Document;
   - não há mudança de foco, scroll ou layout.

2. Durante a mesma modalidade de revalidação:
   - 401 oculta e redireciona;
   - 403 oculta e impede acesso;
   - identidade divergente oculta;
   - sessão final divergente ou expirada oculta;
   - resposta antiga não consegue revelar conteúdo;
   - expiração local oculta mesmo com requisição pendente.

3. Focus, pageshow, retorno de aba e troca de identidade continuam usando a revalidação restritiva e ocultam antes de consultar.

4. Logout continua ocultando o conteúdo antes da chamada e antes do redirecionamento.

Execute a suíte de concorrência e a suíte completa de UI. Monitore console, pageerror, navegações e requisições Document.

DOCUMENTAÇÃO

Registre:
- que a aba Network descartou refresh real;
- a sequência session → usuário → session;
- a causa da oscilação;
- a separação entre revalidação restritiva e de fundo;
- as garantias preservadas;
- os testes e resultados realmente executados.

Registre este prompt integral em docs/prompts/ e somente resumo/link em docs/AI_PROMPTS.md. Atualize a evidência UI existente, sem criar documentação paralela.

Apresente diff exclusivo desta correção e atualize o diff acumulado UI-001.

Sem commit, push, publicação ou continuidade do ajuste visual nesta tarefa.
