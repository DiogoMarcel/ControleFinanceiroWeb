import { prisma } from '../lib/prisma.js';

export interface DashboardData {
  // Resumo financeiro
  saldoTotal: number;
  saldoBancario: number;
  valorReservado: number;
  totalContasPagar: number;
  totalContasReceber: number;
  saldoFgts: number;
  saldoGeralComFgts: number;
  // Portadores individuais
  portadores: PortadorResumo[];
  // Gráfico: evolução do saldo total histórico
  evolucaoSaldo: EvolucaoMes[];
}

export interface PortadorResumo {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
  reservado: boolean;
  membroNome: string;
}

export interface EvolucaoMes {
  mes: string;
  saldoTotal: number;
}

interface EvolucaoRow {
  mes: string;
  saldototal: number | string;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [saldos, portadores, contas, fgts, evolucao] = await Promise.all([
    // Todos os saldos dos portadores
    prisma.saldoportador.findMany({ select: { valor: true, reservado: true } }),

    // Portadores com saldo e membro
    prisma.portador.findMany({
      include: { saldoportador: true, membrofamilia: true },
      orderBy: { nomeportador: 'asc' },
    }),

    // Totais de todas as contas ativas por tipo
    prisma.conta.groupBy({
      by: ['tipoconta'],
      _sum: { valor: true },
    }),

    // FGTS
    prisma.saldofgts.aggregate({ _sum: { saldo: true } }),

    // Evolução histórica do saldo total (último registro de cada mês)
    prisma.$queryRaw<EvolucaoRow[]>`
      SELECT mes, saldototal FROM (
        SELECT
          TO_CHAR(dataalteracao, 'YYYY-MM') AS mes,
          saldototal,
          ROW_NUMBER() OVER (
            PARTITION BY TO_CHAR(dataalteracao, 'YYYY-MM')
            ORDER BY idsaldodetalhadoportador DESC
          ) AS rn
        FROM saldodetalhadoportador
        WHERE dataalteracao IS NOT NULL
      ) t
      WHERE rn = 1
      ORDER BY mes ASC
    `,
  ]);

  const saldoTotal = saldos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const valorReservado = saldos
    .filter((p) => p.reservado === true)
    .reduce((s, p) => s + (p.valor ?? 0), 0);
  const saldoBancario = saldoTotal - valorReservado;

  const totalPagar = contas.find((c) => c.tipoconta === 'P')?._sum.valor ?? 0;
  const totalReceber = contas.find((c) => c.tipoconta === 'R')?._sum.valor ?? 0;
  const saldoFgts = fgts._sum.saldo ?? 0;

  return {
    saldoTotal,
    saldoBancario,
    valorReservado,
    totalContasPagar: totalPagar,
    totalContasReceber: totalReceber,
    saldoFgts,
    saldoGeralComFgts: saldoTotal + saldoFgts,
    portadores: portadores.map((p) => ({
      id: p.idportador,
      nome: p.nomeportador,
      tipo: p.tipoconta,
      saldo: p.saldoportador?.valor ?? 0,
      reservado: p.saldoportador?.reservado === true,
      membroNome: p.membrofamilia.nome,
    })),
    evolucaoSaldo: evolucao.map((r) => ({
      mes: r.mes,
      saldoTotal: Number(r.saldototal),
    })),
  };
}
