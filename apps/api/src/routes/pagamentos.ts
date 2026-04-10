import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authMiddleware } from '../middlewares/auth.js';
import {
  listPagamentos,
  baixarPagamento,
  desfazerBaixa,
  gerarMes,
  type StatusPagamento,
} from '../services/pagamentos.service.js';

type IdParam = { Params: { id: string } };

function isAdmin(req: FastifyRequest, reply: { code: (n: number) => { send: (o: object) => void } }) {
  if (req.user.role !== 'admin') {
    reply.code(403).send({ error: 'Acesso negado' });
    return false;
  }
  return true;
}

function handleError(err: unknown, reply: { code: (n: number) => { send: (o: object) => void } }) {
  const message = err instanceof Error ? err.message : 'Erro interno';
  reply.code(422).send({ error: message });
}

export async function pagamentosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /contapagamentos?mes=2026-04&tipoconta=P&id_membrofamilia=1&status=vencido
  app.get('/contapagamentos', async (req, reply) => {
    const { mes, tipoconta, id_membrofamilia, status } = req.query as Record<string, string>;

    // Default: mês atual
    const mesParam = mes ?? new Date().toISOString().slice(0, 7);

    const pagamentos = await listPagamentos(mesParam, {
      tipoconta,
      id_membrofamilia: id_membrofamilia ? Number(id_membrofamilia) : undefined,
      status: status as StatusPagamento | undefined,
    });

    return reply.send(pagamentos);
  });

  // PATCH /contapagamentos/:id/baixa — admin
  // Body opcional: { dataBaixa: "2026-04-10" }
  app.patch<IdParam>('/contapagamentos/:id/baixa', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      const body = req.body as { dataBaixa?: string } | undefined;
      const dataBaixa = body?.dataBaixa ? new Date(body.dataBaixa) : undefined;
      const result = await baixarPagamento(Number(req.params.id), dataBaixa);
      return reply.send(result);
    } catch (err) { handleError(err, reply); }
  });

  // PATCH /contapagamentos/:id/desfazer-baixa — admin
  app.patch<IdParam>('/contapagamentos/:id/desfazer-baixa', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      const result = await desfazerBaixa(Number(req.params.id));
      return reply.send(result);
    } catch (err) { handleError(err, reply); }
  });

  // POST /contapagamentos/gerar-mes — admin
  // Body: { mes: "2026-04" }
  app.post('/contapagamentos/gerar-mes', async (req, reply) => {
    if (!isAdmin(req, reply)) return;
    try {
      const { mes } = req.body as { mes: string };
      if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        return reply.code(400).send({ error: 'Informe o mês no formato YYYY-MM' });
      }
      const resultado = await gerarMes(mes);
      return reply.code(201).send(resultado);
    } catch (err) { handleError(err, reply); }
  });
}
