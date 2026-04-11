# 07 — Design UI/UX

---

## 1. Princípios de Design

- **Mobile-first**: projetado primeiro para telas pequenas, depois escalado para desktop
- **Clareza financeira**: números grandes, formatação clara em R$, cores com significado
- **Ação imediata**: marcar pagamentos com um toque, sem fluxos longos
- **Confiança visual**: interface limpa, profissional — dados financeiros pedem seriedade

---

## 2. Paleta de Cores

```
Primária:     #1e40af  (Azul escuro — ações principais, nav ativa)
Secundária:   #3b82f6  (Azul médio — botões, links)
Sucesso:      #16a34a  (Verde — recebimentos, positivo, baixa efetuada)
Perigo:       #dc2626  (Vermelho — contas a pagar, vencidas, deletar)
Alerta:       #d97706  (Âmbar — vencendo, atenção)
Neutro:       #64748b  (Cinza — textos secundários, bordas)
Fundo:        #f8fafc  (Cinza levíssimo — background da app)
Card:         #ffffff  (Branco — cards e modais)

Dark mode:
Fundo:        #0f172a
Card:         #1e293b
Texto:        #f1f5f9
```

---

## 3. Tipografia

```
Fonte:        Inter (Google Fonts) — moderna, legível em telas
Título H1:    32px bold
Título H2:    24px semibold
Título H3:    18px semibold
Corpo:        14px regular
Caption:      12px regular
Valor grande: 28-36px bold (KPIs do dashboard)
```

---

## 4. Layout Geral

### Mobile (< 768px)
```
┌────────────────────┐
│  ☰  Controle Fin.  │  ← Header com menu hamburger
├────────────────────┤
│                    │
│   CONTEÚDO         │  ← Área de conteúdo
│   (scroll)         │
│                    │
├────────────────────┤
│ 🏠 💰 📊 ⚙️        │  ← Bottom Navigation Bar
└────────────────────┘
```

### Desktop (≥ 1024px)
```
┌──────┬─────────────────────────────────┐
│      │  Header: título + usuário        │
│ NAV  ├─────────────────────────────────┤
│      │                                  │
│ Side │   CONTEÚDO PRINCIPAL             │
│ bar  │   (grid responsivo)              │
│      │                                  │
│      │                                  │
└──────┴─────────────────────────────────┘
```

---

## 5. Telas e Fluxos

### 5.1 Tela de Login
```
┌─────────────────────────────┐
│     [LOGO]                  │
│  Controle Financeiro        │
│  Familiar                   │
│                             │
│  [E-mail          ]         │
│  [Senha           ] [👁]    │
│                             │
│  [   Entrar   ]             │
│                             │
│  Esqueci minha senha        │
└─────────────────────────────┘
```
- Autenticação Firebase
- Redireciona para Dashboard
- Trata erros: credenciais inválidas, conta bloqueada

---

### 5.2 Dashboard Principal
```
┌─────────────────────────────────────────────┐
│ Olá, Diogo!  Abril 2026        🔔  👤       │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ │ SALDO    │ │ A PAGAR  │ │  A RECEBER   │  │
│ │ TOTAL    │ │ (mês)    │ │  (mês)       │  │
│ │ R$12.450 │ │ R$3.200  │ │  R$5.800     │  │
│ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────┤
│  📊 Pagamentos vs Recebimentos (6 meses)    │
│  [████████████ gráfico de barras ]          │
├─────────────────────────────────────────────┤
│ Portadores                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│ │ 🏦 Itaú  │ │ 💳 Nubank│ │ 💰 Dinheiro  │  │
│ │ R$8.200  │ │ R$3.150  │ │  R$1.100     │  │
│ └──────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────┤
│ ⚠️ Vencendo em 7 dias        Ver todas →   │
│ • Energia Elétrica    R$280   Vence 10/04  │
│ • Internet            R$120   Vence 12/04  │
├─────────────────────────────────────────────┤
│ 🔴 Em Atraso                  Ver todas →  │
│ • Água                R$95    Venceu 02/04 │
└─────────────────────────────────────────────┘
```

---

### 5.3 Contas

