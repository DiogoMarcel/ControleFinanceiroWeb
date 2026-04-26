import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { FastifyInstance } from 'fastify';

const mockListPortadores = jest.fn();
const mockGetPortador = jest.fn();
const mockCreatePortador = jest.fn();
const mockUpdatePortador = jest.fn();
const mockDeletePortador = jest.fn();

jest.unstable_mockModule('../../services/portadores.service.js', () => ({
  listPortadores: mockListPortadores,
  getPortador: mockGetPortador,
  createPortador: mockCreatePortador,
  updatePortador: mockUpdatePortador,
  deletePortador: mockDeletePortador,
}));

jest.unstable_mockModule('../../services/dashboard.service.js', () => ({ getDashboardData: jest.fn() }));
jest.unstable_mockModule('../../services/contas.service.js', () => ({
  listContas: jest.fn(), getConta: jest.fn(), createConta: jest.fn(), updateConta: jest.fn(),
  deleteConta: jest.fn(), addTagConta: jest.fn(), removeTagConta: jest.fn(),
  toggleMarcado: jest.fn(), reiniciarMarcadas: jest.fn(), relatorioContasPagar: jest.fn(),
}));
jest.unstable_mockModule('../../services/pagamentos.service.js', () => ({
  listPagamentos: jest.fn(), baixarPagamento: jest.fn(), desfazerBaixa: jest.fn(), gerarMes: jest.fn(),
}));
jest.unstable_mockModule('../../services/config.service.js', () => ({
  listMembros: jest.fn(), createMembro: jest.fn(), updateMembro: jest.fn(), deleteMembro: jest.fn(),
  getMembro: jest.fn(), listCredores: jest.fn(), createCredor: jest.fn(), updateCredor: jest.fn(),
  deleteCredor: jest.fn(), getCredor: jest.fn(), listTags: jest.fn(), createTag: jest.fn(),
  updateTag: jest.fn(), deleteTag: jest.fn(), getTag: jest.fn(),
}));
jest.unstable_mockModule('../../lib/prisma.js', () => ({
  prisma: {
    saldoextrato: { findMany: jest.fn() },
    veiculos: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    abastecimentos: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    fgts: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    aluguel: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    aluguelconta: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    aluguelcomp: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    alugueltemplate: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    contapagamentos: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));

const { buildApp, TEST_TOKEN } = await import('../helpers/buildApp.js');
const { mockVerifyIdToken } = await import('../__mocks__/firebase-admin-auth.js');

const MOCK_PORTADOR = {
  idportador: 1,
  nomeportador: 'Sicredi',
  tipoconta: 'C',
  agencia: '0740',
  numeroconta: '36278-6',
  digitoconta: null,
  imgportador: null,
  id_membrofamilia: 1,
  membrofamilia: { idmembrofamilia: 1, nome: 'Diogo Marcel' },
  saldoportador: { idsaldoportador: 5, valor: 28.36, reservado: false, contacapital: false },
};

describe('Portadores', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue({
      uid: 'test-uid', email: 'admin@test.com', name: 'Test Admin', role: 'admin',
    });
  });

  describe('GET /api/v1/portadores', () => {
    it('retorna 401 sem token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/portadores' });
      expect(res.statusCode).toBe(401);
    });

    it('lista portadores com sucesso', async () => {
      mockListPortadores.mockResolvedValue([MOCK_PORTADOR]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/portadores',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].idportador).toBe(1);
      expect(body[0].nomeportador).toBe('Sicredi');
    });
  });

  describe('GET /api/v1/portadores/:id', () => {
    it('retorna portador existente', async () => {
      mockGetPortador.mockResolvedValue(MOCK_PORTADOR);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/portadores/1',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().nomeportador).toBe('Sicredi');
    });

    it('retorna 404 para portador inexistente', async () => {
      mockGetPortador.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/portadores/999',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBeDefined();
    });
  });

  describe('POST /api/v1/portadores', () => {
    it('cria portador com role admin', async () => {
      mockCreatePortador.mockResolvedValue(MOCK_PORTADOR);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/portadores',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload: { nomeportador: 'Sicredi', tipoconta: 'C', id_membrofamilia: 1 },
      });

      expect(res.statusCode).toBe(201);
      expect(mockCreatePortador).toHaveBeenCalledTimes(1);
    });

    it('retorna 403 com role viewer', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'viewer-uid', email: 'viewer@test.com', name: 'Viewer', role: 'viewer',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/portadores',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload: { nomeportador: 'Novo', tipoconta: 'C', id_membrofamilia: 1 },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/portadores/:id', () => {
    it('exclui portador com sucesso', async () => {
      mockDeletePortador.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/portadores/1',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(204);
    });

    it('retorna 422 quando exclusão é bloqueada pelo serviço', async () => {
      mockDeletePortador.mockRejectedValue(new Error('Portador com saldo não pode ser excluído'));

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/portadores/1',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().error).toContain('saldo');
    });
  });
});
