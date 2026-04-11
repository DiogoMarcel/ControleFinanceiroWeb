# Controle Financeiro Familiar — Especificação Web

> **Metodologia**: TLC Spec-Driven v2.0.0  
> **Data**: 2026-04-08  
> **Status**: Fase 1 (Specify) — Em andamento

## Índice da Documentação

| # | Documento | Descrição | Status |
|---|-----------|-----------|--------|
| 01 | [Project Brief](./01-project-brief.md) | Contexto, objetivos e stakeholders | ✅ Completo |
| 02 | [Análise do Sistema Atual](./02-current-system-analysis.md) | Mapeamento do Delphi atual | ✅ Completo |
| 03 | [Requisitos Funcionais](./03-functional-requirements.md) | Todos os requisitos com IDs rastreáveis | ✅ Completo |
| 04 | [Requisitos Não-Funcionais](./04-non-functional-requirements.md) | Performance, segurança, acessibilidade | ✅ Completo |
| 05 | [Arquitetura do Sistema](./05-architecture.md) | Stack tecnológico e design arquitetural | ✅ Completo |
| 06 | [Modelo de Dados](./06-data-model.md) | Schema PostgreSQL migrado para web | ✅ Completo |
| 07 | [Design UI/UX](./07-ui-ux-spec.md) | Telas, fluxos e componentes | ✅ Completo |
| 08 | [Design da API](./08-api-spec.md) | Endpoints REST documentados | ✅ Completo |
| 09 | [Plano de Tarefas](./09-tasks.md) | Breakdown de desenvolvimento | ✅ Completo |
| 10 | [Guia de Início](./10-getting-started.md) | Como iniciar o projeto web do zero | ✅ Completo |

## Resumo Executivo

**Projeto**: Migração do sistema de controle financeiro familiar de desktop (Delphi) para aplicação web moderna, responsiva e acessível de qualquer dispositivo.

**Banco de dados**: PostgreSQL (mantido — apenas ajustes de schema)  
**Frontend**: React + TypeScript + Tailwind CSS + Recharts  
**Backend**: Node.js + Fastify + Prisma ORM  
**Auth**: Firebase Authentication (já em uso no Delphi)  
**Deploy**: Vercel (frontend) + Railway (backend + PostgreSQL)

## Fluxo de Fases

```
[SPEC ✅] → [DESIGN ✅] → [TASKS ✅] → [EXECUTE: próxima conversa]
```

O desenvolvimento começa na pasta:
```
D:\Projetos\IA - Web\ControleFinanceiroWeb\
```
