import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { encryptSecret, decryptSecret } from '../lib/crypto';
import { Pool } from 'pg';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/tenants', { preHandler: [app.requireRole('ADMIN')] }, async () => prisma.tenant.findMany());

  app.get('/users', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.user.findMany({ where: { tenantId: (req.user as any).tenantId } }));
  app.post('/users', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.user.create({ data: req.body as any }));
  app.patch('/users/:id', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.user.update({ where: { id: (req.params as any).id }, data: req.body as any }));

  app.get('/roles', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.role.findMany({ where: { tenantId: (req.user as any).tenantId } }));
  app.get('/policies', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.rolePermission.findMany({ where: { tenantId: (req.user as any).tenantId } }));

  app.post('/connections', { preHandler: [app.requireRole('ADMIN')] }, async (req) => {
    const t = (req.user as any).tenantId;
    const body = req.body as any;
    return prisma.dbConnection.create({ data: { ...body, tenantId: t, encryptedPassword: encryptSecret(body.password), type: 'POSTGRES' } });
  });
  app.get('/connections', { preHandler: [app.requireRole('ADMIN')] }, async (req) => prisma.dbConnection.findMany({ where: { tenantId: (req.user as any).tenantId } }));
  app.post('/connections/test', { preHandler: [app.requireRole('ADMIN')] }, async (req) => {
    const c = req.body as any;
    const pool = new Pool({ host: c.host, port: c.port, database: c.database, user: c.username, password: c.password });
    await pool.query('SELECT 1');
    await pool.end();
    return { ok: true };
  });
  app.post('/connections/:id/introspect', { preHandler: [app.requireRole('ADMIN')] }, async (req) => {
    const conn = await prisma.dbConnection.findUniqueOrThrow({ where: { id: (req.params as any).id } });
    const pool = new Pool({
      host: conn.host, port: conn.port, database: conn.database, user: conn.username, password: decryptSecret(conn.encryptedPassword)
    });
    const rows = await pool.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,column_name`);
    await pool.end();
    const snap: Record<string, string[]> = {};
    rows.rows.forEach((r) => { if (!snap[r.table_name]) snap[r.table_name] = []; snap[r.table_name].push(r.column_name); });
    await prisma.dbConnection.update({ where: { id: conn.id }, data: { schemaSnapshot: snap } });
    return { schema: snap };
  });

  app.get('/audit', { preHandler: [app.requireRole('ADMIN')] }, async (req) => {
    const { userId, connectionId } = req.query as any;
    return prisma.auditLog.findMany({ where: { tenantId: (req.user as any).tenantId, userId: userId || undefined, connectionId: connectionId || undefined }, orderBy: { createdAt: 'desc' }, take: 200 });
  });
}
