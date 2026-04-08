import { FastifyInstance } from 'fastify';
import { StockController } from './stock.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';

export async function stockRoutes(app: FastifyInstance) {
  const stockController = new StockController();

  app.addHook('preHandler', authMiddleware);

  app.post('/in', (request, reply) => stockController.stockIn(request, reply));
  app.post('/out', (request, reply) => stockController.stockOut(request, reply));
  app.get('/movements', (request, reply) => stockController.listMovements(request, reply));
  app.patch('/movements/:id', (request, reply) => stockController.updateMovementReason(request, reply));
}
