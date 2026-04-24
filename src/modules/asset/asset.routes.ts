import { FastifyInstance } from 'fastify';
import { AssetController } from './asset.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function assetRoutes(app: FastifyInstance) {
  const assetController = new AssetController();

  app.get('/', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.listAll(request, reply)
  );

  app.get('/stats', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.getStats(request, reply)
  );

  app.get('/stats/categories', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.getCategoriesStats(request, reply)
  );

  app.get('/:id/history', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.getHistory(request, reply)
  );

  app.get('/history/:id', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.getHistory(request, reply)
  );

  app.get('/:patrimonio', { preHandler: [auth, hasPermission(['canViewAssets', 'canManageAssets'])] }, (request, reply) => 
    assetController.getByPatrimonio(request, reply)
  );

  app.post('/bulk', { preHandler: [auth, hasPermission('canManageAssets')] }, (request, reply) => 
    assetController.createBulk(request, reply)
  );

  app.post('/', { preHandler: [auth, hasPermission('canManageAssets')] }, (request, reply) => 
    assetController.create(request, reply)
  );

  app.patch('/:id', { preHandler: [auth, hasPermission('canManageAssets')] }, (request, reply) => 
    assetController.update(request, reply)
  );

  app.patch('/bulk', { preHandler: [auth, hasPermission('canManageAssets')] }, (request, reply) => 
    assetController.updateBulk(request, reply)
  );

  app.delete('/:id', { preHandler: [auth, hasPermission('canDeleteItems')] }, (request, reply) => 
    assetController.delete(request, reply)
  );
}
