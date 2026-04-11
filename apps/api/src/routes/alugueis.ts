import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export async function alugueisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /alugueis?ano=2025
  app.get('/alugueis', async (req, reply) => {
    const { ano } = req.query as { ano?: string };

    const where = ano
      ? {
          dataaluguel: {
            gte: new Date(`${ano}-01-01`),
            lte: new Date(`${ano}-12-31`),
          },
        }
      : undefined;

    const alugueis = await prisma.aluguel.findMany({
      where,
      include: {
        aluguelconta: { orderBy: { idaluguelconta: 'asc' } },
        aluguelcomp: { orderBy: { datapagamento: 'asc' } },
      },
      orderBy: { dataaluguel: 'desc' },
    });

    return reply.send(alugueis);
  });

  // GET /alugueis/ultimo — valor do último lançamento (qualquer ano)
  app.get('/alugueis/ultimo', async (_req, reply) => {
    const ultimo = await prisma.aluguel.findFirst({
      orderBy: { dataaluguel: 'desc' },
      select: { valoraluguel: true, dataaluguel: true },
    });
    return reply.send(ultimo ?? null);
  });

  // POST /alugueis — cria mês e aplica itens do template automaticamente
  app.post('/alugueis', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { dataaluguel, valoraluguel } = req.body as {
      dataaluguel: string;
      valoraluguel?: number;
    };
    const aluguel = await prisma.aluguel.create({
      data: {
        dataaluguel: new Date(dataaluguel),
        valoraluguel: valoraluguel ?? null,
        datapagamento: null,
      },
    });

    // Aplicar itens do template automaticamente
    const template = await prisma.alugueltemplate.findMany({ orderBy: { ordem: 'asc' } });
    if (template.length > 0) {
      await prisma.aluguelconta.createMany({
        data: template.map(t => ({
          id_aluguel: aluguel.idaluguel,
          tipoconta: t.tipoconta,
          valor: t.valor,
          descricao: t.descricao,
          compartilhado: t.compartilhado,
        })),
      });
    }

    const result = await prisma.aluguel.findUnique({
      where: { idaluguel: aluguel.idaluguel },
      include: { aluguelconta: { orderBy: { idaluguelconta: 'asc' } }, aluguelcomp: true },
    });
    return reply.code(201).send(result);
  });

  // PUT /alugueis/:id — atualiza dados gerais
  app.put<{ Params: { id: string } }>('/alugueis/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { dataaluguel, valoraluguel, datapagamento } = req.body as {
      dataaluguel?: string;
      valoraluguel?: number | null;
      datapagamento?: string | null;
    };
    const aluguel = await prisma.aluguel.update({
      where: { idaluguel: Number(req.params.id) },
      data: {
        ...(dataaluguel ? { dataaluguel: new Date(dataaluguel) } : {}),
        ...(valoraluguel !== undefined ? { valoraluguel } : {}),
        datapagamento: datapagamento ? new Date(datapagamento) : null,
      },
      include: { aluguelconta: true, aluguelcomp: true },
    });
    return reply.send(aluguel);
  });

  // PATCH /alugueis/:id/comp — marcar/desmarcar pagamento compartilhado
  app.patch<{ Params: { id: string } }>('/alugueis/:id/comp', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const id = Number(req.params.id);
    const { datapagamento } = req.body as { datapagamento: string | null };

    if (!datapagamento) {
      // desmarcar: remove todos os aluguelcomp deste aluguel
      await prisma.aluguelcomp.deleteMany({ where: { id_aluguel: id } });
    } else {
      const existe = await prisma.aluguelcomp.findFirst({ where: { id_aluguel: id } });
      if (existe) {
        await prisma.aluguelcomp.update({
          where: { idaluguelcomp: existe.idaluguelcomp },
          data: { datapagamento: new Date(datapagamento) },
        });
      } else {
        await prisma.aluguelcomp.create({
          data: { id_aluguel: id, datapagamento: new Date(datapagamento) },
        });
      }
    }

    const aluguel = await prisma.aluguel.findUnique({
      where: { idaluguel: id },
      include: { aluguelconta: true, aluguelcomp: true },
    });
    return reply.send(aluguel);
  });

  // DELETE /alugueis/:id
  app.delete<{ Params: { id: string } }>('/alugueis/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const id = Number(req.params.id);
    // aluguelcomp tem onDelete: NoAction — remover manualmente
    await prisma.aluguelcomp.deleteMany({ where: { id_aluguel: id } });
    await prisma.aluguel.delete({ where: { idaluguel: id } });
    return reply.code(204).send();
  });

  // GET /alugueis/:id/contas
  app.get<{ Params: { id: string } }>('/alugueis/:id/contas', async (req, reply) => {
    const contas = await prisma.aluguelconta.findMany({
      where: { id_aluguel: Number(req.params.id) },
      orderBy: { idaluguelconta: 'asc' },
    });
    return reply.send(contas);
  });

  // POST /alugueis/:id/contas
  app.post<{ Params: { id: string } }>('/alugueis/:id/contas', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { tipoconta, valor, descricao, compartilhado } = req.body as {
      tipoconta: string;
      valor: number;
      descricao: string;
      compartilhado?: string;
    };
    const conta = await prisma.aluguelconta.create({
      data: {
        id_aluguel: Number(req.params.id),
        tipoconta,
        valor,
        descricao,
        compartilhado: compartilhado ?? 'N',
      },
    });
    return reply.code(201).send(conta);
  });

  // PUT /alugueis/:id/contas/:idConta
  app.put<{ Params: { id: string; idConta: string } }>(
    '/alugueis/:id/contas/:idConta',
    async (req, reply) => {
      if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
      const { tipoconta, valor, descricao, compartilhado } = req.body as {
        tipoconta?: string;
        valor?: number;
        descricao?: string;
        compartilhado?: string;
      };
      const conta = await prisma.aluguelconta.update({
        where: { idaluguelconta: Number(req.params.idConta) },
        data: { tipoconta, valor, descricao, compartilhado },
      });
      return reply.send(conta);
    },
  );

  // DELETE /alugueis/:id/contas/:idConta
  app.delete<{ Params: { id: string; idConta: string } }>(
    '/alugueis/:id/contas/:idConta',
    async (req, reply) => {
      if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
      await prisma.aluguelconta.delete({
        where: { idaluguelconta: Number(req.params.idConta) },
      });
      return reply.code(204).send();
    },
  );

  // ── Template de itens padrão ─────────────────────────────────────────────

  // GET /alugueis/template
  app.get('/alugueis/template', async (_req, reply) => {
    const items = await prisma.alugueltemplate.findMany({ orderBy: { ordem: 'asc' } });
    return reply.send(items);
  });

  // POST /alugueis/template
  app.post('/alugueis/template', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { tipoconta, valor, descricao, compartilhado, ordem } = req.body as {
      tipoconta: string; valor: number; descricao: string; compartilhado: string; ordem?: number;
    };
    const item = await prisma.alugueltemplate.create({
      data: { tipoconta, valor, descricao, compartilhado, ordem: ordem ?? 0 },
    });
    return reply.code(201).send(item);
  });

  // PUT /alugueis/template/:id
  app.put<{ Params: { id: string } }>('/alugueis/template/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    const { tipoconta, valor, descricao, compartilhado, ordem } = req.body as {
      tipoconta?: string; valor?: number; descricao?: string; compartilhado?: string; ordem?: number;
    };
    const item = await prisma.alugueltemplate.update({
      where: { idtemplate: Number(req.params.id) },
      data: { tipoconta, valor, descricao, compartilhado, ordem },
    });
    return reply.send(item);
  });

  // DELETE /alugueis/template/:id
  app.delete<{ Params: { id: string } }>('/alugueis/template/:id', async (req, reply) => {
    if (req.user.role !== 'admin') return reply.code(403).send({ error: 'Acesso negado' });
    await prisma.alugueltemplate.delete({ where: { idtemplate: Number(req.params.id) } });
    return reply.code(204).send();
  });
}
