import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db/prisma';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      matricula: string;
      role: string;
    }
  }
}

export async function auth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido.' });
    }

    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Token inválido ou expirado.' });
  }
}

export function hasPermission(permissionName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Não autenticado.' });
    }

    // Se o cargo for explicitamente ADMIN, permite todas as ações por padrão (bypass de emergência)
    if (request.user.role === 'ADMIN') {
      return;
    }

    const userWithPermissions = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!userWithPermissions || !userWithPermissions.role.permissions) {
      return reply.status(403).send({ error: 'Acesso negado. Permissões não encontradas.' });
    }

    const permissions = userWithPermissions.role.permissions as any;
    
    if (!permissions[permissionName]) {
      return reply.status(403).send({ error: 'Acesso negado. Você não tem permissão para esta ação.' });
    }
  };
}
