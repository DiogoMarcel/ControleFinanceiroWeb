import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode ?? 500;

  if (statusCode >= 500) {
    reply.log.error(error);
  }

  reply.code(statusCode).send({
    error: error.message ?? 'Erro interno do servidor',
    ...(process.env['NODE_ENV'] !== 'production' && { stack: error.stack }),
  });
}
