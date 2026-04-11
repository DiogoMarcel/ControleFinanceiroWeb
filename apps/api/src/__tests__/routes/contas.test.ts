import { jest } from '@jest/globals';
import type { FastifyInstance } from 'fastify';

const mockListContas = jest.fn();
const mockGetConta = jest.fn();
const mockCreateConta = jest.fn();
const mockUpdateConta = jest.fn();
const mockDeleteConta = jest.fn();
const mockAddTagConta = jest.fn();
const mockRemoveTagConta = jest.fn();
const mockToggleMarcado = jest.fn();
const mockReiniciarMarcadas = jest.fn();

jest.unstable_mockModule('../../services/contas.service.js', () => ({
  listContas: mockListContas,
  getConta: mockGetConta,
  createConta: mockCreateConta,
  updateConta: mockUpdateConta,
  deleteConta: mockDeleteConta,
  addTagConta: mockAddTagConta,
  removeTagConta: mockRemoveTagConta,
  toggleMarcado: mockToggleMarcado,
  reiniciarMarcadas: mockReiniciarMarcadas,
}));

jest.unstable_mockModule('../../services/dashboard.service.js', () => ({ getDashboardData: jest.fn() }));
jest.unstable_mockModule('../../services/portadores.service.js', () => ({
  listPortadores: jest.fn(), getPortador: jest.fn(), createPortador: jest.fn(),
  updatePortador: jest.fn(), deletePortador: jest.fn(),
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

const MOCK_CONTA = {
  idconta: 5,
  descricao: 'Energia Elétrica',
  valor: 280.0,
  tipoconta: 'P',
  marcado: false,
  contaanual: false,
  pertenceafolha: false,
  debitacartao: false,
  debitoauto: false,
  pagamentomanual: true,
  qtdparcela: null,
  id_credor: 2,
  id_membrofamilia: 1,
  membrofamilia: { idmembrofamilia: 1, nome: 'Diogo Marcel' },
  credor: { idcredor: 2, nome: 'CEMIG' },
  contatag: [],
};

describe('Contas', () => {
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

  describe('GET /api/v1/contas', () => {
    it('retorna 401 sem token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/contas' });
      expect(res.statusCode).toBe(401);
    });

    it('lista contas sem filtro', async () => {
      mockListContas.mockResolvedValue([MOCK_CONTA]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/contas',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].descricao).toBe('Energia Elétrica');
    });

    it('repassa filtro tipoconta para o serviço', async () => {
      mockListContas.mockResolvedValue([MOCK_CONTA]);

      await app.inject({
        method: 'GET',
        url: '/api/v1/contas?tipoconta=P',
        headers: { authorization: TEST_TOKEN },
      });

      expect(mockListContas).toHaveBeenCalledWith(expect.objectContaining({ tipoconta: 'P' }));
    });
  });

  describe('POST /api/v1/contas', () => {
    const payload = {
      descricao: 'Energia Elétrica',
      valor: 280.0,
      tipoconta: 'P',
      id_membrofamilia: 1,
      id_credor: 2,
    };

    it('cria conta com role admin', async () => {
      mockCreateConta.mockResolvedValue(MOCK_CONTA);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contas',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload,
      });

      expect(res.statusCode).toBe(201);
    });

    it('retorna 403 com role viewer', async () => {
      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'viewer-uid', email: 'viewer@test.com', name: 'Viewer', role: 'viewer',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contas',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload,
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/v1/contas/:id/marcar', () => {
    it('marca conta como paga', async () => {
      mockToggleMarcado.mockResolvedValue({ idconta: 5, marcado: true });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/contas/5/marcar',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload: { marcado: true },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().marcado).toBe(true);
      expect(mockToggleMarcado).toHaveBeenCalledWith(5, true);
    });

    it('desmarca conta', async () => {
      mockToggleMarcado.mockResolvedValue({ idconta: 5, marcado: false });

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/contas/5/marcar',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload: { marcado: false },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().marcado).toBe(false);
    });
  });

  describe('POST /api/v1/contas/reiniciar', () => {
    it('reinicia marcações do tipo P', async () => {
      mockReiniciarMarcadas.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contas/reiniciar',
        headers: { authorization: TEST_TOKEN, 'content-type': 'application/json' },
        payload: { tipoconta: 'P' },
      });

      expect(res.statusCode).toBe(204);
      expect(mockReiniciarMarcadas).toHaveBeenCalledWith('P');
    });
  });

  describe('DELETE /api/v1/contas/:id', () => {
    it('exclui conta sem histórico de baixas', async () => {
      mockDeleteConta.mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/contas/5',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(204);
    });

    it('retorna 422 quando conta tem baixas registradas', async () => {
      mockDeleteConta.mockRejectedValue(new Error('Conta possui baixas efetuadas'));

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/contas/5',
        headers: { authorization: TEST_TOKEN },
      });

      expect(res.statusCode).toBe(422);
      expect(res.json().error).toContain('baixas');
    });
  });
});
