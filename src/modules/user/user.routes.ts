import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function userRoutes(app: FastifyInstance) {
  const userController = new UserController();

  app.post('/', { preHandler: [auth, isAdmin] }, (request, reply) => 
    userController.create(request, reply)
  );

  app.get('/', { preHandler: [auth, isAdmin] }, (request, reply) => 
    userController.listAll(request, reply)
  );
}
