import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function userRoutes(app: FastifyInstance) {
  const userController = new UserController();

  app.post('/', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    userController.create(request, reply)
  );

  app.patch('/password', { preHandler: [auth] }, (request, reply) => 
    userController.changePassword(request, reply)
  );

  app.get('/profile', { preHandler: [auth] }, (request, reply) => 
    userController.getProfile(request, reply)
  );

  app.patch('/profile', { preHandler: [auth] }, (request, reply) => 
    userController.updateProfile(request, reply)
  );

  app.post('/avatar', { preHandler: [auth] }, (request, reply) => 
    userController.uploadAvatar(request, reply)
  );

  app.get('/', { preHandler: [auth, hasPermission('canViewUsers')] }, (request, reply) => 
    userController.listAll(request, reply)
  );

  app.patch('/bulk-roles', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    userController.bulkUpdateRoles(request, reply)
  );

  app.patch('/:id', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    userController.update(request, reply)
  );

  app.delete('/:id', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    userController.delete(request, reply)
  );
}
