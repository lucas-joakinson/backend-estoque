import { FastifyInstance } from 'fastify';
import { AssetController } from './asset.controller';
import { auth, isAdmin } from '../../shared/middleware/auth.middleware';

export async function assetRoutes(app: FastifyInstance) {
  const assetController = new AssetController();

  app.get('/', { preHandler: [auth] }, (request, reply) => 
    assetController.listAll(request, reply)
  );

  app.get('/stats', { preHandler: [auth] }, (request, reply) => 
    assetController.getStats(request, reply)
  );

  app.get('/:id/history', { preHandler: [auth] }, (request, reply) => 
    assetController.getHistory(request, reply)
  );

  app.get('/history/:id', { preHandler: [auth] }, (request, reply) => 
    assetController.getHistory(request, reply)
  );

  app.get('/:patrimonio', { preHandler: [auth] }, (request, reply) => 
    assetController.getByPatrimonio(request, reply)
  );

  app.post('/bulk', { preHandler: [auth] }, (request, reply) => 
    assetController.createBulk(request, reply)
  );

  app.post('/', { preHandler: [auth] }, (request, reply) => 
    assetController.create(request, reply)
  );

  app.patch('/:id', { preHandler: [auth] }, (request, reply) => 
    assetController.update(request, reply)
  );

  app.patch('/bulk', { preHandler: [auth] }, (request, reply) => 
    assetController.updateBulk(request, reply)
  );

  app.delete('/:id', { preHandler: [auth, isAdmin] }, (request, reply) => 
    assetController.delete(request, reply)
  );
}
