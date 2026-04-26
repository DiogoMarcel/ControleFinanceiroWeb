import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { FastifyInstance } from 'fastify';

// extrato.ts usa prisma diretamente
const mockExtrato = { findMany: jest.fn() };
const mockPrisma = {
  saldoextrato: mockExtrato,
  veiculos: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  abastecimentos: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  fgts: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  aluguel: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  aluguelconta: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  aluguelcomp: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  alugueltemplate: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  contapagamentos: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  $queryRaw: jest.fn(),
};

jest.unstable_mockModule('../../lib/prisma.js', () => ({ prisma: mockPrisma }));
jest.unstable_mockModule('../../services/dashboard.service.js', () => ({ getDashboardData: jest.fn() }));
jest.unstable_mockModule('../../services/portadores.service.js', () => ({
  listPortadores: jest.fn(), getPortador: jest.fn(), createPortador: jest.fn(),
  updatePortador: jest.fn(), deletePortador: jest.fn(),
}));
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

const { buildApp, TEST_TOKEN } = await import('../helpers/buildApp.js');
const { mockVerifyIdToken } = await import('../__mocks__/firebase-admin-auth.js');

const MOCK_EXTRATO = [
  {
    idsaldoextrato: 10,
    datalancamento: new Date('2026-04-08'),
    tiposaldo: 'P',
    valor: 280.0,
    saldo: 8200.0,
    descricao: 'Energia Elétrica',
    id_conta: 5,
    conta: { descricao: 'Energia Elétrica' },
  },
  {
    idsaldoextrato: 9,
    datalancamento: new Date('2026-04-01'),
    tiposaldo: 'R',
    valor: 5200.0,
    saldo: 8480.0,
    descricao: 'Salário',
    id_conta: null,
    conta: null,
  },
];

describe('GET /api/v1/extrato', () => {
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

  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/extrato' });
    expect(res.statusCode).toBe(401);
  });

  it('retorna extrato sem filtros', async () => {
    mockExtrato.findMany.mockResolvedValue(MOCK_EXTRATO);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/extrato',
      headers: { authorization: TEST_TOKEN },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it('mapeia tiposaldo para tipoDescricao corretamente', async () => {
    mockExtrato.findMany.mockResolvedValue(MOCK_EXTRATO);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/extrato',
      headers: { authorization: TEST_TOKEN },
    });

    const body = res.json();
    expect(body[0].tipoDescricao).toBe('Pagamento');
    expect(body[1].tipoDescricao).toBe('Recebimento');
  });

  it('filtra por período quando passado ?inicio e ?fim', async () => {
    mockExtrato.findMany.mockResolvedValue([MOCK_EXTRATO[0]]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/extrato?inicio=2026-04-01&fim=2026-04-30',
      headers: { authorization: TEST_TOKEN },
    });

    expect(res.statusCode).toBe(200);
    expect(mockExtrato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          datalancamento: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it('filtra por tipo quando passado ?tipo=P', async () => {
    mockExtrato.findMany.mockResolvedValue([MOCK_EXTRATO[0]]);

    await app.inject({
      method: 'GET',
      url: '/api/v1/extrato?tipo=P',
      headers: { authorization: TEST_TOKEN },
    });

    expect(mockExtrato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tiposaldo: 'P' }),
      }),
    );
  });

  it('ordena por idsaldoextrato DESC', async () => {
    mockExtrato.findMany.mockResolvedValue(MOCK_EXTRATO);

    await app.inject({
      method: 'GET',
      url: '/api/v1/extrato',
      headers: { authorization: TEST_TOKEN },
    });

    expect(mockExtrato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { idsaldoextrato: 'desc' },
      }),
    );
  });

  it('inclui contaDescricao null quando conta não vinculada', async () => {
    mockExtrato.findMany.mockResolvedValue([MOCK_EXTRATO[1]]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/extrato',
      headers: { authorization: TEST_TOKEN },
    });

    expect(res.json()[0].contaDescricao).toBeNull();
  });
});
