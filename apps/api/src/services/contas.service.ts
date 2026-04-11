import { prisma } from '../lib/prisma.js';

export interface ContaInput {
  descricao: string;
  valor: number;
  tipoconta: 'P' | 'R';
  id_membrofamilia?: number | null;
  id_credor?: number | null;
  contaanual?: boolean;
  pertenceafolha?: boolean;
  debitacartao?: boolean;
  debitoauto?: boolean;
  pagamentomanual?: boolean;
  qtdparcela?: number | null;
  diavencimento?: number | null;
  tags?: number[]; // IDs das tags
}

const contaInclude = {
  membrofamilia: { select: { idmembrofamilia: true, nome: true } },
  credor: { select: { idcredor: true, nome: true } },
  contatag: { include: { tags: { select: { idtags: true, descricao: true } } } },
} as const;

export function listContas(filters?: { tipoconta?: string; id_membrofamilia?: number }) {
  return prisma.conta.findMany({
    where: {
      ...(filters?.tipoconta && { tipoconta: filters.tipoconta }),
      ...(filters?.id_membrofamilia && { id_membrofamilia: filters.id_membrofamilia }),
    },
    include: contaInclude,
    orderBy: [{ tipoconta: 'asc' }, { descricao: 'asc' }],
  });
}

export function toggleMarcado(id: number, marcado: boolean) {
  return prisma.conta.update({
    where: { idconta: id },
    data: { marcado },
    select: { idconta: true, marcado: true },
  });
}

export function reiniciarMarcadas(tipoconta: 'P' | 'R') {
  return prisma.conta.updateMany({
    where: { tipoconta, marcado: true },
    data: { marcado: false },
  });
}

export function getConta(id: number) {
  return prisma.conta.findUnique({
    where: { idconta: id },
    include: {
      ...contaInclude,
      contapagamentos: { orderBy: { dataconta: 'desc' } },
    },
  });
}

export async function createConta(data: ContaInput) {
  const { tags, ...fields } = data;

  return prisma.conta.create({
    data: {
      descricao: fields.descricao,
      valor: fields.valor,
      tipoconta: fields.tipoconta,
      id_membrofamilia: fields.id_membrofamilia ?? null,
      id_credor: fields.id_credor ?? null,
      contaanual: fields.contaanual ?? false,
      pertenceafolha: fields.pertenceafolha ?? false,
      debitacartao: fields.debitacartao ?? false,
      debitoauto: fields.debitoauto ?? false,
      pagamentomanual: fields.pagamentomanual ?? false,
      qtdparcela: fields.qtdparcela ?? null,
      diavencimento: fields.diavencimento ?? null,
      ...(tags?.length && {
        contatag: { create: tags.map((id_tags) => ({ id_tags })) },
      }),
    },
    include: contaInclude,
  });
}

export async function updateConta(id: number, data: Partial<ContaInput>) {
  const { tags, ...fields } = data;

  // Atualiza tags: remove todas e recria (abordagem simples)
  if (tags !== undefined) {
    await prisma.contatag.deleteMany({ where: { id_conta: id } });
  }

  return prisma.conta.update({
    where: { idconta: id },
    data: {
      ...(fields.descricao !== undefined && { descricao: fields.descricao }),
      ...(fields.valor !== undefined && { valor: fields.valor }),
      ...(fields.tipoconta !== undefined && { tipoconta: fields.tipoconta }),
      ...(fields.id_membrofamilia !== undefined && { id_membrofamilia: fields.id_membrofamilia }),
      ...(fields.id_credor !== undefined && { id_credor: fields.id_credor }),
      ...(fields.contaanual !== undefined && { contaanual: fields.contaanual }),
      ...(fields.pertenceafolha !== undefined && { pertenceafolha: fields.pertenceafolha }),
      ...(fields.debitacartao !== undefined && { debitacartao: fields.debitacartao }),
      ...(fields.debitoauto !== undefined && { debitoauto: fields.debitoauto }),
      ...(fields.pagamentomanual !== undefined && { pagamentomanual: fields.pagamentomanual }),
      ...(fields.qtdparcela !== undefined && { qtdparcela: fields.qtdparcela }),
      ...(fields.diavencimento !== undefined && { diavencimento: fields.diavencimento }),
      ...(tags?.length && {
        contatag: { create: tags.map((id_tags) => ({ id_tags })) },
      }),
    },
    include: contaInclude,
  });
}

export async function deleteConta(id: number) {
  // Verifica se há pagamentos efetuados
  const pago = await prisma.contapagamentos.findFirst({
    where: { id_conta: id, baixaefetuada: true },
  });
  if (pago) throw new Error('Conta possui pagamentos efetuados e não pode ser excluída.');

  // Deleta dependentes antes (FK)
  await prisma.contatag.deleteMany({ where: { id_conta: id } });
  await prisma.contapagamentos.deleteMany({ where: { id_conta: id } });
  return prisma.conta.delete({ where: { idconta: id } });
}

// Relatório de impressão — contas a pagar ordenadas por dia de vencimento
export function relatorioContasPagar() {
  return prisma.conta.findMany({
    where: { tipoconta: 'P' },
    include: {
      membrofamilia: { select: { idmembrofamilia: true, nome: true } },
      credor: { select: { idcredor: true, nome: true } },
    },
    orderBy: [
      // nulos por último, depois ordena pelo dia
      { diavencimento: { sort: 'asc', nulls: 'last' } },
      { descricao: 'asc' },
    ],
  });
}

// Tags vinculadas
export function addTagConta(contaId: number, tagId: number) {
  return prisma.contatag.create({ data: { id_conta: contaId, id_tags: tagId } });
}

export function removeTagConta(contaId: number, tagId: number) {
  return prisma.contatag.deleteMany({ where: { id_conta: contaId, id_tags: tagId } });
}
