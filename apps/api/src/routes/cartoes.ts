import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export async function cartoesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /cartoes?id_membro=1
  app.get('/cartoes', async (req, reply) => {
    const { id_membro } = req.query as { id_membro?: string };
    const cartoes = await prisma.cartao.findMany({
      where: id_membro ? { id_membrofamilia: Number(id_membro) } : undefined,
      include: { membrofamilia: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
    return reply.send(cartoes);
  });

  // POST /cartoes
  app.post('/cartoes', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    const { nome, diavencimento, bandeira, id_membrofamilia } = req.body as {
      nome: string;
      diavencimento?: number;
      bandeira?: string;
      id_membrofamilia?: number;
    };
    const cartao = await prisma.cartao.create({
      data: { nome, diavencimento, bandeira, id_membrofamilia },
    });
    return reply.code(201).send(cartao);
  });

  // PUT /cartoes/:id
  app.put<{ Params: { id: string } }>('/cartoes/:id', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    const { nome, diavencimento, bandeira, id_membrofamilia } = req.body as {
      nome?: string;
      diavencimento?: number;
      bandeira?: string;
      id_membrofamilia?: number;
    };
    const cartao = await prisma.cartao.update({
      where: { idcartao: Number(req.params.id) },
      data: { nome, diavencimento, bandeira, id_membrofamilia },
    });
    return reply.send(cartao);
  });

  // DELETE /cartoes/:id
  app.delete<{ Params: { id: string } }>('/cartoes/:id', async (req, reply) => {
    if (req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Acesso negado' });
    }
    await prisma.cartao.delete({ where: { idcartao: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /cartoes/:id/despesas?mes=2026-04
  app.get<{ Params: { id: string } }>('/cartoes/:id/despesas', async (req, reply) => {
    const idcartao = Number(req.params.id);
    const { mes } = req.query as { mes?: string };

    let inicio: Date | undefined;
    let fim: Date | undefined;

    if (mes) {
      const [ano, m] = mes.split('-').map(Number);
      inicio = new Date(ano, m - 1, 1);
      fim = new Date(ano, m, 0); // último dia do mês
    }

    const despesas = await prisma.despesacartao.findMany({
      where: {
        id_cartao: idcartao,
        ...(inicio && fim
          ? { datadespesa: { gte: inicio, lte: fim } }
          : {}),
      },
      orderBy: { datadespesa: 'desc' },
    });

    const total = despesas.reduce((sum, d) => sum + (d.valor ?? 0), 0);

    return reply.send({ despesas, total });
  });

  // POST /cartoes/:id/despesas
  app.post<{ Params: { id: string } }>('/cartoes/:id/despesas', async (req, reply) => {
    const idcartao = Number(req.params.id);
    const { descricao, valor, data } = req.body as {
      descricao: string;
      valor: number;
      data?: string;
    };

    const despesa = await prisma.despesacartao.create({
      data: {
        descricao,
        valor,
        datadespesa: data ? new Date(data) : new Date(),
        id_cartao: idcartao,
      },
    });
    return reply.code(201).send(despesa);
  });

  // DELETE /cartoes/:id/despesas/:idDespesa
  app.delete<{ Params: { id: string; idDespesa: string } }>(
    '/cartoes/:id/despesas/:idDespesa',
    async (req, reply) => {
      await prisma.despesacartao.delete({
        where: { iddespesacartao: Number(req.params.idDespesa) },
      });
      return reply.code(204).send();
    },
  );
}
