import { prisma } from '../lib/prisma.js';

export interface DashboardData {
  saldoTotal: number;
  totalPagar: number;
  totalReceber: number;
  saldoLiquido: number;
  portadores: PortadorResumo[];
  vencendo7dias: ContaAlerta[];
  emAtraso: ContaAlerta[];
  graficoMeses: GraficoMes[];
}

interface PortadorResumo {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
  membroNome: string;
}

interface ContaAlerta {
  id: number;
  descricao: string;
  valor: number;
  dataconta: Date | null;
}

interface GraficoMes {
  mes: string;
  pagar: number;
  receber: number;
}

interface GraficoRawRow {
  mes: string;
  pagar: number | string;
  receber: number | string;
}

export async function getDashboardData(mes: string): Promise<DashboardData> {
  const [year, month] = mes.split('-').map(Number);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  // Data de 6 meses atrás para o gráfico
  const startGrafico = new Date(year, month - 7, 1);

  const [saldos, portadores, pagamentosDoMes, recebimentosDoMes, emAtrasoRaw, graficoRaw] =
    await Promise.all([
      // Saldo total
      prisma.saldoportador.aggregate({ _sum: { valor: true } }),

      // Portadores com saldo e membro
      prisma.portador.findMany({
        include: { saldoportador: true, membrofamilia: true },
        orderBy: { nomeportador: 'asc' },
      }),

      // Contas a pagar do mês
      prisma.contapagamentos.findMany({
        where: {
          dataconta: { gte: startOfMonth, lte: endOfMonth },
          conta: { tipoconta: 'P' },
        },
        include: { conta: true },
      }),

      // Contas a receber do mês
      prisma.contapagamentos.findMany({
        where: {
          dataconta: { gte: startOfMonth, lte: endOfMonth },
          conta: { tipoconta: 'R' },
        },
        include: { conta: true },
      }),

      // Em atraso: meses anteriores, não pagos
      prisma.contapagamentos.findMany({
        where: {
          dataconta: { lt: startOfMonth },
          baixaefetuada: { not: true },
          conta: { tipoconta: 'P' },
        },
        include: { conta: true },
        orderBy: { dataconta: 'desc' },
        take: 20,
      }),

      // Gráfico últimos 6 meses (raw SQL para agregação eficiente)
      prisma.$queryRaw<GraficoRawRow[]>`
        SELECT
          TO_CHAR(cp.dataconta, 'YYYY-MM') AS mes,
          SUM(CASE WHEN c.tipoconta = 'P' THEN c.valor ELSE 0 END) AS pagar,
          SUM(CASE WHEN c.tipoconta = 'R' THEN c.valor ELSE 0 END) AS receber
        FROM contapagamentos cp
        JOIN conta c ON c.idconta = cp.id_conta
        WHERE cp.dataconta >= ${startGrafico}
          AND cp.dataconta <= ${endOfMonth}
        GROUP BY TO_CHAR(cp.dataconta, 'YYYY-MM')
        ORDER BY mes ASC
      `,
    ]);

  const totalPagar = pagamentosDoMes.reduce((s, p) => s + p.conta.valor, 0);
  const totalReceber = recebimentosDoMes.reduce((s, p) => s + p.conta.valor, 0);

  // Vencendo: mês atual não pagos
  const vencendo7dias: ContaAlerta[] = pagamentosDoMes
    .filter((p) => p.baixaefetuada !== true)
    .map((p) => ({
      id: p.idcontapagamentos,
      descricao: p.conta.descricao,
      valor: p.conta.valor,
      dataconta: p.dataconta,
    }));

  return {
    saldoTotal: saldos._sum.valor ?? 0,
    totalPagar,
    totalReceber,
    saldoLiquido: totalReceber - totalPagar,
    portadores: portadores.map((p) => ({
      id: p.idportador,
      nome: p.nomeportador,
      tipo: p.tipoconta,
      saldo: p.saldoportador?.valor ?? 0,
      membroNome: p.membrofamilia.nome,
    })),
    vencendo7dias,
    emAtraso: emAtrasoRaw.map((p) => ({
      id: p.idcontapagamentos,
      descricao: p.conta.descricao,
      valor: p.conta.valor,
      dataconta: p.dataconta,
    })),
    graficoMeses: graficoRaw.map((r) => ({
      mes: r.mes,
      pagar: Number(r.pagar),
      receber: Number(r.receber),
    })),
  };
}
