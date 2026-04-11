# 08 — Design da API REST

> **Base URL**: `https://api.controle-financeiro.app/api/v1`  
> **Auth**: Todas as rotas requerem `Authorization: Bearer <firebase-jwt>` exceto `/auth/*`  
> **Formato**: JSON  
> **Erros**: Padrão `{ error: string, details?: any }`

---

## 1. Autenticação

### POST /auth/verify
Verifica token Firebase e retorna perfil do usuário.

**Response 200**:
```json
{
  "uid": "firebase-uid",
  "email": "diogo@exemplo.com",
  "role": "admin",
  "displayName": "Diogo"
}
```

---

## 2. Dashboard

### GET /dashboard
Retorna todos os dados do dashboard em uma única requisição (otimizado).

**Response 200**:
```json
{
  "saldoTotal": 103832.51,
  "saldoBancario": 1095.64,
  "valorReservado": 102736.87,
  "totalContasPagar": 11983.10,
  "totalContasReceber": 16861.27,
  "saldoLiquido": 4878.17,
  "saldoFgts": 54063.12,
  "saldoGeralComFgts": 157895.63,
  "portadores": [
    {
      "id": 1,
      "nome": "Sicredi",
      "tipo": "C",
      "saldo": 28.36,
      "reservado": false,
      "contaCapital": false,
      "membroId": 2,
      "membroNome": "Valéria Korb"
    }
  ],
  "evolucaoSaldo": [
    { "mes": "2026-03", "saldoTotal": 101200.00 },
    { "mes": "2026-04", "saldoTotal": 103832.51 }
  ]
}
```

**Regras de negócio**:
- `saldoTotal`: último registro de `saldodetalhadoportador` onde `saldototal IS NOT NULL`, ordenado por `idsaldodetalhadoportador DESC` (o trigger pode inserir registros com null durante execução parcial — sempre filtrar)
- `saldoBancario`: soma ao vivo de `saldoportador.valor` onde `reservado != true AND contacapital != true` (mesma fonte que `valorReservado` para evitar dessincronização com o trigger)
- `valorReservado`: soma de `saldoportador.valor` onde `reservado = true AND contacapital != true`
- `totalContasPagar` / `totalContasReceber`: soma de `conta.valor` por tipo, **excluindo** `debitacartao = true` (evita dupla contagem com fatura de cartão)
- `saldoLiquido`: `totalContasReceber - totalContasPagar`
- `evolucaoSaldo`: último `saldototal` não-nulo de cada mês em `saldodetalhadoportador` (window function com filtro `saldototal IS NOT NULL`)
- `contacapital`: campo `Boolean?` — comparar sempre com `!== true` pois pode ser null no banco

---

## 3. Membros da Família

### GET /membros
Lista todos os membros.

### POST /membros
Cria novo membro. Body: `{ nome: string, avatar_url?: string }`

### GET /membros/:id
Retorna membro com seus portadores e totais.

### PUT /membros/:id
Atualiza membro. Body: `{ nome?: string, avatar_url?: string }`

### DELETE /membros/:id
Exclui membro (apenas se não tiver registros vinculados).

---

## 4. Portadores

### GET /portadores
Lista todos os portadores com saldo e membro (ordenado por membro, depois por nome).

**Response**:
```json
[
  {
    "idportador": 1,
    "nomeportador": "Sicredi",
    "tipoconta": "C",
    "agencia": "0740",
    "numeroconta": "36278-6",
    "digitoconta": null,
    "imgportador": null,
    "id_membrofamilia": 1,
    "membrofamilia": { "idmembrofamilia": 1, "nome": "Diogo Marcel" },
    "saldoportador": {
      "idsaldoportador": 5,
      "valor": 0.86,
      "reservado": false,
      "contacapital": false
    }
  }
]
```

### GET /portadores/:id
Retorna portador individual.

### POST /portadores *(admin)*
Cria portador e registro de saldo inicial.

Body:
```json
{
  "nomeportador": "Nubank",
  "tipoconta": "C",
  "id_membrofamilia": 1,
  "agencia": "0001",
  "numeroconta": "1234567-8",
  "valor": 0,
  "reservado": false,
  "contacapital": false
}
```

### PUT /portadores/:id *(admin)*
Atualiza dados do portador e/ou saldo.

Body (todos opcionais): `{ nomeportador?, tipoconta?, id_membrofamilia?, agencia?, numeroconta?, digitoconta?, valor?, reservado?, contacapital? }`

### DELETE /portadores/:id *(admin)*
Exclui portador. **Retorna 422** se `saldoportador.valor != 0`.

### GET /membros
Lista membros da família (auxiliar para formulários).

**Response**: `[{ "idmembrofamilia": 1, "nome": "Diogo Marcel" }]`

**Nota — endpoints futuros** (TASK-12 v2):
- `POST /portadores/transferencia` — transferência entre portadores
- `GET /portadores/:id/historico` — histórico de saldo via `saldodetalhadoportador`

---

## 5. Contas

### GET /contas
Lista contas cadastradas.

**Query**: `?tipoconta=P&id_membrofamilia=1`

