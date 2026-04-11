# 04 — Requisitos Não-Funcionais

---

## NFR-PERF — Performance

| ID | Requisito | Meta |
|----|-----------|------|
| PERF-01 | Tempo de carregamento inicial (LCP) | < 2.5s em 4G |
| PERF-02 | Tempo de resposta da API para listagens | < 500ms |
| PERF-03 | Tempo de resposta para operações de escrita | < 1s |
| PERF-04 | Dashboard deve carregar com dados em < 3s | < 3s |
| PERF-05 | Gráficos devem renderizar sem travar a UI | Async/lazy |

---

## NFR-SEG — Segurança

| ID | Requisito | Detalhes |
|----|-----------|----------|
| SEG-01 | Toda comunicação via HTTPS | TLS 1.2+ obrigatório |
| SEG-02 | Autenticação via Firebase Auth com JWT | Token expira em 1h, refresh automático |
| SEG-03 | API valida token em cada requisição | Middleware de auth em todas as rotas protegidas |
| SEG-04 | Senha do FGTS armazenada criptografada | bcrypt ou AES-256 no backend |
| SEG-05 | Rate limiting na API | Máx 100 req/min por IP |
| SEG-06 | Proteção contra SQL Injection | Uso de ORM com prepared statements |
| SEG-07 | Proteção contra XSS | Sanitização de inputs, Content Security Policy |
| SEG-08 | CORS configurado corretamente | Apenas domínios autorizados |
| SEG-09 | Variáveis sensíveis em variáveis de ambiente | Nunca no código-fonte |
| SEG-10 | Headers de segurança HTTP | helmet.js ou equivalente |

---

## NFR-DISP — Disponibilidade e Confiabilidade

| ID | Requisito | Meta |
|----|-----------|------|
| DISP-01 | Uptime da aplicação | > 99% mensal |
| DISP-02 | Backup automático do banco de dados | Diário |
| DISP-03 | Tratamento gracioso de erros da API | Retornar mensagens amigáveis |
| DISP-04 | Retry automático em falhas de rede transientes | Máx 3 tentativas |

---

## NFR-UX — Usabilidade e Acessibilidade

| ID | Requisito | Detalhes |
|----|-----------|----------|
| UX-01 | Interface responsiva (mobile-first) | Funcionar em telas ≥ 320px |
| UX-02 | Suporte a dark mode | Toggle ou segue preferência do sistema |
| UX-03 | Feedback visual para todas as ações | Loading states, success/error toasts |
| UX-04 | Navegação por teclado funcional | Tab order lógico |
| UX-05 | Mensagens de erro claras e em português | Sem mensagens técnicas expostas ao usuário |
| UX-06 | Confirmação antes de ações destrutivas (deletar) | Modal de confirmação |
| UX-07 | Valores monetários formatados em R$ | Padrão brasileiro: R$ 1.234,56 |
| UX-08 | Datas no formato brasileiro | DD/MM/AAAA |
| UX-09 | Formulários com validação em tempo real | Sem precisar submeter para ver erros |

---

## NFR-MAINT — Manutenibilidade

| ID | Requisito | Detalhes |
|----|-----------|----------|
| MAINT-01 | Código TypeScript com tipagem estrita | `strict: true` no tsconfig |
| MAINT-02 | Variáveis de ambiente documentadas em `.env.example` | Sem secrets no repositório |
| MAINT-03 | Estrutura de projeto modular e escalável | Feature-based ou layer-based |
| MAINT-04 | Testes de integração nas rotas críticas da API | Auth, CRUD de contas, baixa |
| MAINT-05 | Logs estruturados no backend | JSON logs com nível e contexto |
| MAINT-06 | CI/CD automatizado (GitHub Actions) | Build + lint + testes em cada PR |

---

## NFR-DEPLOY — Infraestrutura e Deploy

| ID | Requisito | Detalhes |
|----|-----------|----------|
| INFRA-01 | Frontend hospedado no Vercel | Deploy automático via Git |
| INFRA-02 | Backend hospedado no Railway | Com PostgreSQL integrado |
| INFRA-03 | Domínio personalizado configurável | SSL automático via Let's Encrypt |
| INFRA-04 | Variáveis de ambiente por ambiente (dev/prod) | Separação clara |
| INFRA-05 | Banco de dados com backup automático | Railway oferece backup diário |
