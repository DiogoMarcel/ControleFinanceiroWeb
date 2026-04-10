import { prisma } from '../lib/prisma.js';

export interface DashboardData {
  // Resumo financeiro
  saldoTotal: number;
  saldoBancario: number;
  valorReservado: number;
  totalContasPagar: number;
  totalContasReceber: number;
  saldoLiquido: number;
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
  contaCapital: boolean;
  membroId: number;
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
  const [portadores, contas, fgts, evolucao, ultimoDetalhado] = await Promise.all([
    // Portadores com saldo e membro
    prisma.portador.findMany({
      include: { saldoportador: true, membrofamilia: true },
      orderBy: { nomeportador: 'asc' },
    }),

    // Totais de contas por tipo — excluindo contas que debitam em cartão
    // (já contabilizadas na fatura do cartão, para evitar dupla contagem)
    prisma.conta.groupBy({
      by: ['tipoconta'],
      where: { OR: [{ debitacartao: false }, { debitacartao: null }] },
      _sum: { valor: true },
    }),

    // FGTS
    prisma.saldofgts.aggregate({ _sum: { saldo: true } }),

    // Evolução histórica do saldo total (último registro NÃO-NULO de cada mês)
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
          AND saldototal IS NOT NULL
      ) t
      WHERE rn = 1
      ORDER BY mes ASC
    `,

    // Saldo total canônico: último registro NÃO-NULO do histórico detalhado
    // (mantido por triggers; registros com saldototal=null são parciais/em-progresso)
    prisma.saldodetalhadoportador.findFirst({
      where: { saldototal: { not: null } },
      orderBy: { idsaldodetalhadoportador: 'desc' },
      select: { saldototal: true },
    }),
  ]);

  // Todos os saldos não-nulos
  const todosSaldos = portadores
    .map((p) => p.saldoportador)
    .filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined);

  // Saldo Total = valor canônico do trigger (exclui contacapital por design do trigger)
  // Fallback: soma ao vivo excluindo contacapital (s.contacapital !== true cobre null e false)
  const saldoTotalFallback = todosSaldos
    .filter((s) => s.contacapital !== true)
    .reduce((sum, s) => sum + (s.valor ?? 0), 0);
  const saldoTotal = ultimoDetalhado?.saldototal != null
    ? Number(ultimoDetalhado.saldototal)
    : saldoTotalFallback;

  // Portadores operacionais: não-capital (contacapital !== true cobre null e false)
  const saldosOperacionais = todosSaldos.filter((s) => s.contacapital !== true);

  // Valor reservado: portadores operacionais marcados como reservado
  const valorReservado = saldosOperacionais
    .filter((s) => s.reservado === true)
    .reduce((sum, s) => sum + (s.valor ?? 0), 0);

  // Saldo Bancário: portadores operacionais NÃO reservados (ao vivo, mesma fonte)
  const saldoBancario = saldosOperacionais
    .filter((s) => s.reservado !== true)
    .reduce((sum, s) => sum + (s.valor ?? 0), 0);

  const totalPagar = contas.find((c) => c.tipoconta === 'P')?._sum.valor ?? 0;
  const totalReceber = contas.find((c) => c.tipoconta === 'R')?._sum.valor ?? 0;
  const saldoFgts = fgts._sum.saldo ?? 0;

  return {
    saldoTotal,
    saldoBancario,
    valorReservado,
    totalContasPagar: totalPagar,
    totalContasReceber: totalReceber,
    saldoLiquido: totalReceber - totalPagar,
    saldoFgts,
    saldoGeralComFgts: saldoTotal + saldoFgts,
    portadores: portadores.map((p) => ({
      id: p.idportador,
      nome: p.nomeportador,
      tipo: p.tipoconta,
      saldo: p.saldoportador?.valor ?? 0,
      reservado: p.saldoportador?.reservado === true,
      contaCapital: p.saldoportador?.contacapital === true,
      membroId: p.id_membrofamilia,
      membroNome: p.membrofamilia.nome,
    })),
    evolucaoSaldo: evolucao.map((r) => ({
      mes: r.mes,
      saldoTotal: Number(r.saldototal),
    })),
  };
}
