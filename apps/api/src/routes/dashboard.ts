import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { getDashboardData } from '../services/dashboard.service.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard', { preHandler: authMiddleware }, async (_request, reply) => {
    const data = await getDashboardData();
    return reply.send(data);
  });
}
