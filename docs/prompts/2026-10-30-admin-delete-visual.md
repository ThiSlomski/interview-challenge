# ADMIN-DELETE-UI-001 — pedido integral, 30/10/2026

Ferramenta: Codex. Escopo: visual danger, testes/capturas administrativas e
evidência sanitizada. Sem commit/push ou alteração funcional/persistente.

## Texto integral

Faça um ajuste visual isolado nos botões de exclusão administrativa.

Problema:
O botão “Excluir definitivamente” apresenta texto com baixo contraste no estado normal. No hover ele fica legível, mas a ação precisa ser claramente visível em todos os estados.

Ajustes:
1. Reutilize a paleta danger/error já existente no projeto.
2. No botão “Excluir definitivamente” use:
   - fundo vermelho escuro;
   - texto branco ou claro com contraste WCAG AA de pelo menos 4.5:1;
   - hover claramente perceptível;
   - active consistente;
   - disabled legível e reconhecível como desabilitado;
   - focus-visible mantendo o contorno amarelo da identidade visual.
3. Revise também o botão “Excluir usuário” dos cards administrativos para garantir o mesmo padrão.
4. Preserve o botão “Cancelar” como ação segura e foco inicial do diálogo.
5. Não altere textos, comportamento, API, autorização ou fluxo de exclusão.
6. Valide desktop e celular, com mouse e teclado.
7. Atualize somente as capturas administrativas afetadas, incluindo o diálogo aberto.
8. Preserve e registre os hashes das demais capturas.
9. Execute lint, typecheck, testes UI relacionados e git diff --check.
10. Não faça commit ou push.

Informe as cores finais, contraste calculado, arquivos alterados e resultados das validações.

## Aceites e ajustes

Pedido aceito sem ampliação funcional. Reproduzido1.05:1 no estado normal;
corrigida cascata específica button.danger com tokens existentes. Refinamento
evita texto amarelo herdado do secondary no hover dos cards. Capturas após
recarga real, sem ocultar avisos, preservando foco inicial seguro.
[Evidência, testes, cores e hashes](../harness/evidence/admin-delete-visual.md).
Revisão humana/CI remoto não presumidos; nenhuma exclusão no persistente.
