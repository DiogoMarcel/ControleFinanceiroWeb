import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export async function alugueisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /alugueis?ano=2025
  app.get('/alugueis', async (req, reply) => {
    const { ano } = req.query as { ano?: string };

    const where = ano
      ? {
          dataaluguel: {
            gte: new Date(`${ano}-01-01`),
            lte: new Date(`${ano}-12-31`),
          },
        }
      : undefined;

    const alugueis = await prisma.aluguel.findMany({
      where,
      include: {
        aluguelconta: { orderBy: { idaluguelconta: 'asc' } },
        aluguelcomp: { orderBy: { datapagamento: 'asc' } },
      },
      orderBy: { dataaluguel: 'desc' },
    });

    return reply.send(alugueis);
  });

  // POST /alugueis
  app.post('/alugueis', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { dataaluguel, valoraluguel, datapagamento } = req.body as {
      dataaluguel: string;
      valoraluguel?: number;
      datapagamento?: string;
    };
    const aluguel = await prisma.aluguel.create({
      data: {
        dataaluguel: new Date(dataaluguel),
        valoraluguel: valoraluguel ?? null,
        datapagamento: datapagamento ? new Date(datapagamento) : null,
      },
      include: { aluguelconta: true, aluguelcomp: true },
    });
    return reply.code(201).send(aluguel);
  });

  // PUT /alugueis/:id
  app.put<{ Params: { id: string } }>('/alugueis/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { dataaluguel, valoraluguel, datapagamento } = req.body as {
      dataaluguel?: string;
      valoraluguel?: number | null;
      datapagamento?: string | null;
    };
    const aluguel = await prisma.aluguel.update({
      where: { idaluguel: Number(req.params.id) },
      data: {
        ...(dataaluguel ? { dataaluguel: new Date(dataaluguel) } : {}),
        ...(valoraluguel !== undefined ? { valoraluguel } : {}),
        datapagamento: datapagamento ? new Date(datapagamento) : null,
      },
      include: { aluguelconta: true, aluguelcomp: true },
    });
    return reply.send(aluguel);
  });

  // DELETE /alugueis/:id
  app.delete<{ Params: { id: string } }>('/alugueis/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    await prisma.aluguel.delete({ where: { idaluguel: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /alugueis/:id/contas
  app.get<{ Params: { id: string } }>('/alugueis/:id/contas', async (req, reply) => {
    const contas = await prisma.aluguelconta.findMany({
      where: { id_aluguel: Number(req.params.id) },
      orderBy: { idaluguelconta: 'asc' },
    });
    return reply.send(contas);
  });

  // POST /alugueis/:id/contas
  app.post<{ Params: { id: string } }>('/alugueis/:id/contas', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { tipoconta, valor, descricao, compartilhado } = req.body as {
      tipoconta: string;
      valor: number;
      descricao: string;
      compartilhado?: string;
    };
    const conta = await prisma.aluguelconta.create({
      data: {
        id_aluguel: Number(req.params.id),
        tipoconta,
        valor,
        descricao,
        compartilhado: compartilhado ?? 'N',
      },
    });
    return reply.code(201).send(conta);
  });

  // PUT /alugueis/:id/contas/:idConta
  app.put<{ Params: { id: string; idConta: string } }>(
    '/alugueis/:id/contas/:idConta',
    async (req, reply) => {
      if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
      const { tipoconta, valor, descricao, compartilhado } = req.body as {
        tipoconta?: string;
        valor?: number;
        descricao?: string;
        compartilhado?: string;
      };
      const conta = await prisma.aluguelconta.update({
        where: { idaluguelconta: Number(req.params.idConta) },
        data: { tipoconta, valor, descricao, compartilhado },
      });
      return reply.send(conta);
    },
  );

  // DELETE /alugueis/:id/contas/:idConta
  app.delete<{ Params: { id: string; idConta: string } }>(
    '/alugueis/:id/contas/:idConta',
    async (req, reply) => {
      if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
      await prisma.aluguelconta.delete({
        where: { idaluguelconta: Number(req.params.idConta) },
      });
      return reply.code(204).send();
    },
  );
}
