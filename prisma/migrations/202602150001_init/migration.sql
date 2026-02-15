-- Prisma baseline migration
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','INACTIVE','INVITED');
CREATE TYPE "RoleName" AS ENUM ('ADMIN','ANALYST','VIEWER');
CREATE TYPE "ConnectionType" AS ENUM ('POSTGRES');
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE "MessageRole" AS ENUM ('USER','ASSISTANT','SYSTEM');

CREATE TABLE "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name" "RoleName" NOT NULL,
  UNIQUE ("tenantId","name")
);
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE RESTRICT,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL,
  UNIQUE ("tenantId","email")
);
CREATE TABLE "RolePermission" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  "canWrite" BOOLEAN NOT NULL DEFAULT FALSE,
  "maxRows" INTEGER NOT NULL DEFAULT 100,
  "timeoutMs" INTEGER NOT NULL DEFAULT 3000,
  UNIQUE ("tenantId","roleId")
);
CREATE TABLE "RoleTableAllowlist" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  "tableName" TEXT NOT NULL,
  UNIQUE ("tenantId","roleId","tableName")
);
CREATE TABLE "RoleColumnAllowlist" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  "tableName" TEXT NOT NULL,
  "columnName" TEXT NOT NULL,
  UNIQUE ("tenantId","roleId","tableName","columnName")
);
CREATE TABLE "DbConnection" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "ConnectionType" NOT NULL,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL,
  "database" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "encryptedPassword" TEXT NOT NULL,
  "sslmode" TEXT NOT NULL,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
  "schemaSnapshot" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE TABLE "Conversation" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "connectionId" TEXT NOT NULL REFERENCES "DbConnection"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "role" "MessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "connectionId" TEXT REFERENCES "DbConnection"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "sqlGenerated" TEXT,
  "sqlExecuted" TEXT,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
