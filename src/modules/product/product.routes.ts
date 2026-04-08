import { FastifyInstance } from 'fastify';
import { ProductController } from './product.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export async function productRoutes(app: FastifyInstance) {
  const productController = new ProductController();

  app.addHook('preHandler', authMiddleware);

  app.post('/', (request, reply) => productController.create(request, reply));
  app.get('/', (request, reply) => productController.list(request, reply));
  app.get('/:id', (request, reply) => productController.getById(request, reply));
  app.put('/:id', (request, reply) => productController.update(request, reply));
  app.delete('/:id', (request, reply) => productController.delete(request, reply));
}
