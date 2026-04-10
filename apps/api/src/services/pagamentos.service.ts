import { prisma } from '../lib/prisma.js';
import { startOfDay } from './pagamentos.utils.js';

export type StatusPagamento = 'pago' | 'vencido' | 'vencendo' | 'pendente';

export interface PagamentoComStatus {
  idcontapagamentos: number;
  dataconta: Date | null;
  databaixa: Date | null;
  baixaefetuada: boolean | null;
  status: StatusPagamento;
  id_conta: number;
  conta: {
    idconta: number;
    descricao: string;
    valor: number;
    tipoconta: string;
    debitacartao: boolean | null;
    debitoauto: boolean | null;
    pagamentomanual: boolean | null;
    pertenceafolha: boolean | null;
    contaanual: boolean | null;
    membrofamilia: { idmembrofamilia: number; nome: string } | null;
    credor: { idcredor: number; nome: string } | null;
  };
}

function calcularStatus(p: { baixaefetuada: boolean | null; dataconta: Date | null }): StatusPagamento {
  if (p.baixaefetuada === true) return 'pago';
  if (!p.dataconta) return 'pendente';

  const hoje = startOfDay(new Date());
  const venc = startOfDay(p.dataconta);
  const diff = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'vencido';
  if (diff <= 7) return 'vencendo';
  return 'pendente';
}

export async function listPagamentos(mes: string, filters?: {
  tipoconta?: string;
  id_membrofamilia?: number;
  status?: StatusPagamento;
}): Promise<PagamentoComStatus[]> {
  const [ano, mesNum] = mes.split('-').map(Number);
  const inicio = new Date(ano, mesNum - 1, 1);
  const fim = new Date(ano, mesNum, 0); // último dia do mês

  const pagamentos = await prisma.contapagamentos.findMany({
    where: {
      dataconta: { gte: inicio, lte: fim },
      conta: {
        ...(filters?.tipoconta && { tipoconta: filters.tipoconta }),
        ...(filters?.id_membrofamilia && { id_membrofamilia: filters.id_membrofamilia }),
      },
    },
    include: {
      conta: {
        include: {
          membrofamilia: { select: { idmembrofamilia: true, nome: true } },
          credor: { select: { idcredor: true, nome: true } },
        },
      },
    },
    orderBy: { dataconta: 'asc' },
  });

  const result: PagamentoComStatus[] = pagamentos.map((p) => ({
    ...p,
    status: calcularStatus(p),
  }));

  if (filters?.status) {
    return result.filter((p) => p.status === filters.status);
  }

  return result;
}

export async function baixarPagamento(id: number, dataBaixa?: Date) {
  const pagamento = await prisma.contapagamentos.findUnique({ where: { idcontapagamentos: id } });
  if (!pagamento) throw new Error('Pagamento não encontrado.');
  if (pagamento.baixaefetuada) throw new Error('Pagamento já foi baixado.');

  return prisma.contapagamentos.update({
    where: { idcontapagamentos: id },
    data: {
      baixaefetuada: true,
      databaixa: dataBaixa ?? new Date(),
    },
    include: {
      conta: { include: { membrofamilia: { select: { idmembrofamilia: true, nome: true } } } },
    },
  });
}

export async function desfazerBaixa(id: number) {
  const pagamento = await prisma.contapagamentos.findUnique({ where: { idcontapagamentos: id } });
  if (!pagamento) throw new Error('Pagamento não encontrado.');
  if (!pagamento.baixaefetuada) throw new Error('Este pagamento não está baixado.');

  return prisma.contapagamentos.update({
    where: { idcontapagamentos: id },
    data: { baixaefetuada: false, databaixa: null },
    include: {
      conta: { include: { membrofamilia: { select: { idmembrofamilia: true, nome: true } } } },
    },
  });
}

export async function gerarMes(mes: string): Promise<{ criados: number; jaExistiam: number }> {
  const [ano, mesNum] = mes.split('-').map(Number);

  // Busca todas as contas ativas
  const contas = await prisma.conta.findMany();

  let criados = 0;
  let jaExistiam = 0;

  for (const conta of contas) {
    // Determina o dia de vencimento: usa último pagamento da conta como referência
    const ultimoPagamento = await prisma.contapagamentos.findFirst({
      where: { id_conta: conta.idconta },
      orderBy: { dataconta: 'desc' },
    });

    const dia = ultimoPagamento?.dataconta
      ? ultimoPagamento.dataconta.getDate()
      : 1; // fallback: dia 1

    const dataconta = new Date(ano, mesNum - 1, dia);

    // Verifica se já existe para esse mês
    const jaExiste = await prisma.contapagamentos.findFirst({
      where: {
        id_conta: conta.idconta,
        dataconta: {
          gte: new Date(ano, mesNum - 1, 1),
          lte: new Date(ano, mesNum, 0),
        },
      },
    });

    if (jaExiste) {
      jaExistiam++;
      continue;
    }

    await prisma.contapagamentos.create({
      data: { id_conta: conta.idconta, dataconta, baixaefetuada: false },
    });
    criados++;
  }

  return { criados, jaExistiam };
}
