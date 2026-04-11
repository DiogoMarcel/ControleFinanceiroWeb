# 01 — Project Brief

> **ID do Projeto**: CFW-2026 (Controle Financeiro Web)  
> **Data**: 2026-04-08  
> **Versão**: 1.0.0

---

## 1. Contexto

O sistema atual é uma aplicação desktop desenvolvida em **Delphi** (Pascal), conectada a um banco **PostgreSQL**. Funciona apenas no computador onde está instalado, sem acesso remoto. A família precisa de um sistema acessível de qualquer lugar — celular, tablet, outro computador — que permita visualizar e gerenciar as finanças pessoais com segurança.

## 2. Problema

- Acesso restrito a um único computador
- Sem acesso via celular
- Outros membros da família não conseguem consultar sem acesso físico à máquina
- Interface não adaptada para telas pequenas
- Relatórios estáticos (sem interatividade)

## 3. Objetivo

Migrar o sistema de controle financeiro familiar para uma **aplicação web moderna**, mantendo todas as funcionalidades atuais e adicionando:

- Acesso de qualquer dispositivo (mobile-first)
- Controle de acesso por perfil (Admin / Visualizador)
- Gráficos e relatórios dinâmicos e interativos
- Interface visualmente atraente e intuitiva
- Segurança adequada para dados financeiros pessoais

## 4. Stakeholders

| Perfil | Descrição | Nível de Acesso |
|--------|-----------|-----------------|
| **Admin (Diogo)** | Proprietário do sistema, gerencia tudo | Total (CRUD) |
| **Família** | Outros membros da família | Visualização + lançamentos próprios |
| **Visualizador** | Acesso somente leitura | Somente dashboards e relatórios |

## 5. Escopo do Projeto

### 5.1 Incluído (In Scope)
- Migração de todas as funcionalidades do sistema Delphi atual
- Dashboard principal com saldos e gráficos
- Gestão de contas a pagar e receber
- Controle de portadores (contas bancárias, dinheiro, investimentos, poupança)
- Controle de cartões de crédito
- Controle de credores
- Controle de membros da família
- Extrato e histórico de saldos
- Relatórios dinâmicos (gráficos interativos)
- Controle de veículos e abastecimentos
- Controle de aluguéis
- Tags e categorização
- FGTS tracking
- Autenticação segura (Firebase Auth)
- Interface responsiva (mobile + desktop)

### 5.2 Excluído (Out of Scope — Fase 1)
- Módulo EsteticaProj (sub-projeto de estética — fase futura separada)
- Integração bancária automática (Open Finance)
- App nativo iOS/Android
- Exportação para contabilidade formal

## 6. Critérios de Sucesso

1. Todos os módulos do Delphi funcionando na web
2. Acesso via celular sem perda de funcionalidade crítica
3. Tempo de carregamento de página < 2s em 4G
4. Sistema seguro: autenticação obrigatória, dados criptografados em trânsito
5. Relatórios e gráficos interativos funcionando
6. Dados PostgreSQL existentes acessíveis (sem perda de histórico)

## 7. Restrições

- Manter o banco PostgreSQL existente (dados históricos valiosos)
- Orçamento limitado: usar serviços gratuitos/baratos (Vercel, Railway free tier)
- Desenvolvimento incremental: o Delphi continuará operando até a web estar estável

## 8. Timeline Estimado

| Fase | Entregável | Estimativa |
|------|-----------|------------|
| Setup | Projeto configurado, deploy CI/CD | Semana 1 |
| Core | Auth + Dashboard + Portadores | Semanas 2-3 |
| Financeiro | Contas, pagamentos, extrato | Semanas 4-6 |
| Relatórios | Gráficos e relatórios dinâmicos | Semanas 7-8 |
| Complementar | Veículos, aluguéis, FGTS | Semanas 9-10 |
| Polimento | UX, testes, otimizações | Semanas 11-12 |
