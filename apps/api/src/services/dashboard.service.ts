import { prisma } from '../lib/prisma.js';

export interface ContaVencendo {
  id: number;
  descricao: string;
  valor: number;
  diavencimento: number;
  diasAteVencimento: number; // negative = overdue, 0 = today, positive = upcoming
  credorNome: string | null;
  membroNome: string | null;
}

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
  // Alertas: contas vencidas ou vencendo nos próximos 7 dias
  contasVencendo: ContaVencendo[];
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
  const hojeBase = new Date();
  hojeBase.setHours(0, 0, 0, 0);
  const diaHoje = hojeBase.getDate();

  // Window of the next 7 days (including today), computing the calendar day for each
  const janelaFutura = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(hojeBase);
    d.setDate(diaHoje + i);
    return { data: d, dia: d.getDate() };
  });

  const [portadores, contas, fgts, evolucao, ultimoDetalhado, contasAlerta] = await Promise.all([
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

    // Contas a pagar não marcadas com diavencimento definido (para alertas)
    prisma.conta.findMany({
      where: {
        tipoconta: 'P',
        marcado: false,
        OR: [{ debitacartao: false }, { debitacartao: null }],
        diavencimento: { not: null },
      },
      select: {
        idconta: true,
        descricao: true,
        valor: true,
        diavencimento: true,
        credor: { select: { nome: true } },
        membrofamilia: { select: { nome: true } },
      },
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

  const contasVencendo: ContaVencendo[] = contasAlerta
    .flatMap((c) => {
      const dia = c.diavencimento!;
      const upcoming = janelaFutura.find((j) => j.dia === dia);
      if (upcoming) {
        return [{
          id: c.idconta,
          descricao: c.descricao,
          valor: c.valor,
          diavencimento: dia,
          diasAteVencimento: Math.round((upcoming.data.getTime() - hojeBase.getTime()) / 86400000),
          credorNome: c.credor?.nome ?? null,
          membroNome: c.membrofamilia?.nome ?? null,
        }];
      }
      if (dia < diaHoje) {
        return [{
          id: c.idconta,
          descricao: c.descricao,
          valor: c.valor,
          diavencimento: dia,
          diasAteVencimento: dia - diaHoje,
          credorNome: c.credor?.nome ?? null,
          membroNome: c.membrofamilia?.nome ?? null,
        }];
      }
      return [];
    })
    .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento);

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
    contasVencendo,
  };
}
