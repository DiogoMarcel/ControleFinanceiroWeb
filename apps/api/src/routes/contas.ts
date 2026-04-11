import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import {
  listContas,
  getConta,
  createConta,
  updateConta,
  deleteConta,
  addTagConta,
  removeTagConta,
  toggleMarcado,
  reiniciarMarcadas,
  relatorioContasPagar,
} from '../services/contas.service.js';

type IdParam = { Params: { id: string } };
type TagParam = { Params: { id: string; tagId: string } };

function isAdmin(req: FastifyRequest, reply: { code: (n: number) => { send: (o: object) => void } }) {
  if (req.user.role !== 'admin') {
    reply.code(403).send({ error: 'Acesso negado' });
    return false;
  }
  return true;
}

function handleError(err: unknown, reply: { code: (n: number) => { send: (o: object) => void } }) {
  const message = err instanceof Error ? err.message : 'Erro interno';
  reply.code(422).send({ error: message });
}

export async function contasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /contas?tipoconta=P&id_membrofamilia=1
  app.get('/contas', async (req, reply) => {
    const { tipoconta, id_membrofamilia } = req.query as Record<string, string>;
    const contas = await listContas({
      tipoconta,
      id_membrofamilia: id_membrofamilia ? Number(id_membrofamilia) : undefined,
    });
    return reply.send(contas);
  });

  // GET /contas/:id
  app.get<IdParam>('/contas/:id', async (req, reply) => {
    const conta = await getConta(Number(req.params.id));
    if (!conta) return reply.code(404).send({ error: 'Conta não encontrada' });
    return reply.send(conta);
  });

  // POST /contas — admin
  app.post('/contas', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      const conta = await createConta(req.body as Parameters<typeof createConta>[0]);
      return reply.code(201).send(conta);
    } catch (err) { handleError(err, reply); }
  });

  // PUT /contas/:id — admin
  app.put<IdParam>('/contas/:id', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      const conta = await updateConta(
        Number(req.params.id),
        req.body as Parameters<typeof updateConta>[1],
      );
      return reply.send(conta);
    } catch (err) { handleError(err, reply); }
  });

  // DELETE /contas/:id — admin
  app.delete<IdParam>('/contas/:id', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      await deleteConta(Number(req.params.id));
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });

  // PATCH /contas/:id/marcar — qualquer usuário autenticado
  app.patch<IdParam & { Body: { marcado: boolean } }>('/contas/:id/marcar', async (req, reply) => {
    try {
      const result = await toggleMarcado(Number(req.params.id), req.body.marcado);
      return reply.send(result);
    } catch (err) { handleError(err, reply); }
  });

  // GET /contas/relatorio — relatório para impressão (a pagar, por dia de vencimento)
  app.get('/contas/relatorio', async (_req, reply) => {
    const contas = await relatorioContasPagar();
    return reply.send(contas);
  });

  // POST /contas/reiniciar — qualquer usuário autenticado
  app.post<{ Body: { tipoconta: string } }>('/contas/reiniciar', async (req, reply) => {
    try {
      const { tipoconta } = req.body as { tipoconta: 'P' | 'R' };
      await reiniciarMarcadas(tipoconta);
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });

  // POST /contas/:id/tags/:tagId — admin
  app.post<TagParam>('/contas/:id/tags/:tagId', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      await addTagConta(Number(req.params.id), Number(req.params.tagId));
      return reply.code(201).send();
    } catch (err) { handleError(err, reply); }
  });

  // DELETE /contas/:id/tags/:tagId — admin
  app.delete<TagParam>('/contas/:id/tags/:tagId', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      await removeTagConta(Number(req.params.id), Number(req.params.tagId));
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });
}
