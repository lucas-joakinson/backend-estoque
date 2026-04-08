import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';

export async function userRoutes(app: FastifyInstance) {
  const userController = new UserController();

  app.post('/', (request, reply) => userController.create(request, reply));
}
