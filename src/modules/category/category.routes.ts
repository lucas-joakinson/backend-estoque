import { FastifyInstance } from 'fastify';
import { CategoryController } from './category.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export async function categoryRoutes(app: FastifyInstance) {
  const categoryController = new CategoryController();

  app.addHook('preHandler', authMiddleware);

  app.post('/', (request, reply) => categoryController.create(request, reply));
  app.get('/', (request, reply) => categoryController.list(request, reply));
  app.put('/:id', (request, reply) => categoryController.update(request, reply));
  app.delete('/:id', (request, reply) => categoryController.delete(request, reply));
}
