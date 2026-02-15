import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const { email, password, tenantId } = req.body as any;
    const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } }, include: { role: true } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) return reply.code(401).send({ error: 'Invalid credentials' });
    const accessToken = app.jwt.sign({ sub: user.id, tenantId, role: user.role.name, roleId: user.roleId, email: user.email }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ sub: user.id, tenantId }, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  });
  app.post('/auth/refresh', async (req) => {
    const { refreshToken } = req.body as any;
    const payload = app.jwt.verify(refreshToken) as any;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub }, include: { role: true } });
    const accessToken = app.jwt.sign({ sub: user.id, tenantId: user.tenantId, role: user.role.name, roleId: user.roleId, email: user.email }, { expiresIn: '15m' });
    return { accessToken };
  });
  app.post('/auth/logout', async () => ({ ok: true }));

  app.post('/auth/invite', { preHandler: [app.requireRole('ADMIN')] }, async (req) => {
    const userCtx = req.user as any;
    const { email, roleId } = req.body as any;
    const tempHash = await argon2.hash('TempPassword123!');
    return prisma.user.create({ data: { tenantId: userCtx.tenantId, email, roleId, passwordHash: tempHash, status: 'INVITED' } });
  });
  app.post('/auth/reset', async (req) => {
    const { tenantId, email, newPassword } = req.body as any;
    const user = await prisma.user.findUniqueOrThrow({ where: { tenantId_email: { tenantId, email } } });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(newPassword), status: 'ACTIVE' } });
    return { ok: true };
  });
}
