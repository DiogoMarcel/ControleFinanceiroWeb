/**
 * Mock centralizado do Firebase Admin para testes.
 * Importar este arquivo em cada test suite via jest.mock().
 *
 * Uso nos test files:
 *   jest.mock('firebase-admin/app', () => require('../helpers/firebaseMock').firebaseAdminAppMock)
 *   jest.mock('firebase-admin/auth', () => require('../helpers/firebaseMock').firebaseAdminAuthMock)
 */

export const mockVerifyIdToken = jest.fn().mockResolvedValue({
  uid: 'test-uid',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
});

export const firebaseAdminAppMock = {
  initializeApp: jest.fn(),
  cert: jest.fn().mockReturnValue({}),
  getApps: jest.fn().mockReturnValue([{}]), // array não-vazio → initializeApp não é chamado
};

export const firebaseAdminAuthMock = {
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
  }),
};
