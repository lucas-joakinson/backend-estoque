import { FastifyInstance } from 'fastify';
import { ProductController } from './product.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function productRoutes(app: FastifyInstance) {
  const productController = new ProductController();

  app.get('/', { preHandler: [auth] }, (request, reply) => 
    productController.listAll(request, reply)
  );

  app.post('/', { preHandler: [auth, hasPermission('canManageProducts')] }, (request, reply) => 
    productController.create(request, reply)
  );

  app.patch('/:id', { preHandler: [auth, hasPermission('canManageProducts')] }, (request, reply) => 
    productController.update(request, reply)
  );

  app.delete('/:id', { preHandler: [auth, hasPermission('canDeleteItems')] }, (request, reply) => 
    productController.delete(request, reply)
  );
}
