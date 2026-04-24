import { FastifyInstance } from 'fastify';
import { PermissionController } from './permission.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function permissionRoutes(app: FastifyInstance) {
  const permissionController = new PermissionController();

  app.get('/', { preHandler: [auth, hasPermission('canViewPermissions')] }, (request, reply) => 
    permissionController.listAll(request, reply)
  );

  app.get('/:role', { preHandler: [auth, hasPermission('canViewPermissions')] }, (request, reply) => 
    permissionController.getByRole(request, reply)
  );

  app.patch('/:role', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    permissionController.updateRole(request, reply)
  );

  app.post('/roles', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    permissionController.createRole(request, reply)
  );

  app.delete('/:role', { preHandler: [auth, hasPermission('canManageUsers')] }, (request, reply) => 
    permissionController.deleteRole(request, reply)
  );
}
