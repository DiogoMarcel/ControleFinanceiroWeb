import type { FastifyInstance } from 'fastify';

// Rotas serão registradas aqui conforme as tasks forem implementadas
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.log.info('Rotas registradas');
}
