import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  app.post('/register', (request, reply) => authController.register(request, reply));
  app.post('/login', (request, reply) => authController.login(request, reply));
}
