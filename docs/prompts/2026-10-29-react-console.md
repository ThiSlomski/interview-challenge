# Correção funcional React e investigação de hidratação — 29/10/2026

Ferramenta: Codex. Pedido atual prioriza a correção funcional sobre o ajuste visual.
Anexos fornecidos: Imagem do ChatGPT 29 de out. de 2026, 23_16_29.png e
Imagem do ChatGPT 29 de out. de 2026, 23_16_20.png, em Downloads do usuário.
Imagens usadas como evidência diagnóstica; não incorporadas à galeria.

## Prompt integral

```text
Investigue os dois erros anexados, priorizando a correção funcional antes de continuar o ajuste visual.

1. Corrija o uso de flushSync em components/ui/Area.tsx. A pilha mostra useEffect → check → close → flushSync. Examine todos os caminhos que chamam close e implemente uma solução compatível com o ciclo do React.

Preserve a ocultação imediata do conteúdo privado, o cancelamento das operações, a invalidação de respostas antigas, a revalidação da sessão e as proteções de logout, expiração e troca de identidade. Não apenas adie a chamada sem verificar essas garantias.

2. Investigue o aviso de hidratação com cz-shortcut-listen="true" no body. Busque esse atributo no projeto e compare o fluxo em navegador sem extensões. Não adicione suppressHydrationWarning nem desative a renderização do servidor para esconder o aviso.

3. Reproduza e valide entrada na área, recarregamento, logout e retorno pelo histórico. Faça os testes existentes de concorrência e acrescente verificação de erros do console/pageerror, pois o fluxo pode passar mesmo emitindo esses avisos.

Registre causa, correção e resultados reais na documentação existente. Apresente o diff da correção. Sem commit, push ou publicação.
```

## Registro da execução

Contrato e escopo em [ui-plan](../harness/evidence/ui-plan.md).
Causa, resultados, limitações e diff em
[UI-001](../harness/evidence/ui.md#correção-funcional-react-e-hidratação--29102026).
Autorrevisão sequencial; revisão humana pendente. Histórico anterior preservado.
