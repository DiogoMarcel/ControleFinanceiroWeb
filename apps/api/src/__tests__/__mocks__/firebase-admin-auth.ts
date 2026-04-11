import { jest } from '@jest/globals';

// jest.fn() compartilhado — tests podem chamar mockVerifyIdToken.mockResolvedValueOnce(...)
export const mockVerifyIdToken = jest.fn<() => Promise<{ uid: string; email: string; name: string; role: string }>>()
  .mockResolvedValue({
    uid: 'test-uid',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin',
  });

export const getAuth = () => ({
  verifyIdToken: mockVerifyIdToken,
});
