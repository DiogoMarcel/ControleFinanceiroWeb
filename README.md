# Controle Financeiro Web

Aplicação web de controle financeiro familiar — migração de um sistema legado Delphi para uma stack moderna, acessível de qualquer dispositivo.

> **Stack**: React 19 · TypeScript · Fastify · Prisma · PostgreSQL · Firebase Auth · Tailwind CSS

---

## O que o sistema faz

### Dashboard
Visão consolidada das finanças em tempo real: saldo total de todos os portadores, total a pagar e receber no mês, saldo líquido projetado, gráfico de evolução histórica de saldo e gráfico de saldo atual por portador com hover sincronizado — ao passar o mouse sobre uma barra do gráfico, o portador correspondente é destacado na lista abaixo.

### Portadores (Contas e Carteiras)
Gestão completa de contas bancárias, dinheiro em espécie, investimentos e poupanças. Cada portador exibe saldo atual, histórico com gráfico de evolução e permite registrar novos lançamentos e transferências entre portadores. Toda criação ou atualização de saldo registra automaticamente um lançamento no extrato global.

### Contas a Pagar e Receber
Lista de compromissos financeiros fixos mensais, separados em **A Pagar** e **A Receber**, agrupados por membro da família. Inclui marcação de pagamento compartilhada entre dispositivos (qualquer pessoa da família que marcar, todos veem), totais em tempo real e botão de reinício mensal.

Cada conta suporta: credor, membro da família, dia de vencimento, flags (débito automático, pagamento manual, débito em cartão, conta anual, pertence à folha), tags e número de parcelas.

**Relatório imprimível A4**: gera uma lista compacta das contas com débito automático e pagamento manual, ordenada por dia de vencimento, com checkbox manual para anotação física. Salva como PDF ou imprime diretamente.

### Extrato
Histórico cronológico de todas as movimentações, com filtros por período e tipo. Saldo acumulado exibido após cada lançamento.

Inclui aba **Evolução por Portador**: selecione um período e veja, para cada portador, o saldo inicial, saldo final e variação líquida. Gráfico de barras horizontais com portadores que tiveram movimentação, e tabela ordenada da maior variação positiva à menor negativa (zeros por último).

### Cartões de Crédito
Controle de cartões por membro da família, com bandeira, dia de vencimento e lista de despesas mensais.

### Relatórios
Gráficos interativos de pagamentos vs recebimentos por mês, evolução do saldo e distribuição de gastos por categoria (Recharts).

### Veículos e Abastecimentos
Registro de abastecimentos com cálculo automático de consumo médio km/L por pares de quilometragem. Painel de totais gerais (investimento total, litros, consumo médio, km rodados) e gráfico de custo mensal por ano.

### Aluguéis
Controle de recebimentos de aluguel com suporte a pagamentos compartilhados. Template de itens padrão aplicado automaticamente a cada novo mês. Painel de totais recebidos e pendentes por ano.

### FGTS
Acompanhamento de saldo e movimentações do FGTS.

### Configurações
CRUD de membros da família, credores e tags para categorização.

---

## Tecnologias

| Camada | Tecnologias |
|--------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Query, React Hook Form, Zod, Recharts, Lucide |
| **Backend** | Node.js 20, Fastify 5, TypeScript, Prisma ORM, Firebase Admin SDK |
| **Banco de dados** | PostgreSQL (schema existente preservado) |
| **Autenticação** | Firebase Authentication (email/senha + JWT) |
| **Infra** | Turborepo (monorepo), Vercel (frontend), Railway (backend + banco) |
| **Qualidade** | Jest 30 + ts-jest (28 testes de integração), ESLint, TypeScript strict |
| **PWA** | vite-plugin-pwa, service worker Workbox, instalável como app no celular |

---

## Estrutura do Projeto

```
controle-financeiro-web/
├── apps/
│   ├── api/          # Backend Fastify (REST API)
│   │   ├── src/
│   │   │   ├── routes/       # Endpoints por módulo
│   │   │   ├── services/     # Lógica de negócio e queries Prisma
│   │   │   ├── middlewares/  # Auth JWT, error handler
│   │   │   └── lib/          # Prisma client, Firebase Admin
│   │   └── prisma/
│   │       └── schema.prisma # Schema mapeado do banco existente
│   └── web/          # Frontend React (SPA)
│       └── src/
│           ├── features/     # Módulos por domínio (dashboard, contas, ...)
│           ├── components/   # UI compartilhada (layout, skeleton, inputs)
│           ├── hooks/        # useAuth e hooks utilitários
│           ├── services/     # Cliente HTTP (axios)
│           └── router/       # Roteamento com lazy loading por página
├── packages/
│   └── shared/       # Types e schemas TypeScript compartilhados
├── docs/
│   └── spec/         # Documentação completa do projeto (requisitos, arquitetura, API)
├── Dockerfile        # Build multi-stage para Railway
├── railway.toml      # Configuração de deploy da API
└── vercel.json       # Configuração de deploy do frontend
```

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 20+
- PostgreSQL rodando localmente
- Projeto no Firebase (Authentication ativado)

### 1. Clone e instale dependências

```bash
git clone https://github.com/DiogoMarcel/ControleFinanceiroWeb.git
cd ControleFinanceiroWeb
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edite `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seu_banco"
FIREBASE_PROJECT_ID="seu-projeto-firebase"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@seu-projeto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173
```

Edite `apps/web/.env`:
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_APP_ID=1:000:web:xxx
```

### 3. Gere o cliente Prisma

```bash
cd apps/api && npx prisma generate
```

### 4. Rode o projeto

```bash
# Na raiz — inicia API e frontend em paralelo
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Testes

```bash
npm run test
```

28 testes de integração cobrindo: autenticação (401/403), portadores, contas (marcação/reiniciar) e extrato (filtros, ordenação, mapeamento de tipos).

---

## Deploy em Produção

O projeto está preparado para deploy automático via GitHub Actions:

| Serviço | Plataforma | Trigger |
|---------|-----------|---------|
| Frontend | Vercel | Push para `main` |
| Backend (API) | Railway | Push para `main` |
| Banco de dados | Railway PostgreSQL | Provisionado manualmente |

Configure os secrets listados em `.github/workflows/deploy.yml` e o deploy ocorre automaticamente a cada push para `main`.

---

## Documentação

Toda a especificação do projeto está em [`docs/spec/`](./docs/spec/):

| Arquivo | Conteúdo |
|---------|----------|
| `01-project-brief.md` | Contexto, objetivos e escopo |
| `03-functional-requirements.md` | Requisitos funcionais por módulo |
| `04-non-functional-requirements.md` | Performance, segurança, infra |
| `05-architecture.md` | Stack, estrutura e decisões técnicas |
| `07-ui-ux-spec.md` | Wireframes e fluxos de telas |
| `08-api-spec.md` | Endpoints REST completos com exemplos |
| `09-tasks.md` | 30 tasks de desenvolvimento (todas concluídas ✅) |

---

## Segurança e Privacidade

- Nenhuma credencial, senha ou chave está no código-fonte
- Todas as variáveis sensíveis são lidas de variáveis de ambiente (`.env`)
- Os arquivos `.env` estão no `.gitignore` e nunca foram commitados
- Apenas arquivos `.env.example` com valores fictícios estão no repositório
- Autenticação obrigatória em todas as rotas da API (middleware JWT)
- Rate limiting: 100 requisições/minuto por IP
- Headers de segurança via `@fastify/helmet`
- CORS configurado para aceitar apenas origens autorizadas

---

## Licença

Uso pessoal. Sinta-se à vontade para adaptar para o seu caso de uso.
