import type { FastifyInstance } from 'fastify';
import { dashboardRoutes } from './dashboard.js';
import { portadoresRoutes } from './portadores.js';
import { configRoutes } from './config.js';
import { contasRoutes } from './contas.js';
import { pagamentosRoutes } from './pagamentos.js';
import { extratoRoutes } from './extrato.js';
import { cartoesRoutes } from './cartoes.js';
import { relatoriosRoutes } from './relatorios.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.register(dashboardRoutes, { prefix: '/api/v1' });
  app.register(portadoresRoutes, { prefix: '/api/v1' });
  app.register(configRoutes, { prefix: '/api/v1' });
  app.register(contasRoutes, { prefix: '/api/v1' });
  app.register(pagamentosRoutes, { prefix: '/api/v1' });
  app.register(extratoRoutes, { prefix: '/api/v1' });
  app.register(cartoesRoutes, { prefix: '/api/v1' });
  app.register(relatoriosRoutes, { prefix: '/api/v1' });
}
