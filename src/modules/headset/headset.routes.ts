import { FastifyInstance } from 'fastify';
import { HeadsetController } from './headset.controller';
import { auth } from '../../shared/middleware/auth.middleware';

export async function headsetRoutes(app: FastifyInstance) {
  const headsetController = new HeadsetController();

  app.get('/', { preHandler: [auth] }, (request, reply) => 
    headsetController.listAll(request, reply)
  );

  app.get('/:id', { preHandler: [auth] }, (request, reply) => 
    headsetController.getById(request, reply)
  );

  app.get('/:id/history', { preHandler: [auth] }, (request, reply) => 
    headsetController.getHistory(request, reply)
  );

  app.post('/bulk', { preHandler: [auth] }, (request, reply) => 
    headsetController.createBulk(request, reply)
  );

  app.post('/', { preHandler: [auth] }, (request, reply) => 
    headsetController.create(request, reply)
  );

  app.put('/:id', { preHandler: [auth] }, (request, reply) => 
    headsetController.update(request, reply)
  );

  app.delete('/:id', { preHandler: [auth] }, (request, reply) => 
    headsetController.delete(request, reply)
  );
}
