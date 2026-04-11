# 03 — Requisitos Funcionais

> Todos os requisitos têm IDs rastreáveis do formato `MODULE-NN`.  
> Cada ID pode ser linkado a commits, tarefas e testes.

---

## AUTH — Autenticação e Autorização

| ID | Requisito | Prioridade |
|----|-----------|------------|
| AUTH-01 | O sistema deve autenticar usuários via Firebase Authentication (email/senha) | Alta |
| AUTH-02 | O sistema deve suportar dois perfis: Admin e Viewer | Alta |
| AUTH-03 | Admin tem acesso total (criar, editar, excluir, visualizar) | Alta |
| AUTH-04 | Viewer tem acesso somente leitura (dashboards e relatórios) | Alta |
| AUTH-05 | Sessão deve persistir via token JWT com renovação automática | Alta |
| AUTH-06 | O sistema deve redirecionar para login ao acessar rota protegida sem sessão | Alta |
| AUTH-07 | Deve haver tela de login com feedback de erro amigável | Alta |
| AUTH-08 | Logout deve invalidar a sessão localmente | Alta |

---

## DASH — Dashboard Principal

| ID | Requisito | Prioridade |
|----|-----------|------------|
| DASH-01 | Exibir saldo total de todos os portadores | Alta |
| DASH-02 | Exibir total de contas a pagar no mês atual | Alta |
| DASH-03 | Exibir total de contas a receber no mês atual | Alta |
| DASH-04 | Exibir saldo líquido projetado (receber - pagar) | Alta |
| DASH-05 | Gráfico de barras: pagamentos vs recebimentos dos últimos 6 meses | Alta |
| DASH-06 | Gráfico de pizza: distribuição de gastos por categoria/tag | Média |
| DASH-07 | Lista de contas vencendo nos próximos 7 dias | Alta |
| DASH-08 | Lista de contas em atraso (vencidas e não baixadas) | Alta |
| DASH-09 | Gráfico de linha: evolução do saldo total ao longo do tempo | Média |
| DASH-10 | Cards de saldo por portador com ícone | Alta |

---

## MBR — Membros da Família

| ID | Requisito | Prioridade |
|----|-----------|------------|
| MBR-01 | CRUD completo de membros da família | Alta |
| MBR-02 | Cada membro deve ter nome e imagem/avatar | Média |
| MBR-03 | Listar membros com seus portadores e totais | Média |

---

## PORT — Portadores (Contas/Carteiras)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| PORT-01 | CRUD completo de portadores | Alta |
| PORT-02 | Tipos suportados: Conta Corrente (C), Dinheiro (D), Investimento (I), Poupança (P) | Alta |
| PORT-03 | Portador vinculado a um membro da família | Alta |
| PORT-04 | Exibir saldo atual do portador (último registro de `saldoportador`) | Alta |
| PORT-05 | Registrar lançamentos de saldo (entrada de valor por data) | Alta |
| PORT-06 | Exibir histórico de saldo do portador com gráfico de evolução | Alta |
| PORT-07 | Transferência entre portadores com registro em ambos | Alta |
| PORT-08 | Ícone/imagem do portador configurável | Média |
| PORT-09 | Saldo detalhado com diferença e acumulado por data | Média |

---

## CONT — Contas a Pagar e Receber

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CONT-01 | CRUD completo de contas | Alta |
| CONT-02 | Tipo da conta: Pagar (P) ou Receber (R) | Alta |
| CONT-03 | Campos: descrição, valor, tipo, credor, membro, parcelas, dia de vencimento (1–31, opcional), flags | Alta |
| CONT-04 | Flags disponíveis: anual, pertence à folha, débito em cartão, débito automático, pagamento manual | Alta |
| CONT-05 | Listar contas estáticas com checkbox de marcação (sem navegação por mês) | Alta |
| CONT-06 | Marcação de conta (`conta.marcado`) persistida no banco e compartilhada entre dispositivos | Alta |
| CONT-07 | Botão "Reiniciar": desmarca todas as contas do tipo atual de uma vez | Alta |
| CONT-08 | Totais em tempo real: Total \| Marcado \| Restante por aba (Pagar/Receber) | Alta |
| CONT-09 | Contas anuais geram apenas uma ocorrência por ano | Alta |
| CONT-10 | Contas parceladas geram N ocorrências mensais | Média |
| CONT-11 | Associar tags a contas (múltiplas) | Média |
| CONT-12 | Contas com débito em cartão mostram o cartão associado | Média |
| CONT-13 | Valor total das contas do mês (pagar e receber separados) | Alta |
| CONT-14 | Relatório imprimível de contas a pagar: apenas débito automático e pagamento manual, ordenado por dia de vencimento | Alta |

