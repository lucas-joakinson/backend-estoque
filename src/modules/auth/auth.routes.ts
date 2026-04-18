import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  app.post('/register', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    authController.register(request, reply)
  );
  
  app.post('/login', (request, reply) => authController.login(request, reply));
}
