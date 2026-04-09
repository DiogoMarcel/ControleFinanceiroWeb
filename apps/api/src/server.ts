import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
  },
});

// Security plugins
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
await app.register(cors, {
  origin: process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173',
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// TODO: registrar rotas aqui

const port = Number(process.env['PORT'] ?? 3001);
const host = process.env['HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`API rodando em http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