---

## EXTRATO — Extrato de Movimentações

| ID | Requisito | Prioridade |
|----|-----------|------------|
| EXT-01 | Exibir extrato cronológico de movimentações | Alta |
| EXT-02 | Tipos de lançamento: saldo inicial (=), pagamento (P), recebimento (R) | Alta |
| EXT-03 | Exibir saldo acumulado após cada lançamento | Alta |
| EXT-04 | Filtrar por período (data início/fim) | Alta |
| EXT-05 | Filtrar por tipo de lançamento | Média |
| EXT-06 | Exportar extrato como CSV ou PDF | Média |

---

## CRED — Credores

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CRED-01 | CRUD completo de credores | Alta |
| CRED-02 | Credor vinculado ao membro da família | Média |
| CRED-03 | Listar contas associadas a cada credor | Média |

---

## CART — Cartões de Crédito

| ID | Requisito | Prioridade |
|----|-----------|------------|
| CART-01 | CRUD completo de cartões | Alta |
| CART-02 | Campos: nome, dia vencimento, bandeira, membro | Alta |
| CART-03 | Listar despesas do cartão | Alta |
| CART-04 | Lançar despesas no cartão | Alta |
| CART-05 | Total de gastos no cartão por mês | Média |

---

## FGTS — Controle de FGTS

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FGTS-01 | CRUD de registros de FGTS por membro | Alta |
| FGTS-02 | Campos: nr OPI, saldo, senha (armazenada criptografada) | Alta |
| FGTS-03 | Histórico de saldos FGTS | Média |

---

## VEI — Veículos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| VEI-01 | CRUD completo de veículos | Alta |
| VEI-02 | Campos: modelo, marca, cor, data compra/venda, valor compra/venda | Alta |
| VEI-03 | Indicar veículo como vendido (data/valor venda) | Média |

---

## ABAST — Abastecimentos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| ABAST-01 | CRUD de abastecimentos por veículo | Alta |
| ABAST-02 | Campos: data, total, km, litros, observação | Alta |
| ABAST-03 | Calcular consumo médio (km/litro) por veículo | Média |
| ABAST-04 | Gráfico de custo por abastecimento ao longo do tempo | Média |
| ABAST-05 | Relatório de abastecimentos com totais | Média |

---

## ALU — Aluguéis

| ID | Requisito | Prioridade |
|----|-----------|------------|
| ALU-01 | Lançamentos mensais de aluguel (data + valor) | Alta |
| ALU-02 | Itens compostos por mês: descrição, valor, tipo (V/S/F) | Alta |
| ALU-03 | Tipo V (valor fixo): entra diretamente no total do mês | Alta |
| ALU-04 | Tipo S (compartilhado): rateado entre todos os meses do ano automaticamente | Alta |
| ALU-05 | Tipo F (free): informativo, não entra no cálculo | Média |
| ALU-06 | Template global de itens: aplicado automaticamente ao criar novo mês | Alta |
| ALU-07 | CRUD completo do template (GET/POST/PUT/DELETE /alugueis/template) | Alta |

---

## TAGS — Etiquetas/Categorias

| ID | Requisito | Prioridade |
|----|-----------|------------|
| TAG-01 | CRUD completo de tags | Alta |
| TAG-02 | Associar múltiplas tags a uma conta | Alta |
| TAG-03 | Filtrar contas por tag | Média |
| TAG-04 | Relatório de gastos agrupados por tag | Média |

---

## REL — Relatórios e Gráficos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| REL-01 | Relatório de saldo por portador com gráfico de linha temporal | Alta |
| REL-02 | Relatório de contas a pagar/receber por mês (comparativo) | Alta |
| REL-03 | Relatório de abastecimentos com gráfico de consumo | Média |
| REL-04 | Gráfico de distribuição de gastos por categoria/tag | Alta |
| REL-05 | Relatório de extrato detalhado por período | Alta |
| REL-06 | Todos os gráficos interativos (zoom, hover, filtro) | Alta |
| REL-07 | Exportar relatórios como PDF | Baixa |
| REL-08 | Relatório de saldo FGTS histórico | Baixa |
