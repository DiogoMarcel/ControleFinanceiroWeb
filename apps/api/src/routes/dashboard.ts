import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { getDashboardData } from '../services/dashboard.service.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/dashboard',
    { preHandler: authMiddleware },
    async (request, reply) => {
      const query = request.query as { mes?: string };
      const mes = query.mes ?? new Date().toISOString().slice(0, 7); // YYYY-MM

      const data = await getDashboardData(mes);
      return reply.send(data);
    },
  );
}
