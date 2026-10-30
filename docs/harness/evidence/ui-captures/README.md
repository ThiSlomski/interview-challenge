# Capturas finais da aplicação — frontend UI-001

Dados sintéticos. Desktop: 1280 × 900; celular: 390 × 844

## PROFILE-UI-003 — edição compartilhada, 30/10/2026

Somente par04 (Minha área, desktop/mobile) atualizado pela estrutura compartilhada
do perfil. Cartão e editor passam a ocupar alternadamente o mesmo slot em ambos
os papéis. Demais18 PNGs e três referências preservados por SHA256.
[Evidência](../shared-profile-edit.md) e [hashes](../shared-profile-edit-hashes.json).

## ADMIN-UI-002 — perfil administrativo separado, 30/10/2026

Somente pares06 (painel administrativo) e10 (confirmação sobre o painel)
atualizados. Perfil próprio no topo, edição junto dos dados e usuários comuns
abaixo; rodapé compartilhado preservado. Demais16 PNGs e três referências
iguais por SHA256. [Evidência](../admin-profile-separation.md) e
[hashes antes/depois](../admin-profile-separation-hashes.json).

## Home e rodapé compartilhado — 30/10/2026

O complemento HOME-UI-001-F1 mantém o refinamento da home e reformula o único
rodapé do RootLayout. As 20 imagens da aplicação exibem o rodapé, inclusive o
fundo dos diálogos10, e são atualizadas nos mesmos estados/fixtures de origem.
As três referências oficiais permanecem idênticas por SHA256. Logo local,
slogan e copyright estático2026; três áreas em desktop/tablet e empilhamento
centrado em celular. [Evidência](../home-footer-refinement.md) e
[manifesto incremental](../home-footer-refinement-hashes.json).
Históricos abaixo preservados; não representam os hashes atuais da galeria.

## Contraste da exclusão administrativa — 30/10/2026

ADMIN-DELETE-UI-001 atualiza somente o par06 e acrescenta o par10, com confirmação
aberta por teclado e foco inicial em Cancelar. Texto claro/vermelho escuro nos
botões de exclusão, contraste normal 15.57:1; estados hover/active/disabled/foco
validados em Chromium. A captura da listagem é estado normal após recarga real,
sem ocultar avisos da aplicação. A confirmação usa viewport; a lista usa página
integral. Dados sintéticos de fixture descartável, nunca cadastros persistentes.
Os demais16 PNGs e3 referências permanecem iguais por SHA256. [Cores, hashes e
verificações](../admin-delete-visual.md). Inspeção visual pelo agente; revisão humana pendente.

## Previsão no cadastro concluído — 30/10/2026

