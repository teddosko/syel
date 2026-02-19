import { Pool } from 'pg';
import { decryptSecret } from '../lib/crypto';
import { enforceLimit, validateSql } from '@pkg/shared';
import { RolePolicy } from '@pkg/shared';

export async function executeSafeQuery(connection: any, sql: string, policy: RolePolicy) {
  validateSql(sql, policy);
  const finalSql = enforceLimit(sql, policy.maxRows);
  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: decryptSecret(connection.encryptedPassword),
    ssl: connection.sslmode === 'require' ? { rejectUnauthorized: false } : undefined
  });
  const client = await pool.connect();
  const start = Date.now();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL statement_timeout = ${policy.timeoutMs}`);
    if (!policy.canWrite) await client.query('SET LOCAL default_transaction_read_only = on');
    const result = await client.query(finalSql);
    await client.query('ROLLBACK');
    return { rows: result.rows, rowCount: result.rowCount ?? 0, sql: finalSql, latencyMs: Date.now() - start };
  } finally {
    client.release();
    await pool.end();
  }
}
