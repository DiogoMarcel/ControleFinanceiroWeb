import type { FastifyInstance } from 'fastify';
import { dashboardRoutes } from './dashboard.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.register(dashboardRoutes, { prefix: '/api/v1' });
}
