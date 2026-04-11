# 09 — Plano de Tarefas de Desenvolvimento

> **Convenção de commits**: Conventional Commits 1.0.0  
> **Formato de IDs**: `TASK-NN` (rastreável dos requisitos)  
> Cada tarefa = 1 commit atômico  

---

## FASE 1 — Setup e Infraestrutura

### TASK-01: Inicializar monorepo com Turborepo ✅
```
feat: initialize monorepo with turborepo and npm workspaces
Requisitos: MAINT-03, INFRA-04
```
- `npm init` com workspaces: `apps/web`, `apps/api`, `packages/shared`
- `turbo.json` com pipeline build/dev/lint/test
- `.gitignore` e `.env.example`

### TASK-02: Configurar projeto React (apps/web) ✅
```
feat: setup react+typescript+vite frontend project
Requisitos: MAINT-01
```
- Vite + React + TypeScript (`strict: true`)
- Tailwind CSS v4 configurado
- ESLint + Prettier configurados
- Estrutura de pastas: `features/`, `components/`, `hooks/`, `services/`, `lib/`

### TASK-03: Configurar projeto Fastify (apps/api) ✅
```
feat: setup fastify+typescript+prisma backend project
Requisitos: MAINT-01, SEG-05, SEG-07, SEG-08, SEG-10
```
- Fastify + TypeScript configurado
- `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`
- Estrutura de pastas: `routes/`, `middlewares/`, `services/`, `schemas/`, `lib/`

### TASK-04: Conectar Prisma ao PostgreSQL existente ✅
```
feat: connect prisma orm to existing postgresql database
Requisitos: MAINT-06
```
- Configurar `DATABASE_URL` no `.env`
- Executar `prisma db pull` para gerar schema do banco atual
- Verificar e ajustar `schema.prisma` gerado
- Executar `prisma generate`
- **Nota**: Prisma 7 requer driver adapter (`@prisma/adapter-pg` + `pg.Pool`)

### TASK-05: Configurar Firebase Admin SDK no backend ✅
```
feat: configure firebase admin sdk for jwt verification
Requisitos: AUTH-05, SEG-02, SEG-03
```
- Instalar `firebase-admin`
- Middleware de autenticação: verifica token Firebase em cada request
- Extrai `uid`, `email`, `role` (custom claim) do token
- Retorna 401 se token inválido

### TASK-06: Configurar Firebase Auth no frontend ✅
```
feat: configure firebase auth in react frontend
Requisitos: AUTH-01, AUTH-06, AUTH-08
```
- Instalar Firebase SDK
- Context/hook de autenticação: `useAuth()`
- Protected Route HOC
- Zustand store para estado de auth

### TASK-07: Configurar CI/CD com GitHub Actions ✅
```
feat: setup github actions for ci and deploy
Requisitos: MAINT-06, INFRA-01, INFRA-02
```
- `ci.yml`: lint + build + testes em push/PR
- `deploy.yml`: deploy automático ao Vercel (frontend) e Railway (backend) na main
- Configurar secrets no GitHub

---

## FASE 2 — Autenticação e Layout Base

### TASK-08: Implementar tela de Login ✅
```
feat(auth): implement login screen with firebase authentication
Requisitos: AUTH-01, AUTH-07, UX-05
```
- Tela de login responsiva com design clean
- Formulário email + senha com React Hook Form + Zod
- Integração Firebase Auth
- Feedback de erro em português
- Redireciona para Dashboard após login

### TASK-09: Implementar layout base da aplicação ✅
```
feat(layout): implement base app layout with navigation
Requisitos: UX-01, UX-02
```
- Header com nome do app + info do usuário + logout
- Sidebar (desktop) / Bottom Navigation (mobile)
- Suporte a dark mode (preferência do sistema)
- Router com proteção de rotas (redirect para /login)

---

## FASE 3 — Dashboard

### TASK-10: Implementar endpoint GET /dashboard ✅
```
feat(api): implement dashboard summary endpoint
Requisitos: DASH-01 a DASH-10
```
- Query otimizada: saldo total, totais do mês, portadores, vencendo, em atraso
- Dados dos últimos 6 meses para gráfico
- Cache: 5 minutos (dados não mudam frequentemente)

### TASK-11: Implementar tela Dashboard ✅
```
feat(web): implement main dashboard screen
Requisitos: DASH-01 a DASH-10
```
- Cards de KPIs: saldo total, a pagar, a receber, líquido
- Cards de portadores com saldo
- Gráfico de barras: pagamentos vs recebimentos (Recharts)
- Lista: vencendo em 7 dias e em atraso
- Loading skeletons durante carregamento

---

## FASE 4 — Portadores

### TASK-12: Implementar CRUD de portadores (API) ✅
```
feat(api): implement portadores crud endpoints
Requisitos: PORT-01 a PORT-09
```
- GET /portadores (com saldo atual calculado)
- POST /portadores
- PUT /portadores/:id
- DELETE /portadores/:id (soft delete)
- GET /portadores/:id/saldo (histórico)
- POST /portadores/:id/saldo (novo lançamento)
- POST /portadores/transferencia