**Response** (exemplo de item):
```json
{
  "idconta": 5,
  "descricao": "Energia Elétrica",
  "valor": 280.00,
  "tipoconta": "P",
  "marcado": false,
  "diavencimento": 15,
  "contaanual": false,
  "pertenceafolha": false,
  "debitacartao": false,
  "debitoauto": false,
  "pagamentomanual": true,
  "qtdparcela": null,
  "id_credor": 2,
  "id_membrofamilia": 1,
  "membrofamilia": { "idmembrofamilia": 1, "nome": "Diogo Marcel" },
  "credor": { "idcredor": 2, "nome": "CEMIG" },
  "contatag": [{ "tags": { "idtags": 3, "descricao": "Moradia" } }]
}
```

### POST /contas *(admin)*
Cria conta.

Body:
```json
{
  "descricao": "Energia Elétrica",
  "valor": 280.00,
  "tipoconta": "P",
  "diavencimento": 15,
  "id_membrofamilia": 1,
  "id_credor": 2,
  "contaanual": false,
  "qtdparcela": null,
  "debitacartao": false,
  "debitoauto": false,
  "pertenceafolha": false,
  "pagamentomanual": true,
  "tags": [3]
}
```

### GET /contas/:id
Retorna conta individual com pagamentos.

### PUT /contas/:id *(admin)*
Atualiza conta. Body: mesmos campos do POST (todos opcionais). Tags são substituídas por completo.

### DELETE /contas/:id *(admin)*
Exclui conta. **Retorna 422** se houver registros com `baixaefetuada = true` vinculados.

### PATCH /contas/:id/marcar
Marca ou desmarca uma conta como paga/recebida. Disponível para todos os usuários autenticados.

Body: `{ "marcado": true }`

**Response**: `{ "idconta": 5, "marcado": true }`

> A marcação é **compartilhada** — qualquer dispositivo ou usuário que acessar verá o mesmo estado.

### POST /contas/reiniciar
Desmarca todas as contas de um tipo de uma vez.

Body: `{ "tipoconta": "P" }`

**Response**: `204 No Content`

### GET /contas/relatorio
Retorna contas a pagar com `debitoauto = true` ou `pagamentomanual = true`, ordenadas por `diavencimento` (nulos por último) e depois por descrição. Usado pela tela de impressão A4.

**Response**: array com os mesmos campos do GET /contas (sem `contatag`).

### POST /contas/:id/tags/:tagId *(admin)*
Adiciona tag à conta.

### DELETE /contas/:id/tags/:tagId *(admin)*
Remove tag da conta.

---

## 6. Pagamentos (contapagamentos)

### GET /contapagamentos
Lista pagamentos do mês.

**Query**: `?mes=2026-04&tipo=P&status=pendente&id_membro=1`

**Response**:
```json
[
  {
    "idcontapagamentos": 101,
    "dataconta": "2026-04-01",
    "databaixa": null,
    "baixaefetuada": false,
    "id_conta": 5,
    "conta": {
      "descricao": "Energia Elétrica",
      "valor": 280.00,
      "tipoconta": "P",
      "credor": { "nome": "CEMIG" }
    },
    "status": "pendente"  // calculado: pendente | pago | vencido | vencendo
  }
]
```

### PATCH /contapagamentos/:id/baixa
Marca como pago/recebido.

Body: `{ baixaefetuada: true }` (databaixa é preenchida pelo trigger do DB)

### PATCH /contapagamentos/:id/desfazer-baixa
Desfaz a baixa. Body: `{ baixaefetuada: false }`

### POST /contapagamentos/gerar-mes
Chama a função `contapagamentos_func()` do PostgreSQL para gerar registros do mês.

Body: `{ mes: "2026-04" }`

---

## 7. Credores

### GET /credores
Lista credores. **Query**: `?id_membro=1`

### POST /credores
Body: `{ nome, id_membrofamilia }`

### PUT /credores/:id
Body: `{ nome? }`

### DELETE /credores/:id

---

## 8. Cartões

### GET /cartoes
Lista cartões. **Query**: `?id_membro=1`

### POST /cartoes
Body: `{ nome, diavencimento, bandeira, id_membrofamilia }`

### PUT /cartoes/:id
### DELETE /cartoes/:id

### GET /cartoes/:id/despesas
Lista despesas do cartão por mês. **Query**: `?mes=2026-04`

### POST /cartoes/:id/despesas
Lança despesa no cartão. Body: `{ descricao, valor, data }`

---

## 9. Extrato

### GET /extrato
Extrato de movimentações.

**Query**: `?inicio=2026-01-01&fim=2026-04-30&tipo=P`

**Response**:
```json
[
  {
    "idsaldoextrato": 1,
    "datalancamento": "2026-04-08",
    "tiposaldo": "P",
    "tipoDescricao": "Pagamento",
    "valor": -280.00,
    "saldo": 8200.00,
    "descricao": "Energia Elétrica",
    "id_conta": 5
  }
]
```

---

## 10. FGTS

### GET /fgts
Lista registros FGTS. **Query**: `?id_membro=1`

### POST /fgts
Body: `{ nropis, saldo, id_membrofamilia }` (senha NÃO exposta via API)

