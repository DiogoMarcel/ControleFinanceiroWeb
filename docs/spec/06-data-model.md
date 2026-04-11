# 06 — Modelo de Dados

> O banco PostgreSQL existente é **mantido**. O Prisma lerá o schema atual via `prisma db pull`.  
> Esta documentação serve como referência para entender todas as relações.

---

## 1. Diagrama de Entidades (ERD)

```
membrofamilia
    ├── portador (1:N)
    │       ├── saldoportador (1:N)
    │       └── saldodetalhadoportador (via trigger)
    ├── cartao (1:N)
    ├── conta (1:N)
    │       ├── contapagamentos (1:N)
    │       ├── contatag (1:N) → tags
    │       └── saldoextrato (1:N)
    ├── credor (1:N) ← conta (N:1)
    └── saldofgts (1:N)

veiculos
    └── abastecimentos (1:N)

tags ← contatag → conta

alugueis (independente)
```

---

## 2. Tabelas Detalhadas

### membrofamilia
```sql
idmembrofamilia  SERIAL PRIMARY KEY
nome             VARCHAR(50) NOT NULL
-- campo de imagem pode ser adicionado (url ou base64)
```

### portador
```sql
idportador       SERIAL PRIMARY KEY
nome             VARCHAR(50) NOT NULL
tipoconta        CHAR(1) NOT NULL  -- C=Corrente, D=Dinheiro, I=Investimento, P=Poupança
id_membrofamilia INT NOT NULL → membrofamilia
imgportador      SMALLINT          -- índice de imagem
```

### saldoportador
```sql
idsaldoportador  SERIAL PRIMARY KEY
valor            DOUBLE PRECISION
datainclusao     DATE
reservado        BOOLEAN DEFAULT false
id_portador      INT NOT NULL → portador
contacapital     BOOLEAN DEFAULT false
```

### saldodetalhadoportador
```sql
-- Atualizado via trigger após INSERT/UPDATE em saldoportador
idsaldodetalhadoportador  SERIAL PRIMARY KEY
saldototal       DOUBLE PRECISION   -- pode ser NULL durante execução parcial do trigger
saldodisponivel  DOUBLE PRECISION
dataalteracao    DATE
diferenca        DOUBLE PRECISION
acumulado        DOUBLE PRECISION
```

> **Atenção**: O trigger pode inserir registros com `saldototal = NULL` (estado intermediário).
> Sempre filtrar `WHERE saldototal IS NOT NULL` ao buscar o valor canônico.
> O valor correto de referência é **103.832,51** (exclui portadores com `contacapital = true`).

### conta
```sql
idconta          SERIAL PRIMARY KEY
descricao        VARCHAR(50) NOT NULL
valor            DOUBLE PRECISION NOT NULL
tipoconta        CHAR(1) NOT NULL  -- P=Pagar, R=Receber
contaanual       BOOLEAN DEFAULT false
pertenceafolha   BOOLEAN DEFAULT false
debitacartao     BOOLEAN DEFAULT false
id_credor        INT → credor
id_membrofamilia INT → membrofamilia
pagamentomanual  BOOLEAN DEFAULT false
qtdparcela       INT
debitoauto       BOOLEAN DEFAULT false
marcado          BOOLEAN DEFAULT false  -- marcado como pago/recebido (compartilhado entre todos os usuários)
```

> **Nota**: `marcado` foi adicionado via migration (`prisma migrate dev --name add_marcado_to_conta`).
> Representa a marcação visual de "conta paga/recebida" na tela de Contas — compartilhada entre todos os dispositivos/usuários.
> O "Reiniciar" zera todas as marcações de um tipo (P ou R) de uma vez.

### contapagamentos
```sql
idcontapagamentos  SERIAL PRIMARY KEY
dataconta          DATE        -- mês de referência (sempre dia 01)
databaixa          DATE        -- preenchida automaticamente pelo trigger
baixaefetuada      BOOLEAN DEFAULT false
id_conta           INT NOT NULL → conta

-- Índice único: (dataconta, id_conta) — evita duplicatas
-- Trigger: contapagamentos_upddatabaixa → preenche databaixa ao marcar baixa
```

### contatag
```sql
idcontatag  SERIAL PRIMARY KEY
id_conta    INT → conta
id_tags     INT → tags
```

### tags
```sql
idtags      SERIAL PRIMARY KEY
descricao   VARCHAR(30)
```

### credor
```sql
idcredor         SERIAL PRIMARY KEY
nome             VARCHAR(?)
id_membrofamilia INT NOT NULL → membrofamilia
```

### cartao
```sql
idcartao         SERIAL PRIMARY KEY
nome             VARCHAR(30) NOT NULL
diavencimento    SMALLINT
bandeira         VARCHAR(10)
id_membrofamilia INT → membrofamilia
```

