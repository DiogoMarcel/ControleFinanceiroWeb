import type { FastifyRequest, FastifyReply } from 'fastify';

// Middleware de autenticação Firebase — implementado na TASK-05
// Por ora, exporta um placeholder para não bloquear o setup
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Token não fornecido' });
    return;
  }

  // TODO (TASK-05): verificar token via Firebase Admin SDK
  // const token = authHeader.slice(7);
  // const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  // request.user = { uid: decoded.uid, email: decoded.email!, role: decoded.role ?? 'viewer' };
}
