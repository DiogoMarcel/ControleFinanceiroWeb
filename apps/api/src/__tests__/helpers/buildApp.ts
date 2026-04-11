import Fastify from 'fastify';
import { registerRoutes } from '../../routes/index.js';

/**
 * Cria uma instância Fastify de teste com todas as rotas registradas.
 * Firebase e serviços devem ser mockados antes de chamar esta função.
 */
export async function buildApp() {
  const app = Fastify({ logger: false });
  await registerRoutes(app);
  await app.ready();
  return app;
}

/** Token fictício para testes — o middleware Firebase é mockado para aceitá-lo */
export const TEST_TOKEN = 'Bearer test-token';
