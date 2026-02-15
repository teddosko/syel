import { FastifyRequest } from 'fastify';

export async function requireAuth(req: FastifyRequest) {
  await req.jwtVerify();
}

export function requireRole(...roles: string[]) {
  return async function (req: FastifyRequest) {
    await req.jwtVerify();
    const user = req.user as any;
    if (!roles.includes(user.role)) throw new Error('Forbidden');
  };
}
