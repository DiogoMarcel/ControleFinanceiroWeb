# 02 — Análise do Sistema Atual (Delphi)

> **Objetivo**: Mapear completamente o sistema Delphi para garantir que nada seja perdido na migração web.

---

## 1. Arquitetura Atual

```
Delphi Desktop App
├── Padrão: MVC (Model-View-Controller)
├── Banco: PostgreSQL (local ou rede local)
├── Auth: Firebase Authentication + Realtime DB
├── UI: VCL (Visual Component Library) — apenas Windows
└── Relatórios: FastReport (componente Delphi)
```

**Estrutura de pastas**:
```
controleFinanceiro/
├── cadastros/          # Módulo principal de cadastros
│   ├── controllers/    # Lógica de negócio
│   ├── views/         # Telas (forms Delphi)
│   ├── models/        # Modelos de dados
│   └── dataModels/    # DataModules (conexão DB)
├── alugueis/           # Módulo de aluguéis
├── relatorios/         # Relatórios (FastReport)
├── library/            # Biblioteca compartilhada
│   ├── lib.DAO/        # Data Access Objects
│   ├── lib.Firebase/   # Integração Firebase
│   ├── lib.conexao.db/ # Conexão PostgreSQL
│   └── lib.login/      # Tela e lógica de login
├── consts/             # Constantes e enumerações
├── SQLs/               # Scripts SQL do banco
└── EsteticaProj/       # Sub-projeto (fora do escopo fase 1)
```

---

## 2. Módulos e Funcionalidades Mapeadas

### 2.1 Módulo: Membros da Família
**Arquivo**: `view.cadastro.membrofamilia.*`
- CRUD de membros da família
- Cada membro pode ter: portadores (contas), cartões, contas a pagar/receber, FGTS

### 2.2 Módulo: Portadores (Contas Bancárias/Carteiras)
**Arquivo**: `view.cadastro.portador.*`, `model.cadastro.portador.pas`
- Tipos: `C` = Conta Corrente, `D` = Dinheiro, `I` = Investimento, `P` = Conta Poupança
- Cada portador tem imagem associada
- Vinculado ao membro da família
- **Saldo Portador**: histórico de valores por data (tabela `saldoportador`)
- **Transferência entre portadores**: `view.cadastro.saldoportador.transferencia.*`
- **Saldo Detalhado**: histórico acumulado (tabela `saldodetalhadoportador`)

### 2.3 Módulo: Contas a Pagar
**Arquivo**: `view.cadastro.conta.pagar.*`, `model.cadastro.conta.pagar.pas`
- Tipo `P` (Pagar) na tabela `conta`
- Pode ser: anual, pertence à folha, débito em cartão, pagamento manual, débito automático
- Tem credores associados
- Installments (qtdparcela)
- **Pagamentos mensais**: tabela `contapagamentos` (dataconta, databaixa, baixaefetuada)
- Auto-geração mensal via função PostgreSQL `contapagamentos_func()`

### 2.4 Módulo: Contas a Receber
**Arquivo**: `view.cadastro.conta.receber.*`, `model.cadastro.conta.receber.pas`
- Tipo `R` (Receber) na tabela `conta`
- Mesma estrutura de contas a pagar
- Recebimentos mensais com baixa

### 2.5 Módulo: Credores
**Arquivo**: `view.cadastro.credor.*`
- Cadastro de credores (empresas/pessoas para quem se paga)
- Vinculado ao membro da família

### 2.6 Módulo: Cartão de Crédito
**Arquivo**: `view.cadastro.cartao.*`, `view.cadastro.despesacartao.*`
- Cadastro do cartão (nome, dia vencimento, bandeira, membro)
- **Despesas do Cartão**: lançamento de gastos no cartão
- Contas podem ser debitadas em cartão (`debitacartao = true`)

### 2.7 Módulo: Extrato de Saldo
**Arquivo**: `view.relatorio.saldoextrato.*`
- Tabela `saldoextrato`: extrato cronológico
- Tipos: `=` (saldo inicial), `P` (pagamento), `R` (recebimento)
- Campos: datalancamento, tiposaldo, valor, saldo acumulado, descricao, id_conta

