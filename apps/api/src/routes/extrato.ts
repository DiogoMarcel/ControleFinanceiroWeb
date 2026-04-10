import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

const TIPO_DESCRICAO: Record<string, string> = {
  '=': 'Inicial',
  P: 'Pagamento',
  R: 'Recebimento',
};

export async function extratoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /extrato?inicio=2026-01-01&fim=2026-04-30&tipo=P
  app.get('/extrato', async (req, reply) => {
    const { inicio, fim, tipo } = req.query as {
      inicio?: string;
      fim?: string;
      tipo?: string;
    };

    const where: Record<string, unknown> = {};

    if (inicio || fim) {
      where.datalancamento = {
        ...(inicio ? { gte: new Date(inicio) } : {}),
        ...(fim ? { lte: new Date(fim) } : {}),
      };
    }

    if (tipo) {
      where.tiposaldo = tipo;
    }

    const registros = await prisma.saldoextrato.findMany({
      where,
      orderBy: { datalancamento: 'desc' },
      include: {
        conta: {
          select: { descricao: true },
        },
      },
    });

    const result = registros.map((r) => ({
      idsaldoextrato: r.idsaldoextrato,
      datalancamento: r.datalancamento,
      tiposaldo: r.tiposaldo,
      tipoDescricao: TIPO_DESCRICAO[r.tiposaldo] ?? r.tiposaldo,
      valor: r.valor,
      saldo: r.saldo,
      descricao: r.descricao,
      id_conta: r.id_conta,
      contaDescricao: r.conta?.descricao ?? null,
    }));

    return reply.send(result);
  });
}
