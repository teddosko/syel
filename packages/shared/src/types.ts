export type RolePolicy = {
  canWrite: boolean;
  maxRows: number;
  timeoutMs: number;
  allowedTables: Record<string, string[]>;
};
