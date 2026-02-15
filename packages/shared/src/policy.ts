import { RolePolicy } from './types';

export function isTableAllowed(policy: RolePolicy, table: string) {
  return Object.hasOwn(policy.allowedTables, table);
}

export function isColumnAllowed(policy: RolePolicy, table: string, column: string) {
  return policy.allowedTables[table]?.includes(column) ?? false;
}

export function enforceTenant<T extends { tenantId: string }>(row: T, tenantId: string) {
  if (row.tenantId !== tenantId) throw new Error('Tenant isolation violation');
  return row;
}
