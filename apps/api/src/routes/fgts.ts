import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export async function fgtsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /fgts?id_membro=1 — senha nunca exposta
  app.get('/fgts', async (req, reply) => {
    const { id_membro } = req.query as { id_membro?: string };
    const registros = await prisma.saldofgts.findMany({
      where: id_membro ? { id_membrofamilia: Number(id_membro) } : undefined,
      include: { membrofamilia: { select: { nome: true } } },
      orderBy: { id_membrofamilia: 'asc' },
    });

    const result = registros.map(({ senha: _senha, ...r }) => r);
    return reply.send(result);
  });

  // POST /fgts
  app.post('/fgts', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { nropis, saldo, id_membrofamilia, senha } = req.body as {
      nropis: string;
      saldo?: number;
      id_membrofamilia?: number;
      senha?: string;
    };
    const registro = await prisma.saldofgts.create({
      data: {
        nropis,
        saldo: saldo ?? null,
        id_membrofamilia: id_membrofamilia ?? null,
        senha: senha ?? null,
      },
      include: { membrofamilia: { select: { nome: true } } },
    });
    const { senha: _senha, ...result } = registro;
    return reply.code(201).send(result);
  });

  // PUT /fgts/:id — permite atualizar saldo, nropis e senha
  app.put<{ Params: { id: string } }>('/fgts/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { nropis, saldo, id_membrofamilia, senha } = req.body as {
      nropis?: string;
      saldo?: number | null;
      id_membrofamilia?: number | null;
      senha?: string | null;
    };
    const registro = await prisma.saldofgts.update({
      where: { idsaldofgts: Number(req.params.id) },
      data: {
        ...(nropis !== undefined ? { nropis } : {}),
        ...(saldo !== undefined ? { saldo } : {}),
        ...(id_membrofamilia !== undefined ? { id_membrofamilia } : {}),
        ...(senha !== undefined ? { senha } : {}),
      },
      include: { membrofamilia: { select: { nome: true } } },
    });
    const { senha: _senha, ...result } = registro;
    return reply.send(result);
  });

  // DELETE /fgts/:id
  app.delete<{ Params: { id: string } }>('/fgts/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    await prisma.saldofgts.delete({ where: { idsaldofgts: Number(req.params.id) } });
    return reply.code(204).send();
  });
}
