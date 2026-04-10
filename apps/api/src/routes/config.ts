import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import {
  listMembros, getMembro, createMembro, updateMembro, deleteMembro,
  listCredores, getCredor, createCredor, updateCredor, deleteCredor,
  listTags, getTag, createTag, updateTag, deleteTag,
} from '../services/config.service.js';

type IdParam = { Params: { id: string } };
type NameBody = { Body: { nome: string } };
type DescBody = { Body: { descricao: string } };

function adminOnly(req: { user: { role: string } }, reply: { code: (n: number) => { send: (o: object) => void } }) {
  if (req.user.role !== 'admin') {
    reply.code(403).send({ error: 'Acesso negado' });
    return false;
  }
  return true;
}

function handleError(err: unknown, reply: Parameters<typeof adminOnly>[1]) {
  const message = err instanceof Error ? err.message : 'Erro interno';
  reply.code(422).send({ error: message });
}

export async function configRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // ── Membros ──────────────────────────────────────────────────────────────

  app.get('/membros', async (_req, reply) => {
    return reply.send(await listMembros());
  });

  app.get<IdParam>('/membros/:id', async (req, reply) => {
    const m = await getMembro(Number(req.params.id));
    if (!m) return reply.code(404).send({ error: 'Membro não encontrado' });
    return reply.send(m);
  });

  app.post<NameBody>('/membros', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.code(201).send(await createMembro(req.body.nome));
    } catch (err) { handleError(err, reply); }
  });

  app.put<IdParam & NameBody>('/membros/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.send(await updateMembro(Number(req.params.id), req.body.nome));
    } catch (err) { handleError(err, reply); }
  });

  app.delete<IdParam>('/membros/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      await deleteMembro(Number(req.params.id));
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });

  // ── Credores ─────────────────────────────────────────────────────────────

  app.get('/credores', async (_req, reply) => {
    return reply.send(await listCredores());
  });

  app.get<IdParam>('/credores/:id', async (req, reply) => {
    const c = await getCredor(Number(req.params.id));
    if (!c) return reply.code(404).send({ error: 'Credor não encontrado' });
    return reply.send(c);
  });

  app.post<NameBody>('/credores', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.code(201).send(await createCredor(req.body.nome));
    } catch (err) { handleError(err, reply); }
  });

  app.put<IdParam & NameBody>('/credores/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.send(await updateCredor(Number(req.params.id), req.body.nome));
    } catch (err) { handleError(err, reply); }
  });

  app.delete<IdParam>('/credores/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      await deleteCredor(Number(req.params.id));
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });

  // ── Tags ──────────────────────────────────────────────────────────────────

  app.get('/tags', async (_req, reply) => {
    return reply.send(await listTags());
  });

  app.get<IdParam>('/tags/:id', async (req, reply) => {
    const t = await getTag(Number(req.params.id));
    if (!t) return reply.code(404).send({ error: 'Tag não encontrada' });
    return reply.send(t);
  });

  app.post<DescBody>('/tags', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.code(201).send(await createTag(req.body.descricao));
    } catch (err) { handleError(err, reply); }
  });

  app.put<IdParam & DescBody>('/tags/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      return reply.send(await updateTag(Number(req.params.id), req.body.descricao));
    } catch (err) { handleError(err, reply); }
  });

  app.delete<IdParam>('/tags/:id', async (req, reply) => {
    if (!adminOnly(req, reply)) return;
    try {
      await deleteTag(Number(req.params.id));
      return reply.code(204).send();
    } catch (err) { handleError(err, reply); }
  });
}