### 2.8 Módulo: Relatórios
**Arquivo**: `relatorios/views/`
- **Saldo Detalhado por Portador**: visão de evolução do saldo de cada conta
- **Saldo Detalhado por Portador (Gráfico)**: versão com gráfico
- **Saldo Detalhes**: detalhamento de movimentações
- **Extrato**: extrato geral de movimentações
- **Abastecimentos**: relatório de abastecimentos de veículos

### 2.9 Módulo: FGTS
**Arquivo**: `view.cadastro.saldofgts.*`
- Tracking de saldo FGTS por membro
- Nr OPI, saldo, senha de consulta

### 2.10 Módulo: Veículos
**Arquivo**: `view.cadastro.veiculos.*`
- Cadastro de veículos (modelo, marca, cor, datacompra/venda, valores)

### 2.11 Módulo: Abastecimentos
**Arquivo**: `view.cadastro.abastecimentos.*`
- Registro de abastecimentos por veículo
- Dados: data, total, km, litros, observação

### 2.12 Módulo: Aluguéis
**Arquivo**: `alugueis/`
- Editor de aluguéis
- Lançamentos de aluguel

### 2.13 Módulo: Tags
**Arquivo**: `view.cadastro.tags.*`
- Tags para categorizar contas
- Relação N:N com contas via `contatag`

### 2.14 Autenticação
**Arquivo**: `library/lib.login/`, `library/lib.Firebase/`
- Firebase Authentication
- Firebase Realtime Database para configurações
- Login com tela própria

---

## 3. Banco de Dados — Tabelas Identificadas

| Tabela | Descrição | Registros Estimados |
|--------|-----------|---------------------|
| `membrofamilia` | Membros da família | < 10 |
| `portador` | Contas/carteiras | < 20 |
| `saldoportador` | Histórico de saldo | Médio |
| `saldodetalhadoportador` | Saldo detalhado acumulado | Médio |
| `conta` | Contas a pagar/receber | < 200 |
| `contapagamentos` | Pagamentos mensais | Grande |
| `contatag` | Tags de contas | Médio |
| `cartao` | Cartões de crédito | < 10 |
| `credor` | Credores | < 100 |
| `saldofgts` | Saldo FGTS | < 10 |
| `saldoextrato` | Extrato de movimentações | Grande |
| `veiculos` | Veículos | < 10 |
| `abastecimentos` | Abastecimentos | Médio |
| `tags` | Tags de categorização | < 50 |

**Views PostgreSQL**:
- `tipocontadebitocredito` — mapeamento de tipo de conta
- `tipocontaportador` — mapeamento de tipo de portador

**Funções PostgreSQL**:
- `contapagamentos_func()` — auto-gera registros mensais de pagamento
- `contapagamentos_updatedatabaixa_func()` — trigger para data de baixa
- `saldodetalhadoportador_func()` — atualiza saldo detalhado ao inserir/atualizar saldo

---

## 4. Regras de Negócio Críticas

| ID | Regra |
|----|-------|
| RN-01 | Toda conta gera um `contapagamentos` para cada mês (auto pela função do DB) |
| RN-02 | Quando `baixaefetuada` é marcada como `true`, `databaixa` é preenchida automaticamente (trigger) |
| RN-03 | Portador pode ser Corrente, Dinheiro, Investimento ou Poupança |
| RN-04 | Conta pode ser do tipo Pagar (P) ou Receber (R) |
| RN-05 | Conta anual (`contaanual = true`) gera apenas um pagamento por ano |
| RN-06 | Conta com `debitacartao = true` está associada a um cartão de crédito |
| RN-07 | Saldo do portador é calculado acumulativamente (tabela `saldodetalhadoportador`) |
| RN-08 | FGTS tem senha própria de consulta por membro |
| RN-09 | Tags são opcionais e podem ser múltiplas por conta (N:N) |
| RN-10 | Transferência entre portadores afeta o saldo de ambos |

---

## 5. Gaps / Melhorias na Migração Web

| Gap | Situação Atual | Melhoria na Web |
|-----|----------------|-----------------|
| Acesso remoto | Não existe | Nativo (web) |
| Mobile | Não existe | Responsivo + PWA |
| Multi-usuário | Não existe | Por perfil (Admin/Viewer) |
| Gráficos interativos | Gráfico estático FastReport | Recharts interativo |
| Dashboard | Não existe | Dashboard principal com KPIs |
| Notificações | Não existe | Alertas de contas vencendo |
| Export PDF/Excel | Via FastReport | Via download browser |
| Dark mode | Não existe | Suportado |
