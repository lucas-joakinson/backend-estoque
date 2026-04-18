import { FastifyReply, FastifyRequest } from 'fastify';
import { NotificationService, updateSettingsSchema } from './notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const summary = await this.notificationService.getSummary();
      return reply.status(200).send(summary);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getRecentActivities(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const activities = await this.notificationService.getRecentActivities(userId);
      return reply.status(200).send(activities);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async clearActivities(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      await this.notificationService.clearActivities(userId);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await this.notificationService.getSettings();
      return reply.status(200).send(settings);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = updateSettingsSchema.parse(request.body);
      const settings = await this.notificationService.updateSettings(data);
      return reply.status(200).send(settings);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
