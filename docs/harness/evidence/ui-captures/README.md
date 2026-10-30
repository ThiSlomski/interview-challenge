# Capturas finais da aplicação — frontend UI-001

Dados sintéticos. Desktop: 1280 × 900; celular: 390 × 844

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
São 18 imagens da aplicação com identidade Slomski Solutions, em nove pares.
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
| Indisponibilidade | Falha segura, sem dados e com recuperação | [Desktop](07-area-indisponivel-desktop.png) | [Celular](07-area-indisponivel-mobile.png) |
| Login | Foco e autofill controlado no e-mail, com indisponibilidade503 simulada | [Desktop](08-login-desktop.png) | [Celular](08-login-mobile.png) |

Geradas por `npm run test:ui`, com Next/Chromium/PostgreSQL descartáveis reais.
No ajuste dos campos, foram atualizados apenas os pares02,08 e09. Os outros
seis pares permanecem da execução anterior; referências oficiais não mudaram.
O estado autofill do login foi forçado via protocolo de inspeção, sem perfil ou
credenciais persistidas; autofill nativo de endereço foi verificado no cadastro.
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
