import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

function calcConsumoMedio(abastecimentos: { kmcarro: number; quantidadelitros: number }[]) {
  if (abastecimentos.length < 2) return null;
  const sorted = [...abastecimentos].sort((a, b) => a.kmcarro - b.kmcarro);
  let total = 0;
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const deltaKm = sorted[i].kmcarro - sorted[i - 1].kmcarro;
    if (deltaKm > 0 && sorted[i].quantidadelitros > 0) {
      total += deltaKm / sorted[i].quantidadelitros;
      count++;
    }
  }
  return count > 0 ? total / count : null;
}

export async function veiculosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /veiculos
  app.get('/veiculos', async (_req, reply) => {
    const veiculos = await prisma.veiculos.findMany({ orderBy: { modelo: 'asc' } });
    return reply.send(veiculos);
  });

  // POST /veiculos
  app.post('/veiculos', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { modelo, marca, cor, datacompra, valorcompra, datavenda, valorvenda } = req.body as {
      modelo: string; marca: string; cor: string;
      datacompra: string; valorcompra: number;
      datavenda?: string; valorvenda?: number;
    };
    const veiculo = await prisma.veiculos.create({
      data: {
        modelo, marca, cor,
        datacompra: new Date(datacompra),
        valorcompra,
        datavenda: datavenda ? new Date(datavenda) : null,
        valorvenda: valorvenda ?? null,
      },
    });
    return reply.code(201).send(veiculo);
  });

  // PUT /veiculos/:id
  app.put<{ Params: { id: string } }>('/veiculos/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { modelo, marca, cor, datacompra, valorcompra, datavenda, valorvenda } = req.body as {
      modelo?: string; marca?: string; cor?: string;
      datacompra?: string; valorcompra?: number;
      datavenda?: string | null; valorvenda?: number | null;
    };
    const veiculo = await prisma.veiculos.update({
      where: { idveiculo: Number(req.params.id) },
      data: {
        modelo, marca, cor,
        ...(datacompra ? { datacompra: new Date(datacompra) } : {}),
        valorcompra,
        datavenda: datavenda ? new Date(datavenda) : null,
        valorvenda: valorvenda ?? null,
      },
    });
    return reply.send(veiculo);
  });

  // DELETE /veiculos/:id
  app.delete<{ Params: { id: string } }>('/veiculos/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    await prisma.veiculos.delete({ where: { idveiculo: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /veiculos/:id/abastecimentos?inicio=2026-01-01&fim=2026-12-31
  app.get<{ Params: { id: string } }>('/veiculos/:id/abastecimentos', async (req, reply) => {
    const id = Number(req.params.id);
    const { inicio, fim } = req.query as { inicio?: string; fim?: string };

    const abastecimentos = await prisma.abastecimentos.findMany({
      where: {
        id_veiculo: id,
        ...(inicio || fim
          ? {
              dataabastecimento: {
                ...(inicio ? { gte: new Date(inicio) } : {}),
                ...(fim ? { lte: new Date(fim) } : {}),
              },
            }
          : {}),
      },
      orderBy: { dataabastecimento: 'desc' },
    });

    const totalLitros = abastecimentos.reduce((s, a) => s + a.quantidadelitros, 0);
    const custoTotal = abastecimentos.reduce((s, a) => s + a.totalabastecimento, 0);
    const consumoMedio = calcConsumoMedio(abastecimentos);

    return reply.send({ abastecimentos, totalLitros, custoTotal, consumoMedio });
  });

  // POST /veiculos/:id/abastecimentos
  app.post<{ Params: { id: string } }>('/veiculos/:id/abastecimentos', async (req, reply) => {
    const id = Number(req.params.id);
    const { dataabastecimento, totalabastecimento, kmcarro, quantidadelitros, observacao } = req.body as {
      dataabastecimento?: string;
      totalabastecimento: number;
      kmcarro: number;
      quantidadelitros: number;
      observacao?: string;
    };
    const abast = await prisma.abastecimentos.create({
      data: {
        id_veiculo: id,
        totalabastecimento,
        kmcarro,
        quantidadelitros,
        observacao: observacao ?? null,
        ...(dataabastecimento ? { dataabastecimento: new Date(dataabastecimento) } : {}),
      },
    });
    return reply.code(201).send(abast);
  });

  // PUT /veiculos/:id/abastecimentos/:idAbast
  app.put<{ Params: { id: string; idAbast: string } }>(
    '/veiculos/:id/abastecimentos/:idAbast',
    async (req, reply) => {
      const { dataabastecimento, totalabastecimento, kmcarro, quantidadelitros, observacao } = req.body as {
        dataabastecimento?: string;
        totalabastecimento?: number;
        kmcarro?: number;
        quantidadelitros?: number;
        observacao?: string | null;
      };
      const abast = await prisma.abastecimentos.update({
        where: { idabastecimento: Number(req.params.idAbast) },
        data: {
          totalabastecimento,
          kmcarro,
          quantidadelitros,
          observacao: observacao ?? null,
          ...(dataabastecimento ? { dataabastecimento: new Date(dataabastecimento) } : {}),
        },
      });
      return reply.send(abast);
    },
  );

  // DELETE /veiculos/:id/abastecimentos/:idAbast
  app.delete<{ Params: { id: string; idAbast: string } }>(
    '/veiculos/:id/abastecimentos/:idAbast',
    async (req, reply) => {
      await prisma.abastecimentos.delete({
        where: { idabastecimento: Number(req.params.idAbast) },
      });
      return reply.code(204).send();
    },
  );
}
