import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { loadRolePolicy } from '../services/policy.service';
import { generateSql } from '../services/llm.service';
import { executeSafeQuery } from '../services/query.service';

export async function chatRoutes(app: FastifyInstance) {
  app.post('/chat/:conversationId/message', { preHandler: [app.requireAuth] }, async (req, reply) => {
    const started = Date.now();
    const user = req.user as any;
    const { conversationId } = req.params as any;
    const { content } = req.body as any;
    const convo = await prisma.conversation.findFirst({ where: { id: conversationId, tenantId: user.tenantId } });
    if (!convo) return reply.code(404).send({ error: 'Conversation not found' });
    const policy = await loadRolePolicy(user.tenantId, user.roleId);
    const conn = await prisma.dbConnection.findFirstOrThrow({ where: { id: convo.connectionId, tenantId: user.tenantId } });

    await prisma.message.create({ data: { conversationId, role: 'USER', content } });

    let status = 'SUCCESS';
    let sqlGenerated: string | undefined;
    let sqlExecuted: string | undefined;
    try {
      const llm = await generateSql(content, (conn.schemaSnapshot as any) || policy.allowedTables, policy.maxRows);
      sqlGenerated = llm.sql;
      const result = await executeSafeQuery(conn, llm.sql, policy);
      sqlExecuted = result.sql;
      const assistantContent = `${llm.explanation}\n\nReturned ${result.rowCount} rows in ${result.latencyMs}ms.`;
      const msg = await prisma.message.create({ data: { conversationId, role: 'ASSISTANT', content: assistantContent, metadata: { sql: result.sql, rows: result.rows, rowCount: result.rowCount, latencyMs: result.latencyMs } } });
      await prisma.auditLog.create({ data: { tenantId: user.tenantId, userId: user.sub, connectionId: conn.id, action: 'CHAT_QUERY', sqlGenerated, sqlExecuted, status, latencyMs: Date.now() - started } });
      return { message: msg };
    } catch (e: any) {
      status = 'FAILED';
      await prisma.auditLog.create({ data: { tenantId: user.tenantId, userId: user.sub, connectionId: conn.id, action: 'CHAT_QUERY', sqlGenerated, sqlExecuted, status, latencyMs: Date.now() - started, metadataJson: { error: e.message } } });
      return reply.code(400).send({ error: e.message });
    }
  });
}
