import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';

const TIPO_DESCRICAO: Record<string, string> = {
  '=': 'Inicial',
  P: 'Pagamento',
  R: 'Recebimento',
};

interface EvolucaoPortadorRow {
  idportador: number;
  nomeportador: string;
  nomemembro: string;
  saldo_atual: number | string;
  changes_after_fim: number | string;
  variacao_periodo: number | string;
}

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
      orderBy: { idsaldoextrato: 'desc' },
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

  // GET /extrato/evolucao-portadores?inicio=2026-04-01&fim=2026-04-30
  // Retorna saldo inicial, final e variação de cada portador no período.
  // A variação é calculada a partir das entradas de saldoextrato cuja
  // descrição começa com "{idportador} - " (padrão gravado pelo serviço).
  app.get('/extrato/evolucao-portadores', async (req, reply) => {
    const { inicio, fim } = req.query as { inicio?: string; fim?: string };

    const now = new Date();
    const anoMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const inicioStr = inicio ?? `${anoMes}-01`;
    const fimStr =
      fim ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      ).padStart(2, '0')}`;

    // Valida formato YYYY-MM-DD antes de usar em Prisma.raw
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(inicioStr) || !dateRe.test(fimStr)) {
      return reply.code(400).send({ error: 'Formato de data inválido (esperado YYYY-MM-DD)' });
    }

    const rows = await prisma.$queryRaw<EvolucaoPortadorRow[]>(Prisma.sql`
      SELECT
        p.idportador,
        p.nomeportador,
        m.nome                    AS nomemembro,
        COALESCE(sp.valor, 0)     AS saldo_atual,
        -- Soma das mudanças APÓS o fim do período (para "desfazê-las" e obter saldo_fim)
        COALESCE((
          SELECT SUM(CASE WHEN se.tiposaldo = 'R' THEN se.valor
                          WHEN se.tiposaldo = 'P' THEN -se.valor
                          ELSE 0 END)
          FROM saldoextrato se
          WHERE se.descricao LIKE (p.idportador::text || ' - %')
            AND se.datalancamento > ${Prisma.raw(`'${fimStr}'`)}::date
        ), 0) AS changes_after_fim,
        -- Variação líquida dentro do período selecionado
        COALESCE((
          SELECT SUM(CASE WHEN se.tiposaldo = 'R' THEN se.valor
                          WHEN se.tiposaldo = 'P' THEN -se.valor
                          ELSE 0 END)
          FROM saldoextrato se
          WHERE se.descricao LIKE (p.idportador::text || ' - %')
            AND se.datalancamento >= ${Prisma.raw(`'${inicioStr}'`)}::date
            AND se.datalancamento <= ${Prisma.raw(`'${fimStr}'`)}::date
        ), 0) AS variacao_periodo
      FROM portador p
      JOIN saldoportador sp ON sp.id_portador = p.idportador
      JOIN membrofamilia m  ON m.idmembrofamilia = p.id_membrofamilia
      ORDER BY m.nome, p.nomeportador
    `);

    const result = rows.map((r) => {
      const saldoAtual = Number(r.saldo_atual);
      const changesAfterFim = Number(r.changes_after_fim);
      const variacaoPeriodo = Number(r.variacao_periodo);
      const saldoFim = saldoAtual - changesAfterFim;
      const saldoInicio = saldoFim - variacaoPeriodo;
      return {
        idportador: r.idportador,
        nomeportador: r.nomeportador,
        nomemembro: r.nomemembro,
        saldoInicio,
        saldoFim,
        variacao: variacaoPeriodo,
      };
    });

    return reply.send(result);
  });
}
