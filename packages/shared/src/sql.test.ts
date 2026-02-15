import { describe, expect, it } from 'vitest';
import { enforceTenant, isColumnAllowed } from './policy';
import { enforceLimit, validateSql } from './sql';

const policy = {
  canWrite: false,
  maxRows: 20,
  timeoutMs: 3000,
  allowedTables: { customers: ['id', 'name'] }
};

describe('SQL validator', () => {
  it('blocks writes for read only role', () => {
    expect(() => validateSql('DELETE FROM customers', policy)).toThrow();
  });

  it('enforces table allowlist', () => {
    expect(() => validateSql('SELECT * FROM invoices', policy)).toThrow();
  });

  it('appends limit when absent', () => {
    expect(enforceLimit('SELECT * FROM customers', 10)).toContain('LIMIT 10');
  });
});

describe('RBAC allowlist enforcement', () => {
  it('allows configured column only', () => {
    expect(isColumnAllowed(policy, 'customers', 'name')).toBe(true);
    expect(isColumnAllowed(policy, 'customers', 'email')).toBe(false);
  });
});

describe('Tenant isolation', () => {
  it('throws for cross-tenant row', () => {
    expect(() => enforceTenant({ tenantId: 't1' }, 't2')).toThrow();
  });
});
