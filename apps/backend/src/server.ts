import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { chatRoutes } from './routes/chat';

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_ACCESS_SECRET! });
app.register(rateLimit, { max: 100, timeWindow: '1 minute', keyGenerator: (req) => ((req.user as any)?.sub ?? req.ip) });

app.decorate('requireAuth', async function (req: any) {
  await req.jwtVerify();
});

app.decorate('requireRole', function (...roles: string[]) {
  return async function (req: any) {
    await req.jwtVerify();
    if (!roles.includes(req.user.role)) throw app.httpErrors.forbidden();
  };
});

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: any;
    requireRole: (...roles: string[]) => any;
  }
}

app.register(authRoutes);
app.register(adminRoutes);
app.register(chatRoutes);

app.listen({ port: Number(process.env.APP_PORT ?? 4000), host: '0.0.0.0' });
