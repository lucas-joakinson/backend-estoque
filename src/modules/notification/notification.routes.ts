import { FastifyInstance } from 'fastify';
import { NotificationController } from './notification.controller';
import { auth, hasPermission } from '../../shared/middleware/auth.middleware';

export async function notificationRoutes(app: FastifyInstance) {
  const notificationController = new NotificationController();

  app.get('/summary', { preHandler: [auth] }, (request, reply) => 
    notificationController.getSummary(request, reply)
  );

  app.get('/recent-activities', { preHandler: [auth] }, (request, reply) => 
    notificationController.getRecentActivities(request, reply)
  );

  app.post('/recent-activities/clear', { preHandler: [auth] }, (request, reply) => 
    notificationController.clearActivities(request, reply)
  );

  app.get('/settings', { preHandler: [auth, hasPermission('canViewNotifications')] }, (request, reply) => 
    notificationController.getSettings(request, reply)
  );

  app.put('/settings', { preHandler: [auth, hasPermission('canManageNotifications')] }, (request, reply) => 
    notificationController.updateSettings(request, reply)
  );
}
