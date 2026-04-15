import { FastifyInstance } from 'fastify';
import { PermissionController } from './permission.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function permissionRoutes(app: FastifyInstance) {
  const permissionController = new PermissionController();

  app.get('/', { preHandler: [auth, isAdmin] }, (request, reply) => 
    permissionController.listAll(request, reply)
  );

  app.get('/:role', { preHandler: [auth, isAdmin] }, (request, reply) => 
    permissionController.getByRole(request, reply)
  );

  app.patch('/:role', { preHandler: [auth, isAdmin] }, (request, reply) => 
    permissionController.updateRole(request, reply)
  );

  app.post('/roles', { preHandler: [auth, isAdmin] }, (request, reply) => 
    permissionController.createRole(request, reply)
  );
}