> **Decisão de design (implementada)**: a abordagem original com navegador de meses e `contapagamentos` foi descartada. O usuário preferiu uma lista estática de contas cadastradas com marcação manual persistente.

```
┌──────────────────────────────────────────────────────┐
│ Contas             [🖨 Imprimir] [Reiniciar(3)] [+ Nova] │
├──────────────────────────────────────────────────────┤
│  [A Pagar]   [A Receber]                             │
├──────────────────────────────────────────────────────┤
│  Total: R$5.400  Pago: R$3.200  Restante: R$2.200    │
├──────────────────────────────────────────────────────┤
│ --- Diogo Marcel ---                                 │
│ [✓] 05  Energia Elétrica    🔄  R$280               │
│ [✓] 10  Internet            🔄  R$120               │
│ [ ]     Condomínio              R$350               │
├──────────────────────────────────────────────────────┤
│ --- Valéria Korb ---                                 │
│ [✓] 15  Plano de saúde      📄  R$890               │
│ [ ]     Academia                R$120               │
└──────────────────────────────────────────────────────┘
```

**Comportamento**:
- Lista **estática** de contas cadastradas — sem navegação por mês
- Dia de vencimento exibido antes da descrição (quando preenchido)
- Checkbox por conta: click marca/desmarca. Marcação persistida no banco (`conta.marcado`)
- Marcação **compartilhada**: qualquer dispositivo/usuário vê o mesmo estado em tempo real
- Totais em tempo real: Total | Pago | Restante (labels curtos em mobile)
- Botão "Reiniciar (N)": desmarca todas as contas da aba atual (N = qtd marcadas)
- Botão "Imprimir": navega para `/contas/imprimir`
- Atualização otimista: UI responde imediatamente ao click sem aguardar API
- Admin: ícone de lápis/lixeira aparecem no hover para editar/excluir a conta

---

### 5.4 Formulário de Conta (modal)
```
┌──────────────────────────────────────────────┐
│ Nova Conta                              [✕]  │
├──────────────────────────────────────────────┤
│ Descrição: [                ] Valor: [R$  ]  │
│ Dia venc.: [ 1-31 ]                          │
│ Membro:    [Diogo ▼]  Credor: [CEMIG ▼]     │
│                                              │
│ Flags:                                       │
│ [ ] Anual          [ ] Débito em cartão      │
│ [ ] Débito auto    [ ] Pagamento manual      │
│ [ ] Pertence à folha                         │
│                                              │
│ Tags: [Moradia] [Fixo] [+]                   │
├──────────────────────────────────────────────┤
│                      [Cancelar]  [Salvar]    │
└──────────────────────────────────────────────┘
```

---

### 5.4b Relatório de Impressão (`/contas/imprimir`)

Layout A4 compacto para impressão mensal.

```
┌────────────────────────────────────────────────────┐
│ Contas a Pagar                    Total: R$4.320   │
│ abril 2026                                         │
├──────────────────────────────────────────────────  │
│ COMPARTILHADO                         R$2.800      │
│ Dia  Descrição          Credor    Valor       [✓]  │
│ 05   Energia Elétrica   CEMIG     R$280,00    [ ]  │
│ 10   Internet           Vivo      R$120,00    [ ]  │
│ 15   Condomínio         —         R$350,00    [ ]  │
├──────────────────────────────────────────────────  │
│ DIOGO MARCEL                          R$1.520      │
│ 20   Plano de saúde     Unimed    R$890,00    [ ]  │
│ —    Academia           —         R$120,00    [ ]  │
├──────────────────────────────────────────────────  │
│ 8 contas · 26/04/2026              Total: R$4.320  │
└────────────────────────────────────────────────────┘
```

**Comportamento**:
- Filtra apenas contas com `debitoauto = true` ou `pagamentomanual = true`
- Ordenado por `diavencimento` (crescente, nulos no fim), depois por descrição
- Agrupado por membro da família com subtotal por grupo
- Linhas alternadas (zebra) para facilitar leitura à mão
- Checkbox manual na última coluna para marcar fisicamente na folha impressa
- Botão "Imprimir / Salvar PDF": aciona `window.print()`
- Barra de navegação e controles somem automaticamente na impressão (`print:hidden`)

