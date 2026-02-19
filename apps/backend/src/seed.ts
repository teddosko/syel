import argon2 from 'argon2';
import { prisma } from './lib/prisma';

async function main() {
  const tenant = await prisma.tenant.create({ data: { name: process.env.DEFAULT_TENANT_NAME ?? 'Acme Inc' } });
  const adminRole = await prisma.role.create({ data: { tenantId: tenant.id, name: 'ADMIN' } });
  const analystRole = await prisma.role.create({ data: { tenantId: tenant.id, name: 'ANALYST' } });
  const viewerRole = await prisma.role.create({ data: { tenantId: tenant.id, name: 'VIEWER' } });

  for (const role of [adminRole, analystRole, viewerRole]) {
    await prisma.rolePermission.create({ data: { tenantId: tenant.id, roleId: role.id, canWrite: role.name === 'ADMIN', maxRows: 100, timeoutMs: 3000 } });
  }

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      email: process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@example.com',
      passwordHash: await argon2.hash(process.env.DEFAULT_ADMIN_PASSWORD ?? 'ChangeMe123!'),
      status: 'ACTIVE'
    }
  });

  console.log('Seed complete', { tenantId: tenant.id });
}
main().finally(() => prisma.$disconnect());
