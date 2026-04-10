import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  app.post('/register', { preHandler: [auth, isAdmin] }, (request, reply) => 
    authController.register(request, reply)
  );
  
  app.post('/login', (request, reply) => authController.login(request, reply));
}
