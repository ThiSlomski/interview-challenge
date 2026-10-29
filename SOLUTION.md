# Estado da solução

Em 28/10/2026 existe o esqueleto Next.js estabilizado e o
[Harness local de desenvolvimento](docs/HARNESS.md). Cadastro, persistência,
login/sessão, autorização, logout e previsão do tempo não estão implementados.
Banco, autenticação e runner de testes funcionais ainda serão escolhidos.

Para executar o esqueleto, use Node 22.13.1/npm 10.9.2:

```powershell
npm ci
npm run dev
```

Acesse http://localhost:3000. A tela mostra apenas a mensagem de `/api/v1`.
O template [.env.example](.env.example) lista variáveis futuras; não são decisões
operacionais de banco/auth. Não há instrução de migration ou provisionamento de
admin executável ainda. Nunca versione arquivos `.env` preenchidos.

Para operar e retomar o Harness, sem instalar dependências adicionais:

```powershell
node scripts/harness/harness.mjs doctor
node scripts/harness/harness.mjs validate
node scripts/harness/harness.mjs verify
node scripts/harness/harness.mjs checkpoint
```

Antes de retomar, leia [handoff](docs/harness/memory/handoff.md) e confira Git.
`verify --product` evidencia ausência de testes funcionais e deve falhar neste estado.
`npm test` é placeholder. CI existente: Node 20, lint/typecheck/build, placeholder
test e audit report-only. Não modificado nem disparado nesta etapa; verde remoto
não confirmado. Build/audit anteriores estão identificados como históricos.

Confira [requisitos e lacunas](docs/REQUIREMENTS.md),
[verificações e limitações](docs/harness/evidence/demo.md) e
[decisões](docs/ARCHITECTURE.md). Próxima etapa recomendada: planejar contrato
conjunto cadastro/persistência/autenticação do README antes de implementação,
incluindo aceite para `401`, `403`, próprio registro, admin e logout.
Revisão humana permanece pendente. Nenhum commit, push ou deploy foi feito.
