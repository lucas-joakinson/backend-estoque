import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      matricula: string;
      role: 'ADMIN' | 'OPERATOR';
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

export async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acesso negado. Apenas administradores.' });
  }
}
