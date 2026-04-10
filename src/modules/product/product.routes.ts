import { FastifyInstance } from 'fastify';
import { ProductController } from './product.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function productRoutes(app: FastifyInstance) {
  const productController = new ProductController();

  app.get('/', { preHandler: [auth] }, (request, reply) => 
    productController.listAll(request, reply)
  );

  app.post('/', { preHandler: [auth, isAdmin] }, (request, reply) => 
    productController.create(request, reply)
  );

  app.patch('/:id', { preHandler: [auth, isAdmin] }, (request, reply) => 
    productController.update(request, reply)
  );

  app.delete('/:id', { preHandler: [auth, isAdmin] }, (request, reply) => 
    productController.delete(request, reply)
  );
}