### PUT /fgts/:id
Body: `{ saldo? }` (atualiza saldo)

### DELETE /fgts/:id

---

## 11. Veículos

### GET /veiculos
### POST /veiculos
Body: `{ modelo, marca, cor, datacompra, valorcompra, datavenda?, valorvenda? }`

### PUT /veiculos/:id
### DELETE /veiculos/:id

### GET /veiculos/:id/abastecimentos
**Query**: `?inicio=2026-01-01&fim=2026-04-30`

**Response inclui**: total de litros, custo total, km/l médio por abastecimento calculado por pares consecutivos de kmcarro.

### POST /veiculos/:id/abastecimentos
Body: `{ dataabastecimento, totalabastecimento, kmcarro, quantidadelitros, observacao? }`

### PUT /veiculos/:id/abastecimentos/:idAbast *(admin)*
Body: mesmos campos do POST (todos opcionais).

### DELETE /veiculos/:id/abastecimentos/:idAbast *(admin)*

---

## 12. Tags

### GET /tags
### POST /tags
Body: `{ descricao }`

### PUT /tags/:id
### DELETE /tags/:id

---

## 13. Relatórios

### GET /relatorios/saldo-por-portador
Evolução de saldo por portador para gráfico.

**Query**: `?inicio=2026-01-01&fim=2026-04-30`

**Response**:
```json
{
  "portadores": [
    {
      "id": 1,
      "nome": "Itaú CC",
      "serie": [
        { "data": "2026-01-01", "valor": 6000.00 },
        { "data": "2026-02-01", "valor": 7200.00 }
      ]
    }
  ]
}
```

### GET /relatorios/gastos-por-tag
Distribuição de gastos por tag no período.

**Query**: `?mes=2026-04`

### GET /relatorios/comparativo-meses
Comparativo pagamentos vs recebimentos por mês.

**Query**: `?meses=6` (últimos N meses)

### GET /relatorios/abastecimentos/:veiculoId
Relatório completo de abastecimentos com consumo médio.

---

## 14. Aluguéis

> Módulo de controle de aluguel mensal com itens compostos e lógica de compartilhamento.

### GET /alugueis
Lista todos os meses de aluguel com seus itens e composições.

**Query**: `?ano=2025`

**Response inclui**: `aluguelconta[]` (itens do mês) e `aluguelcomp[]` (composição do compartilhado).

### GET /alugueis/ultimo
Retorna valor e data do último lançamento (qualquer ano). Útil para pré-preencher o formulário de novo mês.

**Response**: `{ valoraluguel: 1800.00, dataaluguel: "2026-03-01" }`

### POST /alugueis *(admin)*
Cria novo mês e aplica automaticamente os itens do template.

Body: `{ dataaluguel: "2026-04-01", valoraluguel?: 1800.00 }`

### PUT /alugueis/:id *(admin)*
Atualiza dados do mês (data e/ou valor).

### PATCH /alugueis/:id/comp *(admin)*
Recalcula os itens compartilhados (tipo `S`) do ano inteiro. Exclui todos os registros `aluguelcomp` do ano e recria rateando o valor entre os meses.

### DELETE /alugueis/:id *(admin)*
Exclui o mês e todos os seus itens e composições vinculados.

---

### GET /alugueis/:id/contas
Lista os itens do mês de aluguel.

**Response**:
```json
[
  {
    "idaluguelconta": 1,
    "descricao": "Aluguel base",
    "valor": 1500.00,
    "tipo": "V"
  },
  {
    "idaluguelconta": 2,
    "descricao": "Condomínio",
    "valor": 300.00,
    "tipo": "S"
  }
]
```

**Tipos de item**:
- `V` — valor fixo (entra diretamente no total do mês)
- `S` — compartilhado (rateado automaticamente entre todos os meses do ano)
- `F` — free (informativo, não entra no cálculo)

### POST /alugueis/:id/contas *(admin)*
Adiciona item ao mês.

Body: `{ descricao: string, valor: number, tipo: "V" | "S" | "F" }`

### PUT /alugueis/:id/contas/:idConta *(admin)*
Atualiza item. Body: `{ descricao?, valor?, tipo? }`

### DELETE /alugueis/:id/contas/:idConta *(admin)*

---

### GET /alugueis/template
Lista os itens do template global (aplicados automaticamente a novos meses).

### POST /alugueis/template *(admin)*
Body: `{ descricao: string, valor: number, tipo: "V" | "S" | "F" }`

### PUT /alugueis/template/:id *(admin)*
Body: `{ descricao?, valor?, tipo? }`

### DELETE /alugueis/template/:id *(admin)*

---

## 15. Códigos de Status HTTP

| Código | Uso |
|--------|-----|
| 200 | Sucesso (GET, PUT, PATCH) |
| 201 | Criado com sucesso (POST) |
| 204 | Sucesso sem conteúdo (DELETE) |
| 400 | Dados inválidos (validação Zod) |
| 401 | Não autenticado (token ausente/inválido) |
| 403 | Não autorizado (role insuficiente) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: pagamento já existe para o mês) |
| 500 | Erro interno do servidor |
