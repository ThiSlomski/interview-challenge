# Lições verificadas

28/10/2026 · origem H-001 · status observado · evidência [demo](../evidence/demo.md).

- `npm test` retorna 0 por placeholder; não usar como aprovação funcional.
  Reutilizar este cuidado enquanto o runner real não existir.
- Chamada REST genérica não satisfaz clima de amanhã; verificar payload, destino
  e data no navegador quando a funcionalidade for implementada.
- Leitura de TOML não prova seleção nativa de papel; handler não prova evento.
  Manter os estados separados em qualquer evolução de integração.
- Python não está operacional nesta sessão; usar verificação Node e registrar
  a indisponibilidade do validador oficial, sem instalar por conta própria.
- Fetch web `.md` falhou por content-type; o endpoint oficial respondeu por HTTPS
  no PowerShell. Reutilizar alternativa somente se necessário.

H-002, 28/10/2026 · origem revisão dos cinco achados · evidência
[correções](../evidence/corrections.md): baseline de fixture deve passar antes da
mutação, e erros posteriores devem ser exatamente os esperados. Código 0 não
substitui relatório de casos reais; nome de arquivo TODO e echo antes de runner
não tornam um comando placeholder. Falha Git não é árvore limpa; ausência de
habilitação/camada efetiva não é disponibilidade operacional.

DB-001, 29/10/2026 · origem: implementação/revisão Banco/Backend; evidência
[banco](../evidence/database.md): conexão em DBeaver/VS Code, conexão do driver e
migrations são verificações distintas. Testes offline do runner podem passar sem
PostgreSQL e nunca comprovam constraints/grants. Não extrair credenciais salvas;
confirmar destino efetivo e inventariar antes de modificar banco existente.
Grants por coluna e revisão dos defaults evitam conceder edição/exclusão/promoção
sem requisito; ausência de revogação global não permite prometer isolamento entre
bancos. Atualização do usuário sobre destino exclusivo cancelou o plano de cluster
efêmero antes de sua execução; não retomá-lo automaticamente em outra sessão.