WEATHER-001 atualiza somente o par 03, em página integral. Confirmação, resumo
sem senha, previsão do segundo dia e atribuição Open-Meteo aparecem juntos.
Resposta meteorológica sintética e interceptada, não previsão real. O texto de
mensagem com script é fixture literal para verificar escape, nunca executado.
Os demais 16 PNGs e as três referências são preservados por SHA-256, conforme
[evidência/hashes](../ui.md#weather-001--previsão-do-dia-seguinte-30102026).
Inspeção visual do agente em desktop/celular; revisão humana pendente.
Sem indicador de desenvolvimento nas capturas. Históricos abaixo preservados.

Conjunto consolidado após a correção histórica UI-001-P1. A padronização posterior
moveu a galeria para `ui-captures/` e as referências para `ui-reference/`, sem
modificar os PNGs ou o JSON oficial. Este README recebeu atualização documental.

As dimensões acima são as janelas do navegador. Capturas de página integral
podem ter altura maior; o par administrativo atual também usa página integral.
São 20 imagens da aplicação com identidade Slomski Solutions, em dez pares.
As [referências do site oficial](../ui-reference/reference.json) ficam separadas
deste conjunto. [Entrega principal](../ui.md) e [inventário](../ui-organization.md).

| Estado | Descrição | Desktop | Celular |
| --- | --- | --- | --- |
| Inicial normal | Navegação e entrada para cadastro/login | [Desktop](01-home-normal-desktop.png) | [Celular](01-home-normal-mobile.png) |
| Inicial com foco | Skip-link em linha própria, sem sobrepor marca | [Desktop](01-home-focus-desktop.png) | [Celular](01-home-focus-mobile.png) |
| Cadastro vazio | Todos os campos, antes do envio | [Desktop](09-cadastro-desktop.png) | [Celular](09-cadastro-mobile.png) |
| Cadastro com erros | Erro e foco de teclado simultâneos no campo de senha | [Desktop](02-cadastro-erros-desktop.png) | [Celular](02-cadastro-erros-mobile.png) |
| Cadastro concluído | Resumo sem senha, login necessário e previsão de amanhã | [Desktop](03-cadastro-sucesso-desktop.png) | [Celular](03-cadastro-sucesso-mobile.png) |
| Área user | Cadastro próprio, sem controles administrativos | [Desktop](04-area-user-desktop.png) | [Celular](04-area-user-mobile.png) |
| Área admin | Título e registros autorizados; sem capturar os 100 itens | [Desktop](06-area-admin-desktop.png) | [Celular](06-area-admin-mobile.png) |
| Confirmar exclusão | Diálogo aberto por teclado, Cancelar focado e botão danger legível | [Desktop](10-exclusao-confirmacao-desktop.png) | [Celular](10-exclusao-confirmacao-mobile.png) |
| Indisponibilidade | Falha segura, sem dados e com recuperação | [Desktop](07-area-indisponivel-desktop.png) | [Celular](07-area-indisponivel-mobile.png) |
| Login | Foco e autofill controlado no e-mail, com indisponibilidade503 simulada | [Desktop](08-login-desktop.png) | [Celular](08-login-mobile.png) |

Geradas por `npm run test:ui`, com Next/Chromium/PostgreSQL descartáveis reais.
No ajuste dos campos, foram atualizados apenas os pares02,08 e09. Os outros
seis pares permanecem da execução anterior; referências oficiais não mudaram.
O estado autofill do login foi forçado via protocolo de inspeção, sem perfil ou
credenciais persistidas; autofill nativo de endereço foi verificado no cadastro.

LOGIN-UI-001,30/10/2026: somente o par08 foi atualizado para o conjunto centralizado
de até520px e ações empilhadas em celular. Cenário503/autofill permanece sintético.
[Capturas normais desktop/tablet/mobile, resultados e limites](../login-refinement.md).
A falha de login desta captura é uma resposta503 interceptada, conforme o teste.
Nenhuma imagem foi editada para simular estados. O chrome de desenvolvimento do
Next é ocultado somente durante a captura; elementos da aplicação permanecem
visíveis. Senhas aparecem somente como máscara do input.

## Par administrativo atualizado — 30/10/2026

Somente o par06 foi regenerado nesta rodada. Mostra o cabeçalho administrativo,
a descrição única, o registro sintético autenticado com Você · Administrador e
controles conforme o cursor. A captura usa uma lista pequena real e after válido
imediatamente anterior ao UUID próprio, sem filtrar a resposta nem ocultar itens.
Agora esse par usa página integral para incluir todos os campos e a paginação
em desktop/celular. O gerador restringe escrita ao par06; os demais testes executam
normalmente. Os outros16 PNGs e as três referências permanecem idênticos por
SHA-256. [Hashes e resultados](../ui.md#refinamento-administrativo--30102026).
Inspeção visual pelo agente; revisão humana pendente.

## Composição da home — 30/10/2026

HOME-UI-001 atualiza somente os quatro PNGs 01-home normal/foco desktop/mobile.
O painel de benefícios é informativo, com SVGs locais, duas colunas a partir de
1100px e empilhamento abaixo desse limite. O shell vertical da home preenche a
viewport e mantém o rodapé no final. As outras 16 capturas e três referências
permanecem idênticas por SHA256. [Evidência](../home-refinement.md) e
[manifesto antes/depois](../home-refinement-hashes.json). Capturas em Chromium
com build de produção e HTTPS local; inspecionadas pelo agente. Revisão humana
pendente. Nenhum fluxo funcional alterado.
## REG-UI-001 — cadastro centralizado, 30/10/2026

Somente pares02 (erros) e09 (formulário) atualizados pelo refinamento visual.
Sucesso/resumo/clima preservados. [Evidência](../registration-refinement.md) e
[captura normal desktop](../registration-captures/desktop.png),
[tablet](../registration-captures/tablet.png), [celular](../registration-captures/mobile.png).
## REG-ESSENTIAL-001 — dados essenciais e Zod, 30/10/2026

Pares02/09 e três vistas em registration-captures atualizados pelos textos/erros
de obrigatoriedade. Layout preservado;18 PNGs restantes idênticos ao snapshot
anterior. [Evidência](../required-profile-fields.md) e
[hashes incrementais](../required-profile-fields-hashes.json).

## REG-SUCCESS-UI-001 — conclusão alinhada, 30/10/2026

Somente par03 atualizado para reutilizar a largura do cadastro. Três vistas novas
[desktop](../registration-success-captures/desktop.png),
[tablet](../registration-success-captures/tablet.png) e
[celular](../registration-success-captures/mobile.png).
[Evidência e verificações](../registration-success-layout.md).
