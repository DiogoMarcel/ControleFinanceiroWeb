# 10 — Guia de Início: Do Zero ao Projeto Web

> **Status**: Projeto já iniciado e em desenvolvimento avançado (TASK-01 a TASK-26 concluídas).  
> Este guia serve como referência de setup do ambiente para novos colaboradores ou reinstalação.

---

## 1. Pasta do Novo Projeto

O projeto web está na pasta **separada** do projeto Delphi:

```
D:\Projetos\IA - Web\ControleFinanceiroWeb\
```

O projeto Delphi em `D:\Projetos\IA - Delphi\controleFinanceiro\` continua intacto — ambos rodam em paralelo durante a transição.

---

## 2. Pré-requisitos

Antes de começar, verifique se tem instalado:

```bash
# Verificar versões
node --version          # Deve ser 20+ (recomendado 22 LTS)
npm --version           # Deve ser 10+
git --version           # Qualquer versão recente

# Se não tiver o Node 22:
# Baixar em: https://nodejs.org/
```

**Contas necessárias** (gratuitas):
- [ ] GitHub (repositório do código)
- [ ] Firebase Console (já tem — mesmo projeto do Delphi)
- [ ] Vercel (deploy do frontend) — vercel.com
- [ ] Railway (deploy do backend + banco) — railway.app

---

## 3. Criação do Repositório

```bash
# 1. Entrar na pasta (já criada)
cd "D:/Projetos/IA - Web/ControleFinanceiro"

# 2. Inicializar git
git init
git branch -M main

# 3. Criar no GitHub (via CLI)
gh repo create ControleFinanceiro --private --source=. --remote=origin

# OU criar manualmente em github.com e depois:
git remote add origin https://github.com/SEU_USUARIO/ControleFinanceiro.git
```

---

## 4. Estrutura Inicial

```bash
# Inicializar monorepo
npm init -y

# Criar estrutura de pastas
mkdir -p apps/web apps/api packages/shared .github/workflows

# Configurar workspaces no package.json raiz:
# "workspaces": ["apps/*", "packages/*"]
```

---

## 5. Inicializar o Frontend (apps/web)

```bash
cd apps
npm create vite@latest web -- --template react-ts
cd web
npm install

# Instalar dependências principais
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
npm install @tanstack/react-query
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install date-fns
npm install lucide-react
npm install firebase
npm install axios
npm install clsx tailwind-merge  # utilitários para className
```

---

## 6. Inicializar o Backend (apps/api)

```bash
cd ../api
npm init -y

# Instalar dependências
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit
npm install @prisma/client
npm install firebase-admin
npm install zod

# Dev dependencies
npm install -D typescript ts-node @types/node prisma
npm install -D nodemon

# Inicializar Prisma
npx prisma init

# Configurar DATABASE_URL no .env:
# DATABASE_URL="postgresql://USER:PASS@HOST:PORT/contasfamilia?schema=public"

# Importar schema do banco existente
npx prisma db pull

# Gerar client Prisma
npx prisma generate
```

---

## 7. Configurar Firebase

No Firebase Console (`console.firebase.google.com`):

1. Acesse o projeto existente (já em uso pelo Delphi)
2. **Adicionar app web** → copiar `firebaseConfig`
3. **Service Account** para o backend:
   - Project Settings → Service Accounts → Generate new private key
   - Salvar JSON como `apps/api/src/lib/firebase-service-account.json` (não commitar!)
   - Adicionar ao `.gitignore`

```bash
# .env do backend
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

---

## 8. Custom Claims Firebase (Perfis)

Para definir o perfil do usuário admin, rodar **uma vez**:

```javascript
// Script: scripts/set-admin-claim.js
const admin = require('firebase-admin');
// ... inicializar admin

await admin.auth().setCustomUserClaims('UID_DO_USUARIO_DIOGO', {
  role: 'admin'
});
```

Usuários sem custom claim terão role = `viewer` por padrão.

---

## 9. Variáveis de Ambiente

### apps/api/.env
```env
DATABASE_URL="postgresql://user:password@localhost:5432/contasfamilia"
FIREBASE_PROJECT_ID="seu-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@seu-projeto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
PORT=3001
NODE_ENV=development
```

### apps/web/.env
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 10. Rodar em Desenvolvimento

```bash
# Na raiz do monorepo:
npm run dev   # Inicia web (5173) + api (3001) simultaneamente via Turborepo
```

Acessar:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

---

## 11. Como Chamar Claude Code na Próxima Sessão

Na próxima conversa, na pasta `D:\Projetos\IA - Web\ControleFinanceiroWeb\`, diga:

> "Vamos continuar o desenvolvimento do Controle Financeiro Web. Leia a especificação em `D:\Projetos\IA - Delphi\controleFinanceiro\spec\` e execute a próxima task pendente do arquivo 09-tasks.md (TASK-27 em diante)"

Tasks concluídas: TASK-01 a TASK-26. Tasks pendentes: TASK-27 (testes), TASK-28 (performance), TASK-29 (PWA), TASK-30 (deploy).

---

## 12. Checklist de Início

- [x] Node 22 LTS instalado
- [x] Git configurado com nome e email
- [x] Conta GitHub criada / acessível
- [x] Firebase Console acessível (mesmo projeto do Delphi)
- [ ] Conta Vercel criada (vercel.com) — pendente (TASK-30)
- [ ] Conta Railway criada (railway.app) — pendente (TASK-30)
- [x] PostgreSQL do Delphi acessível (credenciais em mãos)
- [x] Pasta `D:\Projetos\IA - Web\ControleFinanceiroWeb\` criada
- [x] Esta especificação lida e compreendida

---

## 13. Referência Rápida de Documentos

| Para dúvidas sobre... | Consultar |
|----------------------|-----------|
| Objetivos e escopo | `01-project-brief.md` |
| Funcionalidades do Delphi atual | `02-current-system-analysis.md` |
| O que o sistema deve fazer | `03-functional-requirements.md` |
| Performance, segurança, UX | `04-non-functional-requirements.md` |
| Stack tecnológico e estrutura | `05-architecture.md` |
| Banco de dados e relações | `06-data-model.md` |
| Telas e componentes | `07-ui-ux-spec.md` |
| Endpoints da API | `08-api-spec.md` |
| Próxima tarefa a desenvolver | `09-tasks.md` |
| Como iniciar | Este documento |
