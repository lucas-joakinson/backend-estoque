import { FastifyInstance } from 'fastify';
import { ComputerController } from './computer.controller';
import { auth } from '../../shared/middleware/auth.middleware';

export async function computerRoutes(app: FastifyInstance) {
  const computerController = new ComputerController();

  app.get('/', { preHandler: [auth] }, (request, reply) => 
    computerController.listAll(request, reply)
  );

  app.get('/stats', { preHandler: [auth] }, (request, reply) => 
    computerController.getStats(request, reply)
  );

  app.get('/:id', { preHandler: [auth] }, (request, reply) => 
    computerController.getById(request, reply)
  );

  app.get('/:id/history', { preHandler: [auth] }, (request, reply) => 
    computerController.getHistory(request, reply)
  );

  app.post('/bulk', { preHandler: [auth] }, (request, reply) => 
    computerController.createBulk(request, reply)
  );

  app.post('/', { preHandler: [auth] }, (request, reply) => 
    computerController.create(request, reply)
  );

  app.put('/:id', { preHandler: [auth] }, (request, reply) => 
    computerController.update(request, reply)
  );

  app.patch('/bulk', { preHandler: [auth] }, (request, reply) => 
    computerController.updateBulk(request, reply)
  );

  app.delete('/:id', { preHandler: [auth] }, (request, reply) => 
    computerController.delete(request, reply)
  );
}
