import { FastifyInstance } from 'fastify';
import { ProductController } from './product.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function productRoutes(app: FastifyInstance) {
  const productController = new ProductController();

  app.addHook('preHandler', auth);

  app.post('/', (request, reply) => productController.create(request, reply));
  app.get('/', (request, reply) => productController.list(request, reply));
  app.get('/:id', (request, reply) => productController.getById(request, reply));
  
  app.put('/:id', { preHandler: [isAdmin] }, (request, reply) => 
    productController.update(request, reply)
  );
  
  app.delete('/:id', { preHandler: [isAdmin] }, (request, reply) => 
    productController.delete(request, reply)
  );
}