### TASK-13: Implementar tela de Portadores ✅
```
feat(web): implement portadores management screen
Requisitos: PORT-01 a PORT-09
```
- Lista de portadores com saldo e tipo
- Formulário de criar/editar portador
- Tela de histórico com gráfico de linha (Recharts)
- Modal de lançamento de saldo
- Modal de transferência entre portadores

---

## FASE 5 — Contas e Pagamentos (Core)

### TASK-14: Implementar CRUD de membros, credores e tags (API) ✅
```
feat(api): implement membros, credores and tags crud
Requisitos: MBR-01, CRED-01, TAG-01
```
- CRUD completo para os 3 entidades
- Validação Zod em todos os endpoints

### TASK-15: Implementar CRUD de contas (API) ✅
```
feat(api): implement contas crud endpoints
Requisitos: CONT-01 a CONT-13
```
- GET /contas com filtros (tipo, membro, ativo)
- POST /contas (com validação de todas as flags)
- PUT /contas/:id
- DELETE /contas/:id (soft delete)
- GET + POST /contas/:id/tags

### TASK-16: Implementar endpoints de pagamentos (API) ✅
```
feat(api): implement contapagamentos endpoints
Requisitos: CONT-05, CONT-06, CONT-07, RN-01, RN-02
```
- GET /contapagamentos (com status calculado: pago/pendente/vencido/vencendo)
- PATCH /contapagamentos/:id/baixa
- PATCH /contapagamentos/:id/desfazer-baixa
- POST /contapagamentos/gerar-mes (chama função PostgreSQL)

### TASK-17: Implementar tela de Contas ✅
```
feat(web): implement accounts screen with shared persistent marking
Requisitos: CONT-05, CONT-08, CONT-13, UX-07, UX-08
```
- Lista estática de contas agrupadas por membro da família
- Abas A Pagar / A Receber
- Checkbox por conta — marcação persistida no banco (`conta.marcado`)
- Marcação **compartilhada entre todos os dispositivos e usuários**
- Totais em tempo real: Total | Marcado | Restante
- Botão "Reiniciar (N)" — desmarca tudo da aba atual via API
- Atualização otimista no UI (resposta imediata ao clicar)
- **Sem navegação por mês** — lista sempre igual, marcação manual

> **Decisão de design**: abordagem original com navegador de meses e `contapagamentos` foi descartada.
> O usuário preferiu uma lista estática simples com marcação persistente.

### TASK-18: Implementar formulário de Conta ✅
```
feat(web): implement account create/edit form
Requisitos: CONT-01 a CONT-04, CONT-11
```
- Formulário completo com todos os campos (descricao, valor, tipo, membro, credor, 5 flags, tags)
- Seleção múltipla de tags como pill buttons
- Toggle de flags (anual, débito cartão, débito automático, pagamento manual, pertence à folha)
- Validação em tempo real (Zod + React Hook Form)
- Edição (admin): botões lápis/lixeira por linha no hover
- Exclusão com confirmação modal e exibição de erro da API
- Fix: formulário de edição aguarda `isSuccess` dos selects de membro/credor antes do `reset()`

### TASK-19: Implementar telas de configuração (Membros, Credores, Tags) ✅
```
feat(web): implement configuration screens for membros, credores and tags
Requisitos: MBR-01, CRED-01, TAG-01
```
- Página `/configuracoes` com 3 colunas (Membros | Credores | Tags)
- Cada coluna: campo + "Adicionar" (Enter funciona), lista com edição inline, confirmação de exclusão inline
- Erros da API exibidos diretamente na coluna correspondente
- Skeleton durante carregamento
- Controles de escrita visíveis apenas para admin

---

## FASE 6 — Extrato

### TASK-20: Implementar endpoint e tela de extrato ✅
```
feat: implement saldoextrato endpoint and screen
Requisitos: EXT-01 a EXT-05
```
- API: GET /extrato com filtros de período e tipo
- Tela: tabela cronológica com saldo acumulado
- Filtro de período com date picker
- Formatação em R$ e datas pt-BR
- Ordenação por `idsaldoextrato DESC` (data sozinha não garante sequência)
- Pagamentos (`tiposaldo = 'P'`) exibidos com sinal negativo e cor vermelha

---

## FASE 7 — Cartões

### TASK-21: Implementar cartões (API + Web) ✅
```
feat: implement cartoes crud and despesas
Requisitos: CART-01 a CART-05
```
- CRUD de cartões
- Lançamento de despesas por cartão
- Total de gastos por mês

---

## FASE 8 — Relatórios e Gráficos

### TASK-22: Implementar endpoints de relatórios (API) ✅
```
feat(api): implement reports endpoints for charts
Requisitos: REL-01 a REL-05
```
- GET /relatorios/saldo-por-portador
- GET /relatorios/gastos-por-tag
- GET /relatorios/comparativo-meses
- GET /relatorios/abastecimentos/:id

