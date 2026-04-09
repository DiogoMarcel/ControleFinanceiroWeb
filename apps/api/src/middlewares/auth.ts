import type { FastifyRequest, FastifyReply } from 'fastify';
import { firebaseAuth } from '../lib/firebase.js';
import type { AuthUser } from '@cfweb/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    request.user = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: decoded.name ?? null,
      role: (decoded['role'] as 'admin' | 'viewer') ?? 'viewer',
    };
  } catch {
    reply.code(401).send({ error: 'Token inválido ou expirado' });
  }
}
