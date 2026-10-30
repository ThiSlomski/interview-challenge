Refine a tela administrativa da rota `/area`, eliminando informações repetidas ou fora de contexto e deixando a experiência mais clara, elegante e coerente com a identidade visual já implementada.

Contexto

A implementação atual está commitada e a árvore começou limpa no commit:

4725e00 feat(ui): implementa interface responsiva e estabiliza área protegida

O fluxo funcional, a autorização, a revalidação periódica e as proteções de conteúdo privado já estão aprovados. Esta etapa deve ser um refinamento isolado de apresentação e contexto da área administrativa.

Antes de alterar, inspecione:

- `app/area/page.tsx`;
- `components/ui/Area.tsx`;
- componentes de cabeçalho e navegação;
- estilos e tokens atuais;
- contratos das APIs de sessão e usuários;
- testes da área comum e administrativa;
- gerador das capturas;
- documentação vigente em `docs/harness/evidence/ui.md`;
- organização atual de `docs/prompts/` e `docs/AI_PROMPTS.md`.

Não presuma contratos. Preserve as decisões de segurança existentes.

Objetivo visual e funcional

A tela deve diferenciar claramente a experiência do usuário comum da experiência administrativa.

Usuário comum

O usuário com papel `user` deve continuar vendo:

- marcador `ACESSO PROTEGIDO`;
- título `Minha área`;
- seção `Meu cadastro`;
- somente os próprios dados;
- botão `Sair`;
- comportamento atual de proteção, revalidação e indisponibilidade.

Não altere o funcionamento dessa experiência além de uma eventual padronização puramente visual compartilhada.

Administrador

O usuário com papel `admin` deve visualizar uma experiência administrativa própria:

- marcador `ACESSO ADMINISTRATIVO`;
- título `Painel administrativo`;
- texto de apoio:
  `Consulte os usuários cadastrados na plataforma.`
- botão `Sair`;
- título da listagem:
  `Usuários cadastrados`.

Remova da experiência administrativa o bloco separado `Meu cadastro`.

A listagem administrativa deve continuar contendo todos os usuários, inclusive o próprio administrador. Não filtre o administrador na API nem no cliente, pois isso alteraria a semântica de “todos os usuários” e poderia comprometer a paginação.

O cadastro do administrador deve aparecer uma única vez, dentro da listagem, identificado visualmente com:

`Você · Administrador`

Essa identificação deve ser aplicada somente ao registro correspondente à identidade autenticada. Não identifique usuários comuns como administradores e não exponha o papel de outros registros sem necessidade.

Não duplique dados do administrador em outra seção.

Cards da listagem

Preserve os campos autorizados existentes:

- Nome;
- E-mail;
- Endereço;
- Cidade;
- Estado;
- País;
- CEP;
- Mensagem.

Mantenha o tratamento `Não informado` para valores opcionais ausentes.

Padronize a apresentação do CEP sem alterar o valor armazenado:

- se houver exatamente oito dígitos, exiba no formato `00000-000`;
- se o valor não corresponder a esse formato, preserve uma apresentação segura e legível;
- não aplique regras brasileiras ao banco ou à API nesta etapa.

O marcador `Você · Administrador` deve ter aparência discreta e consistente com a identidade existente:

- fundo ou borda usando o amarelo institucional;
- contraste acessível;
- sem excesso de destaque;
- responsivo em desktop e celular.

Paginação

Corrija a exibição dos controles de paginação:

- na primeira página, não mostrar `Primeira página`;
- mostrar `Próxima página` somente quando houver `nextCursor`;
- quando a URL possuir um cursor `after` válido, permitir retornar para `Primeira página`;
- não criar paginação numérica;
- não inventar botão “Anterior”, pois o contrato atual utiliza cursor e pode não fornecer o cursor anterior;
- preservar a validação atual de `after`;
- preservar o comportamento de erro e indisponibilidade.

Remova o texto técnico:

`Consulta administrativa. Até 100 cadastros por página.`

Substitua por uma comunicação voltada ao usuário:

`Consulte os usuários cadastrados na plataforma.`

Evite repetir essa frase em dois pontos próximos. Organize título, descrição e listagem com uma hierarquia visual natural.

Navegação autenticada

A captura atual mostra `Cadastro` e `Entrar` enquanto o usuário já está autenticado.

Avalie a arquitetura atual antes de modificar o cabeçalho.

Se for possível ajustar a navegação autenticada reutilizando o estado de sessão já disponível, sem nova consulta redundante, sem transformar toda a aplicação em renderização dinâmica e sem causar hidratação divergente ou oscilação visual:

- ocultar `Cadastro` e `Entrar` durante uma sessão autenticada;
- manter `Minha área`;
- manter o botão `Sair` na área protegida.

Não duplique o botão `Sair` no cabeçalho e no conteúdo.

Se isso exigir ampliar significativamente o escopo, criar nova consulta de sessão, introduzir estado global, enfraquecer SSR ou gerar risco de hidratação, preserve o cabeçalho atual e registre objetivamente a razão. Não use hacks de CSS ou manipulação direta do DOM.

Preservações obrigatórias

Não alterar:

