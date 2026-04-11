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
const allowedOrigins = (process.env['ALLOWED_ORIGIN'] ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Em desenvolvimento, aceita qualquer origem da rede local
    if (process.env['NODE_ENV'] !== 'production' && /^http:\/\/(192\.168\.|10\.)/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'), false);
  },
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
