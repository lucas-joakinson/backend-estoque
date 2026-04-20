import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  min_headsets_disponiveis: z.number().int().min(0),
  max_headsets_defeito: z.number().int().min(0),
});

export type UpdateSettingsData = z.infer<typeof updateSettingsSchema>;

export class NotificationService {
  async getSettings() {
    let settings = await prisma.notificationSettings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          id: 'global',
          min_headsets_disponiveis: 5,
          max_headsets_defeito: 10,
        },
      });
    }

    return settings;
  }

  async updateSettings(data: UpdateSettingsData) {
    return prisma.notificationSettings.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        ...data,
      },
    });
  }

  async getSummary() {
    try {
      const settings = await this.getSettings();

      const counts = await prisma.headset.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      });

      const getCount = (status: string) => 
        counts.find((c) => c.status === status)?._count._all || 0;

      const availableCount = getCount('DISPONIVEL');
      const defectiveCount = getCount('DEFEITO');
      const maintenanceCount = getCount('EM_MANUTENCAO');

      const alerts = [];

      if (availableCount < settings.min_headsets_disponiveis) {
        alerts.push({
          id: 'low_stock_headsets',
          type: 'CRITICAL',
          title: 'Estoque Crítico de Headsets',
          message: `Existem apenas ${availableCount} headsets disponíveis em estoque.`,
          action_link: '/headsets?status=DISPONIVEL',
        });
      }

      if (defectiveCount > settings.max_headsets_defeito) {
        alerts.push({
          id: 'excessive_defective',
          type: 'WARNING',
          title: 'Acúmulo de Defeitos',
          message: `Há ${defectiveCount} headsets com defeito. Considere enviar para manutenção externa.`,
          action_link: '/headsets?status=DEFEITO',
        });
      }

      if (maintenanceCount > 0) {
        alerts.push({
          id: 'active_maintenance',
          type: 'INFO',
          title: 'Itens em Manutenção',
          message: `${maintenanceCount} headsets estão atualmente em processo de manutenção.`,
          action_link: '/headsets?status=EM_MANUTENCAO',
        });
      }

      return {
        alerts,
        unread_count: alerts.length,
      };
    } catch (error) {
      // Se houver qualquer erro ao buscar sumário (ex: tabela não existe ainda), retorna vazio em vez de erro
      return {
        alerts: [],
        unread_count: 0,
      };
    }
  }

  async getRecentActivities(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastActivityClear: true }
      });

      const where = user?.lastActivityClear 
        ? { createdAt: { gt: user.lastActivityClear } } 
        : {};

      const [
        assetHistory, 
        headsetHistory, 
        computerHistory,
        userHistory,
        categoryHistory,
        productHistory
      ] = await Promise.all([
        prisma.assetHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true, asset: true },
        }).catch(() => []),
        prisma.headsetHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true, headset: true },
        }).catch(() => []),
        prisma.computerHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true, computador: true },
        }).catch(() => []),
        prisma.userHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        }).catch(() => []),
        prisma.categoryHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        }).catch(() => []),
        prisma.productHistory.findMany({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        }).catch(() => []),
      ]);

      const activities = [
        ...assetHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.observation || 'Alterou status',
          itemName: h.itemName || (h.asset ? h.asset.patrimonio : 'Ativo excluído'),
          timestamp: h.createdAt,
        })),
        ...headsetHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.observation || 'Alterou status',
          itemName: h.itemName || (h.headset ? h.headset.lacre : 'Headset excluído'),
          timestamp: h.createdAt,
        })),
        ...computerHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.observation || 'Alterou status',
          itemName: h.itemName || (h.computador ? h.computador.patrimonio : 'Computador excluído'),
          timestamp: h.createdAt,
        })),
        ...userHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.action,
          itemName: h.itemName,
          timestamp: h.createdAt,
        })),
        ...categoryHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.action,
          itemName: h.itemName,
          timestamp: h.createdAt,
        })),
        ...productHistory.map((h) => ({
          userName: h.user?.name || 'Sistema',
          action: h.action,
          itemName: h.itemName,
          timestamp: h.createdAt,
        })),
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  async clearActivities(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastActivityClear: new Date() }
    });
  }
}
