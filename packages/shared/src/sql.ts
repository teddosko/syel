import { parse } from 'pgsql-ast-parser';
import { RolePolicy } from './types';

const blocked = ['drop', 'alter', 'create', 'grant', 'revoke', 'copy', 'pg_sleep'];

export function validateSql(sql: string, policy: RolePolicy) {
  const lower = sql.toLowerCase();
  if (blocked.some((k) => lower.includes(k))) throw new Error('Blocked keyword');
  if (sql.split(';').filter(Boolean).length > 1) throw new Error('Multi-statement blocked');

  const statements = parse(sql);
  if (statements.length !== 1) throw new Error('Only one statement allowed');
  const stmt = statements[0] as any;
  if (!policy.canWrite && stmt.type !== 'select') throw new Error('Read-only role');
  if (stmt.type !== 'select' && stmt.type !== 'insert' && stmt.type !== 'update' && stmt.type !== 'delete') {
    throw new Error('Unsupported statement');
  }
  const from = stmt.from?.[0]?.name;
  if (from && !policy.allowedTables[from]) throw new Error('Table not allowed');
  return true;
}

export function enforceLimit(sql: string, maxRows: number) {
  if (/\blimit\s+\d+/i.test(sql)) return sql;
  return `${sql.trim()} LIMIT ${maxRows}`;
}
