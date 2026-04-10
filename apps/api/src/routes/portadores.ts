import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import {
  listPortadores,
  getPortador,
  createPortador,
  updatePortador,
  deletePortador,
} from '../services/portadores.service.js';

export async function portadoresRoutes(app: FastifyInstance): Promise<void> {
  // Todos os endpoints exigem autenticação
  app.addHook('preHandler', authMiddleware);

  // GET /portadores
  app.get('/portadores', async (_req, reply) => {
    const portadores = await listPortadores();
    return reply.send(portadores);
  });

  // GET /portadores/:id
  app.get<{ Params: { id: string } }>('/portadores/:id', async (req, reply) => {
    const portador = await getPortador(Number(req.params.id));
    if (!portador) return reply.code(404).send({ error: 'Portador não encontrado' });
    return reply.send(portador);
  });

  // POST /portadores — apenas admin
  app.post('/portadores', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    const portador = await createPortador(req.body as Parameters<typeof createPortador>[0]);
    return reply.code(201).send(portador);
  });

  // PUT /portadores/:id — apenas admin
  app.put<{ Params: { id: string } }>('/portadores/:id', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    const portador = await updatePortador(
      Number(req.params.id),
      req.body as Parameters<typeof updatePortador>[1],
    );
    return reply.send(portador);
  });

  // DELETE /portadores/:id — apenas admin
  app.delete<{ Params: { id: string } }>('/portadores/:id', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    try {
      await deletePortador(Number(req.params.id));
      return reply.code(204).send();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir';
      return reply.code(422).send({ error: message });
    }
  });

}