- schema ou dados do banco;
- migrations;
- procedimento `db:promote-admin`;
- endpoints;
- contratos das APIs;
- regras de autorização;
- projeção segura de campos;
- cookies ou sessões;
- duração da sessão;
- intervalo de revalidação;
- comportamento de logout;
- proteção contra respostas antigas;
- cancelamento de requisições;
- controle de geração/invalidação;
- ocultação imediata em falhas, expiração ou troca de identidade.

A revalidação periódica válida de 30 segundos deve continuar mantendo conteúdo, foco, scroll e layout estáveis.

Montagem, foco, `pageshow`, retorno de visibilidade, mudança de identidade, logout, expiração e respostas inválidas devem continuar protegendo ou ocultando o conteúdo conforme a implementação aprovada.

Não usar:

- `router.refresh()` para resolver apresentação;
- `window.location.reload()`;
- `flushSync`;
- manipulação direta do DOM;
- `suppressHydrationWarning`;
- desativação de SSR;
- filtragem do administrador para esconder a duplicação;
- nova chamada periódica;
- nova dependência.

Responsividade e acessibilidade

Valide desktop e celular.

Garanta:

- títulos em hierarquia correta;
- marcador administrativo legível;
- cartões sem estouro horizontal;
- e-mails e textos longos com quebra segura;
- foco visível;
- controles de paginação acessíveis por teclado;
- `aria-current` quando aplicável;
- nenhum conteúdo privado anunciado ou exibido durante estados inválidos;
- ausência de mudanças desnecessárias de layout durante revalidação.

Testes

Atualize ou adicione testes significativos para comprovar:

1. usuário comum continua vendo apenas `Meu cadastro`;
2. usuário comum não vê o painel administrativo;
3. administrador vê `ACESSO ADMINISTRATIVO`;
4. administrador vê `Painel administrativo`;
5. administrador não vê um bloco separado `Meu cadastro`;
6. todos os usuários continuam presentes na listagem;
7. o administrador autenticado aparece exatamente uma vez;
8. somente o administrador autenticado recebe `Você · Administrador`;
9. nenhum usuário comum recebe esse marcador;
10. primeira página não mostra `Primeira página`;
11. `Próxima página` aparece somente com `nextCursor`;
12. página com `after` permite voltar à primeira;
13. CEP de oito dígitos é apresentado como `00000-000`;
14. o valor persistido do CEP não é alterado;
15. campos ausentes continuam exibindo `Não informado`;
16. logout continua revogando a sessão;
17. falha ou expiração continua ocultando conteúdo;
18. revalidação válida não altera `hidden`, foco, scroll ou layout;
19. nenhuma navegação do tipo `Document` ocorre na revalidação;
20. nenhuma duplicação de chamadas de sessão foi introduzida;
21. nenhuma mensagem inesperada em console ou `pageerror`;
22. desktop e celular preservam a responsividade.

Execute os testes canônicos do projeto para:

- concorrência/revalidação;
- UI completa;
- autenticação;
- autorização;
- lint;
- typecheck;
- build;
- validação documental;
- UTF-8;
- links e âncoras;
- `git diff --check`;
- Harness aplicável.

Não use dados pessoais reais nos testes ou nas capturas.

Capturas

Regere somente as evidências afetadas.

A captura administrativa deve usar exclusivamente dados sintéticos e mostrar:

- cabeçalho administrativo;
- título e descrição;
- pelo menos um registro;
- o marcador `Você · Administrador`;
- controles de paginação somente quando aplicáveis.

Atualize os pares desktop/celular correspondentes em `docs/harness/evidence/ui-captures/`.

Preserve por hash todas as capturas não afetadas.

Não inclua nas evidências:

- nome da Anna Julia;
- e-mails reais;
- endereços reais;
- dados familiares;
- indicador de desenvolvimento do Next.js;
- extensões do navegador;
- DevTools.

Documentação

Salve este prompt integral em um novo arquivo apropriado dentro de `docs/prompts/`.

Em `docs/AI_PROMPTS.md`, adicione somente uma entrada resumida com link para o prompt integral.

Atualize a documentação canônica da UI já existente. Não crie uma nova trilha paralela e não renomeie novamente as pastas de capturas.

Registre:

- razão da apresentação distinta para `user` e `admin`;
- decisão de manter o administrador dentro da listagem;
- remoção da duplicação visual;
- regras de paginação;
- formatação apenas visual do CEP;
- resultado dos testes;
- capturas afetadas.

Restrições

- Não alterar banco, API ou autorização.
- Não implementar bootstrap administrativo.
- Não criar usuário padrão.
- Não rebaixar nem promover contas.
- Não usar os dados reais presentes na captura manual.
- Não misturar esta alteração com outras melhorias.
- Não fazer commit, push ou publicação.
- Não apagar evidências históricas relevantes.
- Não alterar arquivos não relacionados.

Entrega esperada

Ao concluir, apresente:

1. resumo objetivo das alterações;
2. arquivos modificados;
3. comportamento final de `user` e `admin`;
4. decisão tomada sobre a navegação autenticada e sua justificativa;
5. testes executados e resultados;
6. capturas atualizadas e hashes preservados;
7. documentação atualizada;
8. pendências reais;
9. diff exclusivo deste refinamento;
10. diff acumulado, se existir;
11. sugestão de título e descrição para um commit isolado, sem executá-lo.