---

### 5.5 Portadores
```
┌─────────────────────────────────────────────┐
│ Portadores                     [+ Novo]      │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐    │
│ │ 🏦 Itaú CC        Conta Corrente      │    │
│ │    Diogo          R$ 8.200,00  ↗+5% │    │
│ │    [Ver Histórico]  [Lançar Saldo]   │    │
│ └───────────────────────────────────────┘    │
│ ┌───────────────────────────────────────┐    │
│ │ 💳 Nubank         Conta Corrente      │    │
│ │    Diogo          R$ 3.150,00  ↘-2% │    │
│ └───────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

### 5.6 Tela: Histórico do Portador
```
┌─────────────────────────────────────────────┐
│ ← Itaú CC — Histórico                       │
├─────────────────────────────────────────────┤
│  [Gráfico de linha: evolução do saldo]       │
│  ╭──────────────────────────────────╮       │
│  │  R$8k ─────────────────────────  │       │
│  │  R$6k ─────╮                    │       │
│  │  R$4k      ╰──────╮             │       │
│  │           Jan Feb Mar Abr       │       │
│  ╰──────────────────────────────────╯       │
├─────────────────────────────────────────────┤
│ Data        Valor        Saldo              │
│ 01/04/2026  +R$5.200    R$8.200            │
│ 25/03/2026  -R$1.500    R$3.000            │
│ 01/03/2026  +R$5.200    R$4.500            │
└─────────────────────────────────────────────┘

[+ Lançar Saldo]  [↔️ Transferir]
```

---

### 5.7 Relatórios
```
┌─────────────────────────────────────────────┐
│ Relatórios                                   │
├─────────────────────────────────────────────┤
│ ┌────────────────┐  ┌────────────────────┐  │
│ │ 📊 Saldo por   │  │ 🥧 Gastos por      │  │
│ │    Portador    │  │    Categoria        │  │
│ └────────────────┘  └────────────────────┘  │
│ ┌────────────────┐  ┌────────────────────┐  │
│ │ 📈 Evolução    │  │ ⛽ Abastecimentos  │  │
│ │    Financeira  │  │    e Veículos       │  │
│ └────────────────┘  └────────────────────┘  │
│ ┌────────────────┐                          │
│ │ 📄 Extrato     │                          │
│ │    Detalhado   │                          │
│ └────────────────┘                          │
└─────────────────────────────────────────────┘
```

---

## 6. Componentes UI Reutilizáveis

| Componente | Descrição |
|-----------|-----------|
| `CurrencyDisplay` | Exibe valor em R$ com formatação brasileira |
| `MonthNavigator` | Navegar entre meses (< Março Abril Maio >) |
| `StatusBadge` | Badge colorido: Pago / Pendente / Vencido / Vencendo |
| `AccountCard` | Card de conta com valor, status e ações |
| `PortadorCard` | Card de portador com saldo e tendência |
| `ConfirmDialog` | Modal de confirmação para ações destrutivas |
| `LoadingSpinner` | Indicador de carregamento |
| `ToastMessage` | Notificação de sucesso/erro temporária |
| `ChartCard` | Container para gráficos com título e filtros |
| `EmptyState` | Estado vazio com ícone e CTA |
| `FilterBar` | Barra de filtros com chips selecionáveis |

---

## 7. Navegação

### Menu Principal
```
🏠 Dashboard
💰 Contas do Mês
  ├── A Pagar
  └── A Receber
🏦 Portadores
💳 Cartões
👥 Membros
📊 Relatórios
⛽ Veículos
🏠 Aluguéis
💼 FGTS
🏷️ Tags / Credores
⚙️ Configurações
```

---

## 8. Estados de Interface

| Estado | Tratamento |
|--------|-----------|
| Carregando | Skeleton loaders (não spinner bloqueante) |
| Lista vazia | Ilustração + texto + botão de criar |
| Erro de API | Toast vermelho + botão de retry |
| Offline | Banner de aviso + dados em cache |
| Sucesso de ação | Toast verde por 3 segundos |
| Confirmação de delete | Modal bloqueante com texto "Tem certeza?" |