### TASK-23: Implementar tela de Relatórios ✅
```
feat(web): implement reports screen with interactive charts
Requisitos: REL-01 a REL-06, UX-03
```
- Gráfico de linha: evolução de saldo por portador
- Gráfico de pizza: gastos por categoria/tag
- Gráfico de barras: comparativo pagamentos vs recebimentos
- Filtros de período em cada gráfico
- Tooltips detalhados ao hover

---

## FASE 9 — Módulos Complementares

### TASK-24: Implementar Veículos e Abastecimentos ✅
```
feat: implement veiculos and abastecimentos module
Requisitos: VEI-01 a VEI-03, ABAST-01 a ABAST-05
```
- CRUD de veículos (inclui datavenda/valorvenda para veículos vendidos)
- CRUD completo de abastecimentos por veículo (criar, editar, excluir)
- Consumo médio calculado por pares consecutivos de kmcarro (não total/litros)
- Gráfico BarChart agregado por mês (não LineChart com datas individuais)
- Lista agrupada por mês com subtotal (custo, litros, consumo médio do mês)
- Painel geral (todos os anos) com `max(kmcarro) - min(kmcarro)` como km rodados
- PUT /veiculos/:id/abastecimentos/:idAbast
- DELETE /veiculos/:id/abastecimentos/:idAbast

### TASK-25: Implementar FGTS ✅
```
feat: implement fgts tracking module
Requisitos: FGTS-01 a FGTS-03
```
- CRUD de registros FGTS
- Segurança: senha não exposta via API

### TASK-26: Implementar Aluguéis ✅
```
feat: implement alugueis module
Requisitos: ALU-01 a ALU-07
```
- Cadastro de meses de aluguel com valor e data
- Itens por mês: descrição, valor, tipo (V=valor fixo, S=compartilhado, F=free)
- Compartilhamento de itens tipo S: rateado automaticamente entre os meses do mesmo ano
- Template de itens: aplicado automaticamente ao criar novo mês
- CRUD completo de template (GET/POST/PUT/DELETE /alugueis/template)
- GET /alugueis/ultimo — retorna valor e data do último lançamento
- PATCH /alugueis/:id/comp — recalcula itens compartilhados do ano

---

## FASE 10 — Polimento e Qualidade

### ✅ TASK-27: Implementar testes de integração da API
```
test: add integration tests for critical api routes
Requisitos: MAINT-04
```
- Testes para: auth, portadores, contas (baixa/desmarcar/reiniciar), extrato (28 testes)
- Jest 30 + ESM + ts-jest; `jest.unstable_mockModule()` para mocks ESM
- `moduleNameMapper` para firebase-admin (init antecipado)
- Importação explícita de `@jest/globals` para resolução de tipos no VS Code

### ✅ TASK-28: Otimizações de performance
```
perf: optimize api queries and frontend loading
Requisitos: PERF-01 a PERF-05
```
- Lazy loading de rotas no frontend (`React.lazy` + `Suspense`)
- Skeleton loaders (`Skeleton`, `SkeletonText`, `SkeletonTable`, `SkeletonCard`, `PageSkeleton`)
- React Query com `staleTime=5min`, `gcTime=10min`, `refetchOnWindowFocus=false`

### ✅ TASK-29: PWA e experiência mobile
```
feat: configure pwa for mobile home screen installation
Requisitos: UX-01
```
- `vite-plugin-pwa` com `registerType: autoUpdate` e manifest completo
- Workbox: CacheFirst para assets estáticos, NetworkFirst para `/api/v1/`
- `public/icon.svg` (R$ em fundo azul), `public/offline.html` com botão de retry
- Meta tags PWA no `index.html` (apple-touch-icon, theme-color, etc.)

### ✅ TASK-30: Deploy em produção
```
feat: configure production deploy on vercel and railway
Requisitos: INFRA-01 a INFRA-05
```
- `vercel.json` — SPA rewrites, cache de assets, service worker sem cache
- `Dockerfile` multi-stage (builder + runner) para Railway
- `railway.toml` com healthcheck `/health` e restart policy
- `.dockerignore` otimizado para build rápido
- CI/CD: `deploy.yml` com deploy automático no push para `main`
- Secrets necessários documentados no topo do workflow

---

## Resumo por Fase

| Fase | Tasks | Entregável |
|------|-------|-----------|
| 1 — Setup | 01-07 | Monorepo configurado, CI/CD rodando |
| 2 — Auth/Layout | 08-09 | Login + navegação funcionando |
| 3 — Dashboard | 10-11 | Dashboard com dados reais |
| 4 — Portadores | 12-13 | Gestão de portadores completa |
| 5 — Contas (Core) | 14-19 | Módulo financeiro principal |
| 6 — Extrato | 20 | Extrato navegável |
| 7 — Cartões | 21 | Controle de cartões |
| 8 — Relatórios | 22-23 | Gráficos interativos |
| 9 — Complementar | 24-26 | Veículos, FGTS, Aluguéis |
| 10 — Polimento | 27-30 | Qualidade + produção |
| **Total** | **30 tasks** | **Sistema completo em produção** |