### saldofgts
```sql
idsaldofgts      SERIAL PRIMARY KEY
nropis           VARCHAR(15) NOT NULL
saldo            DOUBLE PRECISION
senha            VARCHAR(40)  -- deve ser criptografada
id_membrofamilia INT → membrofamilia
```

### saldoextrato
```sql
idsaldoextrato   SERIAL PRIMARY KEY
datalancamento   DATE NOT NULL DEFAULT CURRENT_DATE
tiposaldo        CHAR(1) NOT NULL  -- ==Inicial, P=Pagamento, R=Recebimento
valor            FLOAT NOT NULL
saldo            FLOAT NOT NULL
descricao        VARCHAR(50) NOT NULL
id_conta         INT → conta
```

### veiculos
```sql
idveiculo    SERIAL PRIMARY KEY
modelo       CHAR(50) NOT NULL
marca        CHAR(50) NOT NULL
cor          CHAR(30) NOT NULL
datacompra   DATE NOT NULL
datavenda    DATE
valorcompra  FLOAT NOT NULL
valorvenda   FLOAT
```

### abastecimentos
```sql
idabastecimento      SERIAL PRIMARY KEY
observacao           CHAR(80)
dataabastecimento    DATE NOT NULL DEFAULT CURRENT_DATE
totalabastecimento   FLOAT NOT NULL
kmcarro              INT NOT NULL
quantidadelitros     FLOAT NOT NULL
id_veiculo           INT NOT NULL → veiculos
```

---

## 3. Funções e Triggers PostgreSQL (Manter)

### Trigger: contapagamentos_upddatabaixa
```sql
-- Executa BEFORE UPDATE em contapagamentos
-- Se baixaefetuada muda de false para true: databaixa = NOW()
-- IMPORTANTE: Esta lógica deve ser preservada no banco PostgreSQL
-- O backend NÃO deve setar databaixa manualmente
```

### Função: contapagamentos_func()
```sql
-- Verifica se já existem registros para o mês atual
-- Se não, gera entradas em contapagamentos para todas as contas ativas
-- Chamada periodicamente (cron job) ou manualmente
-- No web: manter como função PostgreSQL, chamar via API quando necessário
```

### Trigger: saldoportador_upd_ins
```sql
-- Executa AFTER INSERT OR UPDATE em saldoportador
-- Atualiza saldodetalhadoportador via saldodetalhadoportador_func()
-- IMPORTANTE: Manter no banco
```

---

## 4. Ajustes de Schema Necessários para a Web

| Tabela | Campo | Ajuste | Motivo |
|--------|-------|--------|--------|
| `membrofamilia` | `avatar_url` | ADICIONAR | Foto/avatar do membro |
| `portador` | `imgportador` → `icone_nome` | AJUSTAR | Substituir índice por nome de ícone |
| `saldofgts` | `senha` | REFORÇAR | Garantir que está criptografada (hash bcrypt) |
| `conta` | `marcado` BOOLEAN | ADICIONADO ✅ | Marcação compartilhada de pago/recebido |
| `portador` | `ativo` BOOLEAN | ADICIONAR | Soft delete de portadores |
| `conta` | `ativo` BOOLEAN | ADICIONAR | Soft delete de contas |
| Todas | `created_at`, `updated_at` | ADICIONAR | Auditoria (opcional mas recomendado) |

---

## 5. Schema Prisma (Exemplo Inicial)

```prisma
// Gerado via: prisma db pull
// Depois de rodar: DATABASE_URL=... npx prisma db pull

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Membrofamilia {
  idmembrofamilia Int        @id @default(autoincrement())
  nome            String     @db.VarChar(50)
  portadores      Portador[]
  cartoes         Cartao[]
  contas          Conta[]
  credores        Credor[]
  saldosfgts      Saldofgts[]
}

model Portador {
  idportador       Int              @id @default(autoincrement())
  nome             String           @db.VarChar(50)
  tipoconta        String           @db.Char(1)
  id_membrofamilia Int
  imgportador      Int?             @db.SmallInt
  membrofamilia    Membrofamilia    @relation(fields: [id_membrofamilia], references: [idmembrofamilia])
  saldos           Saldoportador[]
}

// ... (demais modelos gerados via prisma db pull)
```

---

## 6. Estratégia de Migração de Dados

1. **Banco existente continua intacto** — sem DROP/ALTER destrutivo
2. **Adicionar novas colunas** opcionais (sem NOT NULL ou com DEFAULT)
3. **prisma db pull** gera schema automaticamente
4. **Dados históricos**: todos acessíveis imediatamente via Prisma
5. **Zero downtime**: o Delphi e a web podem operar em paralelo sobre o mesmo banco durante a transição
