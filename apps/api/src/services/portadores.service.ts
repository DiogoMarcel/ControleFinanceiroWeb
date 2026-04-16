import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';

export interface PortadorInput {
  nomeportador: string;
  tipoconta: string;
  id_membrofamilia: number;
  agencia?: string | null;
  numeroconta?: string | null;
  digitoconta?: string | null;
  imgportador?: number | null;
  // saldo
  valor?: number;
  reservado?: boolean;
  contacapital?: boolean;
}

// Insere no saldoextrato após criar/alterar saldoportador.
// Para novos portadores (INSERT), oldValor deve ser 0.
// Para atualizações (UPDATE), oldValor é o valor anterior.
async function registrarExtratoSaldoPortador(
  tx: Prisma.TransactionClient,
  novoValor: number,
  oldValor: number,
  descricao: string,
): Promise<void> {
  const diferenca = novoValor - oldValor;

  let tiposaldo: string;
  let valorAbsoluto: number;

  if (diferenca > 0) {
    tiposaldo = 'R';
    valorAbsoluto = diferenca;
  } else if (diferenca < 0) {
    tiposaldo = 'P';
    valorAbsoluto = Math.abs(diferenca);
  } else {
    tiposaldo = '=';
    valorAbsoluto = 0;
  }

  const lastEntry = await tx.saldoextrato.findFirst({
    orderBy: { idsaldoextrato: 'desc' },
    select: { saldo: true },
  });
  const novoSaldo = (lastEntry?.saldo ?? 0) + diferenca;

  await tx.saldoextrato.create({
    data: {
      tiposaldo,
      valor: valorAbsoluto,
      saldo: novoSaldo,
      descricao: descricao.substring(0, 50),
    },
  });
}

export async function listPortadores() {
  return prisma.portador.findMany({
    include: { saldoportador: true, membrofamilia: true },
    orderBy: [{ membrofamilia: { nome: 'asc' } }, { nomeportador: 'asc' }],
  });
}

export async function getPortador(id: number) {
  return prisma.portador.findUnique({
    where: { idportador: id },
    include: { saldoportador: true, membrofamilia: true },
  });
}

export async function createPortador(data: PortadorInput) {
  const novoValor = data.valor ?? 0;

  return prisma.$transaction(async (tx) => {
    const portador = await tx.portador.create({
      data: {
        nomeportador: data.nomeportador,
        tipoconta: data.tipoconta,
        id_membrofamilia: data.id_membrofamilia,
        agencia: data.agencia ?? null,
        numeroconta: data.numeroconta ?? null,
        digitoconta: data.digitoconta ?? null,
        imgportador: data.imgportador ?? null,
        saldoportador: {
          create: {
            valor: novoValor,
            reservado: data.reservado ?? false,
            contacapital: data.contacapital ?? false,
            datainclusao: new Date(),
          },
        },
      },
      include: { saldoportador: true, membrofamilia: true },
    });

    // Novo portador: oldValor = 0 (correção do bug do Delphi que ignorava novos portadores)
    const descricao = `${portador.idportador} - ${portador.nomeportador}`;
    await registrarExtratoSaldoPortador(tx, novoValor, 0, descricao);

    return portador;
  });
}

export async function updatePortador(id: number, data: Partial<PortadorInput>) {
  const atualizandoValor = data.valor !== undefined;

  return prisma.$transaction(async (tx) => {
    // Busca o valor atual antes de atualizar, apenas se o valor será alterado
    let oldValor = 0;
    if (atualizandoValor) {
      const saldoAtual = await tx.saldoportador.findUnique({
        where: { id_portador: id },
        select: { valor: true },
      });
      oldValor = saldoAtual?.valor ?? 0;
    }

    await tx.portador.update({
      where: { idportador: id },
      data: {
        nomeportador: data.nomeportador,
        tipoconta: data.tipoconta,
        id_membrofamilia: data.id_membrofamilia,
        agencia: data.agencia,
        numeroconta: data.numeroconta,
        digitoconta: data.digitoconta,
        imgportador: data.imgportador,
      },
    });

    if (
      data.valor !== undefined ||
      data.reservado !== undefined ||
      data.contacapital !== undefined
    ) {
      await tx.saldoportador.update({
        where: { id_portador: id },
        data: {
          ...(data.valor !== undefined && { valor: data.valor }),
          ...(data.reservado !== undefined && { reservado: data.reservado }),
          ...(data.contacapital !== undefined && { contacapital: data.contacapital }),
        },
      });
    }

    // Só registra no extrato se o valor efetivamente mudou
    if (atualizandoValor && data.valor !== oldValor) {
      const portador = await tx.portador.findUnique({
        where: { idportador: id },
        select: { nomeportador: true },
      });
      const descricao = `${id} - ${portador?.nomeportador ?? ''}`;
      await registrarExtratoSaldoPortador(tx, data.valor!, oldValor, descricao);
    }

    return tx.portador.findUnique({
      where: { idportador: id },
      include: { saldoportador: true, membrofamilia: true },
    });
  });
}

export async function deletePortador(id: number) {
  const saldo = await prisma.saldoportador.findUnique({ where: { id_portador: id } });
  if (saldo && (saldo.valor ?? 0) !== 0) {
    throw new Error('Não é possível excluir portador com saldo diferente de zero.');
  }
  // Deleta saldo antes (FK)
  await prisma.saldoportador.deleteMany({ where: { id_portador: id } });
  return prisma.portador.delete({ where: { idportador: id } });
}

export async function listMembros() {
  return prisma.membrofamilia.findMany({ orderBy: { nome: 'asc' } });
}
