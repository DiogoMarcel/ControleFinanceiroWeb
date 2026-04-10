import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { registerRoutes } from './routes/index.js';

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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

// Error handler
app.setErrorHandler(errorHandler);

// Health check (sem autenticação)
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Rotas da API
await registerRoutes(app);

const port = Number(process.env['PORT'] ?? 3001);
const host = process.env['HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`API rodando em http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
