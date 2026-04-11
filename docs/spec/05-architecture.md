# 05 — Arquitetura do Sistema

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
│              (Browser / Celular / Tablet)                    │
└─────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                   FRONTEND (Vercel)                          │
│              React + TypeScript + Tailwind CSS               │
│              Recharts + React Query + Zustand                │
└─────────────────────┬───────────────────────────────────────┘
                       │ REST API (HTTPS + JWT)
┌─────────────────────▼───────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│              Node.js + Fastify + Prisma ORM                  │
│              Firebase Admin SDK (verificação JWT)            │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
┌──────────▼──────────┐      ┌────────────▼──────────────────┐
│   PostgreSQL (Railway)│      │   Firebase Auth (Google)      │
│   Banco principal    │      │   Autenticação de usuários    │
└─────────────────────┘      └───────────────────────────────┘
```

---

## 2. Stack Tecnológico

### 2.1 Frontend

| Tecnologia | Versão | Justificativa |
|-----------|--------|---------------|
| **React** | 19+ | Ecossistema maduro, excelente para SPAs |
| **TypeScript** | 5+ | Tipagem estática, reduz bugs em runtime |
| **Vite** | 6+ | Build ultrarrápido para desenvolvimento |
| **Tailwind CSS** | 4+ | Estilização utility-first, responsiva por padrão |
| **Recharts** | 2+ | Gráficos interativos compostos em React |
| **React Query (TanStack)** | 5+ | Cache e sincronização de dados servidor-cliente |
| **Zustand** | 5+ | Estado global simples para auth e UI state |
| **React Router** | 7+ | Roteamento SPA com proteção de rotas |
| **React Hook Form** | 7+ | Formulários performáticos com validação |
| **Zod** | 3+ | Validação de schemas (compartilhado com backend) |
| **date-fns** | 4+ | Manipulação de datas em pt-BR |
| **Lucide React** | — | Ícones modernos e consistentes |

### 2.2 Backend

| Tecnologia | Versão | Justificativa |
|-----------|--------|---------------|
| **Node.js** | 22 LTS | Plataforma estável e madura |
| **Fastify** | 5+ | Performance superior ao Express, schema-first |
| **TypeScript** | 5+ | Tipagem end-to-end com frontend |
| **Prisma ORM** | 6+ | Type-safe, migrations, PostgreSQL nativo |
| **Firebase Admin SDK** | — | Verificação de tokens Firebase no backend |
| **Zod** | 3+ | Validação de inputs e schemas compartilhados |
| **@fastify/cors** | — | CORS configurável |
| **@fastify/helmet** | — | Headers de segurança HTTP |
| **@fastify/rate-limit** | — | Rate limiting por IP |

### 2.3 Banco de Dados

| Item | Detalhes |
|------|----------|
| **PostgreSQL** | 16+ (mantido do sistema atual) |
| **ORM** | Prisma (schema gerado a partir do DB existente via `prisma db pull`) |
| **Migrations** | Prisma Migrate para mudanças futuras de schema |
| **Backup** | Railway: backup automático diário |

### 2.4 Autenticação

| Item | Detalhes |
|------|----------|
| **Firebase Authentication** | Mantido (já em uso no Delphi) |
| **Método** | Email + senha |
| **Token** | JWT Firebase verificado via Firebase Admin no backend |
| **Perfis** | Custom Claims no Firebase: `role: "admin" | "viewer"` |

### 2.5 Infraestrutura / Deploy

| Serviço | Uso |
|---------|-----|
| **Vercel** | Frontend — deploy automático via GitHub |
| **Railway** | Backend Node.js + PostgreSQL |
| **GitHub** | Repositório de código + CI/CD Actions |
| **Firebase** | Auth + (opcional) Realtime Config |

---

## 3. Estrutura do Monorepo

```
controle-financeiro-web/
├── apps/
│   ├── web/                    # Frontend React
│   │   ├── src/
│   │   │   ├── components/     # Componentes reutilizáveis
│   │   │   │   ├── ui/         # Primitivos (Button, Input, Modal...)
│   │   │   │   ├── charts/     # Gráficos específicos do sistema
│   │   │   │   └── layout/     # Header, Sidebar, Layout
│   │   │   ├── features/       # Módulos por domínio
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── portadores/
│   │   │   │   ├── contas/
│   │   │   │   ├── extrato/
│   │   │   │   ├── cartoes/
│   │   │   │   ├── veiculos/
│   │   │   │   ├── alugueis/
│   │   │   │   ├── fgts/
│   │   │   │   ├── relatorios/
│   │   │   │   └── configuracoes/
│   │   │   ├── hooks/          # Hooks reutilizáveis
│   │   │   ├── services/       # Chamadas API (axios/fetch)
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── lib/            # Utilitários (formatação, datas)
│   │   │   ├── types/          # Tipos TypeScript globais
│   │   │   └── router/         # Configuração de rotas
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Backend Fastify
│       ├── src/
│       │   ├── routes/         # Endpoints por módulo
│       │   │   ├── index.ts        # Registro de todas as rotas
│       │   │   ├── dashboard.ts    # GET /dashboard
│       │   │   ├── portadores.ts   # CRUD portadores + transferência + histórico
│       │   │   ├── contas.ts       # CRUD contas + marcação + tags
│       │   │   ├── pagamentos.ts   # contapagamentos (baixa, desfazer, gerar-mes)
│       │   │   ├── extrato.ts      # GET /extrato
│       │   │   ├── cartoes.ts      # CRUD cartões + despesas
│       │   │   ├── config.ts       # membros, credores, tags (entidades auxiliares)
│       │   │   ├── veiculos.ts     # CRUD veículos + abastecimentos
│       │   │   ├── alugueis.ts     # aluguéis + itens por mês + template
│       │   │   ├── fgts.ts         # CRUD FGTS
│       │   │   └── relatorios.ts   # relatórios/gráficos
│       │   ├── middlewares/    # Auth, validation, error handler
│       │   ├── services/       # Lógica de negócio
│       │   ├── schemas/        # Zod schemas (validação + tipos)
│       │   ├── lib/            # Prisma client, Firebase Admin
│       │   └── server.ts       # Entry point
│       ├── prisma/
│       │   ├── schema.prisma   # Schema gerado do DB existente
│       │   └── migrations/     # Migrations futuras
│       └── package.json
│
├── packages/
│   └── shared/                 # Tipos e schemas compartilhados
│       ├── src/
│       │   ├── schemas/        # Zod schemas compartilhados
│       │   └── types/          # Tipos TypeScript
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + Testes em PRs
│       └── deploy.yml          # Deploy automático
├── package.json                # Workspace root (npm workspaces)
└── turbo.json                  # Turborepo (build pipeline)
```

---

## 4. Fluxo de Autenticação

```
1. Usuário acessa o sistema
2. Sem token → redireciona para /login
3. Usuário insere email/senha
4. Firebase Auth valida credenciais → retorna JWT
5. Frontend armazena token (memory + secure cookie httpOnly)
6. Toda requisição envia: Authorization: Bearer <token>
7. Backend (middleware): verifica token via Firebase Admin SDK
8. Extrai uid e role (custom claim) do token
9. Rota autorizada → processa; Não autorizada → 401/403
```

---

## 5. Fluxo de Dados (Exemplo: Baixa de Conta)

```
1. Usuário clica "Marcar como pago" no frontend
2. React Query executa mutation: PATCH /api/contapagamentos/:id
3. Backend valida token JWT e role (deve ser admin)
4. Backend valida body via Zod schema
5. Prisma executa: UPDATE contapagamentos SET baixaefetuada=true WHERE id=:id
6. Trigger PostgreSQL preenche databaixa automaticamente
7. Backend retorna 200 com registro atualizado
8. React Query invalida cache de contapagamentos do mês
9. UI atualiza automaticamente com novo estado
```

---

## 6. Decisões de Arquitetura

| Decisão | Escolha | Alternativa Rejeitada | Motivo |
|---------|---------|----------------------|--------|
| Monorepo vs Polyrepo | Monorepo (Turborepo) | Repositórios separados | Compartilhar tipos e schemas facilmente |
| ORM | Prisma | Drizzle / TypeORM | Suporte a `db pull` do schema existente |
| State management | Zustand + React Query | Redux | Menos boilerplate, React Query cobre server state |
| CSS | Tailwind CSS | CSS Modules / Styled Components | Velocidade de desenvolvimento, mobile-first nativo |
| Gráficos | Recharts | Chart.js / Victory | Nativo React, composição por componentes |
| Deploy | Vercel + Railway | AWS / Fly.io | Free tier adequado, zero config para Node/Postgres |
| Auth | Firebase (mantido) | Auth.js / Lucia | Já em uso, evita migração de usuários |
