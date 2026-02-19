import { prisma } from '../lib/prisma';
import { RolePolicy } from '@pkg/shared';

export async function loadRolePolicy(tenantId: string, roleId: string): Promise<RolePolicy> {
  const perm = await prisma.rolePermission.findUniqueOrThrow({ where: { tenantId_roleId: { tenantId, roleId } } });
  const cols = await prisma.roleColumnAllowlist.findMany({ where: { tenantId, roleId } });
  const allowedTables: Record<string, string[]> = {};
  for (const c of cols) {
    if (!allowedTables[c.tableName]) allowedTables[c.tableName] = [];
    allowedTables[c.tableName].push(c.columnName);
  }
  return { canWrite: perm.canWrite, maxRows: perm.maxRows, timeoutMs: perm.timeoutMs, allowedTables };
}
