import { prisma } from '../lib/prisma.js';

// ── Membros ────────────────────────────────────────────────────────────────

export function listMembros() {
  return prisma.membrofamilia.findMany({ orderBy: { nome: 'asc' } });
}

export function getMembro(id: number) {
  return prisma.membrofamilia.findUnique({ where: { idmembrofamilia: id } });
}

export function createMembro(nome: string) {
  return prisma.membrofamilia.create({ data: { nome } });
}

export function updateMembro(id: number, nome: string) {
  return prisma.membrofamilia.update({ where: { idmembrofamilia: id }, data: { nome } });
}

export async function deleteMembro(id: number) {
  const vinculado = await prisma.portador.findFirst({ where: { id_membrofamilia: id } });
  if (vinculado) throw new Error('Membro possui portadores vinculados e não pode ser excluído.');
  return prisma.membrofamilia.delete({ where: { idmembrofamilia: id } });
}

// ── Credores ───────────────────────────────────────────────────────────────

export function listCredores() {
  return prisma.credor.findMany({ orderBy: { nome: 'asc' } });
}

export function getCredor(id: number) {
  return prisma.credor.findUnique({ where: { idcredor: id } });
}

export function createCredor(nome: string) {
  return prisma.credor.create({ data: { nome } });
}

export function updateCredor(id: number, nome: string) {
  return prisma.credor.update({ where: { idcredor: id }, data: { nome } });
}

export async function deleteCredor(id: number) {
  const vinculado = await prisma.conta.findFirst({ where: { id_credor: id } });
  if (vinculado) throw new Error('Credor possui contas vinculadas e não pode ser excluído.');
  return prisma.credor.delete({ where: { idcredor: id } });
}

// ── Tags ───────────────────────────────────────────────────────────────────

export function listTags() {
  return prisma.tags.findMany({ orderBy: { descricao: 'asc' } });
}

export function getTag(id: number) {
  return prisma.tags.findUnique({ where: { idtags: id } });
}

export function createTag(descricao: string) {
  return prisma.tags.create({ data: { descricao } });
}

export function updateTag(id: number, descricao: string) {
  return prisma.tags.update({ where: { idtags: id }, data: { descricao } });
}

export async function deleteTag(id: number) {
  const vinculada = await prisma.contatag.findFirst({ where: { id_tags: id } });
  if (vinculada) throw new Error('Tag está em uso em contas e não pode ser excluída.');
  return prisma.tags.delete({ where: { idtags: id } });
}
