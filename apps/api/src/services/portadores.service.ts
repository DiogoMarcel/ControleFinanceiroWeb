import { prisma } from '../lib/prisma.js';

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
  return prisma.portador.create({
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
          valor: data.valor ?? 0,
          reservado: data.reservado ?? false,
          contacapital: data.contacapital ?? false,
          datainclusao: new Date(),
        },
      },
    },
    include: { saldoportador: true, membrofamilia: true },
  });
}

export async function updatePortador(id: number, data: Partial<PortadorInput>) {
  // Atualiza portador e saldo em paralelo
  const updates: Promise<unknown>[] = [
    prisma.portador.update({
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
    }),
  ];

  if (
    data.valor !== undefined ||
    data.reservado !== undefined ||
    data.contacapital !== undefined
  ) {
    updates.push(
      prisma.saldoportador.update({
        where: { id_portador: id },
        data: {
          ...(data.valor !== undefined && { valor: data.valor }),
          ...(data.reservado !== undefined && { reservado: data.reservado }),
          ...(data.contacapital !== undefined && { contacapital: data.contacapital }),
        },
      }),
    );
  }

  await Promise.all(updates);

  return getPortador(id);
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
