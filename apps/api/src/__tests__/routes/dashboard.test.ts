/**
 * Tests for GET /api/v1/dashboard
 * Firebase mocked via moduleNameMapper (jest config).
 * Services mocked via jest.unstable_mockModule + dynamic imports (ESM pattern).
 */
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { FastifyInstance } from 'fastify';

// --- Mocks de serviços (devem ser declarados ANTES dos dynamic imports) ---
const mockGetDashboardData = jest.fn();

jest.unstable_mockModule('../../services/dashboard.service.js', () => ({
  getDashboardData: mockGetDashboardData,
}));

// Stub para outros serviços importados indiretamente pelas rotas registradas no app
jest.unstable_mockModule('../../services/portadores.service.js', () => ({
  listPortadores: jest.fn(), getPortador: jest.fn(), createPortador: jest.fn(),
  updatePortador: jest.fn(), deletePortador: jest.fn(),
}));
jest.unstable_mockModule('../../services/contas.service.js', () => ({
  listContas: jest.fn(), getConta: jest.fn(), createConta: jest.fn(), updateConta: jest.fn(),
  deleteConta: jest.fn(), addTagConta: jest.fn(), removeTagConta: jest.fn(),
  toggleMarcado: jest.fn(), reiniciarMarcadas: jest.fn(),
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

// --- Dynamic imports APÓS os mocks ---
const { buildApp, TEST_TOKEN } = await import('../helpers/buildApp.js');

// --- Dados de exemplo ---
const MOCK_DASHBOARD = {
  saldoTotal: 103832.51,
  saldoBancario: 1095.64,
  valorReservado: 102736.87,
  totalContasPagar: 11983.1,
  totalContasReceber: 16861.27,
  saldoLiquido: 4878.17,
  saldoFgts: 54063.12,
  saldoGeralComFgts: 157895.63,
  portadores: [
    { id: 1, nome: 'Sicredi', tipo: 'C', saldo: 28.36, reservado: false, contaCapital: false, membroId: 1, membroNome: 'Diogo Marcel' },
  ],
  evolucaoSaldo: [
    { mes: '2026-03', saldoTotal: 101200.0 },
    { mes: '2026-04', saldoTotal: 103832.51 },
  ],
};

describe('GET /api/v1/dashboard', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/dashboard' });
    expect(res.statusCode).toBe(401);
  });

  it('retorna dados do dashboard com token válido', async () => {
    mockGetDashboardData.mockResolvedValue(MOCK_DASHBOARD);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: TEST_TOKEN },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.saldoTotal).toBe(103832.51);
    expect(body.portadores).toHaveLength(1);
    expect(body.evolucaoSaldo).toHaveLength(2);
    expect(mockGetDashboardData).toHaveBeenCalledTimes(1);
  });

  it('retorna 500 quando serviço lança erro', async () => {
    mockGetDashboardData.mockRejectedValue(new Error('DB error'));

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/dashboard',
      headers: { authorization: TEST_TOKEN },
    });

    expect(res.statusCode).toBe(500);
  });
});
