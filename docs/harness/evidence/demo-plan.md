# Contratos da demonstração H-001

Data/origem: 28/10/2026, Prompt 5. Estado: critérios definidos antes da avaliação.
Orçamento: até 60 minutos para implementação/verificações e 10 minutos por análise;
uma execução + até duas correções por problema, interromper no limite e registrar.
Sem produto, CI remoto ou chamadas de avaliação por API. Orquestrador /root escreve
Harness e consolida execução; especialistas fazem leitura, Documentação consolida
a matriz após os retornos. Até duas instâncias trabalhando ao mesmo tempo.

Sucesso: quatro papéis exercitados com retornos reais; revisão independente
delimitada; doctor/validate funcionais; fixture inválida retorna não zero;
regras conferidas pelo Codex sem executar comandos; handler com entrada controlada;
retomada separada ou simulação identificada; nenhum arquivo funcional alterado.
Configuração, descoberta e disparo real são avaliados separadamente.

| ID | Papel / ganho | Fontes / requisitos | Escrita | Aceite e saída |
| --- | --- | --- | --- | --- |
| H-001-F | Frontend / leitura especializada independente | README 1,3,11–13; app/page.tsx, layout, components, services | nenhuma | Aderência por requisito, caminhos, comandos e lacunas; retorno ao orquestrador |
| H-001-B | Backend / avaliação especializada de controles | README 2–10,14–15, Parte 4; app/api, package, CI | nenhuma | API/auth/testes/CI existentes versus obrigatórios, evidência e limites |
| H-001-D | Banco / integridade e reprodutibilidade | README 1,4,8; inventário, package, arquitetura | nenhuma | Persistência/migrations/admin: fatos e lacunas, sem escolher tecnologia |
| H-001-X | Backend reutilizado / revisão independente | README 13 e caminhos UI/serviços; pergunta sem conclusão esperada | nenhuma | Julgar aderência ao requisito de previsão e justificar por arquivos |
| H-001-R | Documentação / consolidação após retornos | README completo, relatórios H-001-F/B/D/X | docs/REQUIREMENTS.md | Matriz com itens 1–18 e subdivisões, segurança, CI, IA, entrega; sem núcleo marcado implementado |
| H-001-H | Orquestrador / execução local | scripts, config, skills | Harness | Diagnósticos e controles positivos/negativos sanitizados |

Todos: ler definição do papel, skills pertinentes e política. Informar instância,
skills realmente carregadas, arquivos, decisões, comandos/resultados, riscos,
pendências e próxima ação. Sem delegação recursiva. Revisão de leitura é instrução,
não isolamento. Contexto herdado automaticamente quando aplicável será declarado;
não há comprovação de economia de tokens. Evidência final em demo.md e retornos
sanitizados consolidados pelo orquestrador, sem transcrição privada.
