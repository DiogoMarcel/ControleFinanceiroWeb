import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export async function relatoriosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /relatorios/saldo-por-portador
  // Retorna saldo atual de cada portador (exceto reservado e capital)
  app.get('/relatorios/saldo-por-portador', async (_req, reply) => {
    const portadores = await prisma.portador.findMany({
      include: {
        saldoportador: true,
        membrofamilia: { select: { nome: true } },
      },
      orderBy: { nomeportador: 'asc' },
    });

    const result = portadores
      .filter((p) => p.saldoportador !== null)
      .map((p) => ({
        id: p.idportador,
        nome: p.nomeportador,
        membro: p.membrofamilia.nome,
        valor: p.saldoportador?.valor ?? 0,
        reservado: p.saldoportador?.reservado ?? false,
        contacapital: p.saldoportador?.contacapital ?? false,
      }));

    return reply.send(result);
  });

  // GET /relatorios/gastos-por-tag?mes=2026-04
  app.get('/relatorios/gastos-por-tag', async (req, reply) => {
    const { mes } = req.query as { mes?: string };

    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (mes) {
      const [ano, m] = mes.split('-').map(Number);
      dateFilter = {
        gte: new Date(ano, m - 1, 1),
        lte: new Date(ano, m, 0),
      };
    }

    // Busca contas do tipo Pagar no período com suas tags
    const contas = await prisma.conta.findMany({
      where: {
        tipoconta: 'P',
        debitacartao: { not: true },
        ...(dateFilter
          ? {
              contapagamentos: {
                some: { dataconta: dateFilter },
              },
            }
          : {}),
      },
      include: {
        contatag: {
          include: { tags: true },
        },
      },
    });

    // Agrega por tag
    const mapaTag = new Map<number, { id: number; descricao: string; total: number }>();
    let semTag = 0;

    for (const conta of contas) {
      if (conta.contatag.length === 0) {
        semTag += conta.valor;
      } else {
        for (const ct of conta.contatag) {
          if (!ct.tags) continue;
          const { idtags, descricao } = ct.tags;
          const label = descricao ?? `Tag ${idtags}`;
          const entry = mapaTag.get(idtags) ?? { id: idtags, descricao: label, total: 0 };
          entry.total += conta.valor;
          mapaTag.set(idtags, entry);
        }
      }
    }

    const result = [
      ...Array.from(mapaTag.values()).sort((a, b) => b.total - a.total),
      ...(semTag > 0 ? [{ id: 0, descricao: 'Sem categoria', total: semTag }] : []),
    ];

    return reply.send(result);
  });

  // GET /relatorios/comparativo-meses?meses=6
  app.get('/relatorios/comparativo-meses', async (req, reply) => {
    const { meses } = req.query as { meses?: string };
    const qtd = Math.min(Number(meses ?? 6), 24);

    // Calcula o início do período
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - qtd + 1, 1);

    const registros = await prisma.saldoextrato.findMany({
      where: {
        datalancamento: { gte: inicio },
        tiposaldo: { in: ['P', 'R'] },
      },
      select: { datalancamento: true, tiposaldo: true, valor: true },
    });

    // Agrega por YYYY-MM e tipo
    const mapa = new Map<string, { mes: string; pagamentos: number; recebimentos: number }>();

    for (const r of registros) {
      const d = r.datalancamento;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = mapa.get(key) ?? { mes: key, pagamentos: 0, recebimentos: 0 };
      if (r.tiposaldo === 'P') entry.pagamentos += r.valor;
      else entry.recebimentos += r.valor;
      mapa.set(key, entry);
    }

    const result = Array.from(mapa.values()).sort((a, b) => a.mes.localeCompare(b.mes));

    return reply.send(result);
  });
}
