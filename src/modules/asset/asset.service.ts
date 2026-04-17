import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';
import { AssetStatus } from '@prisma/client';

export const createAssetSchema = z.object({
  patrimonio: z.string().regex(/^\d{1,6}$/, 'Patrimônio deve ser apenas numeral com no máximo 6 caracteres'),
  location: z.string().min(1, 'Localização é obrigatória'),
  responsible: z.string().optional(),
  productId: z.string().uuid('ID de produto inválido'),
  status: z.nativeEnum(AssetStatus).optional().default(AssetStatus.DISPONIVEL),
});

export const createBulkAssetSchema = z.array(createAssetSchema).min(1, 'O lote deve conter pelo menos um ativo');

export const updateAssetSchema = z.object({
  status: z.nativeEnum(AssetStatus).optional(),
  location: z.string().optional(),
  responsible: z.string().optional(),
  observation: z.string().max(500, 'Observação deve ter no máximo 500 caracteres').optional(),
});

export const assetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['patrimonio', 'location', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type CreateBulkAssetInput = z.infer<typeof createBulkAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetQueryInput = z.infer<typeof assetQuerySchema>;

export class AssetService {
  async findAll(query: AssetQueryInput) {
    const { page, limit, search, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { patrimonio: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
        { responsible: { contains: search, mode: 'insensitive' as const } },
        { product: { name: { contains: search, mode: 'insensitive' as const } } },
        { product: { brand: { contains: search, mode: 'insensitive' as const } } },
      ],
    } : {};

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          product: {
            include: { category: true },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByPatrimonio(patrimonio: string) {
    return prisma.asset.findUnique({
      where: { patrimonio },
      include: {
        product: {
          include: { category: true },
        },
        history: {
          include: { user: { select: { matricula: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: CreateAssetInput, userId: string) {
    const patrimonioPadded = data.patrimonio.padStart(6, '0');

    const assetExists = await prisma.asset.findUnique({
      where: { patrimonio: patrimonioPadded },
    });

    if (assetExists) {
      throw new Error('Já existe um ativo cadastrado com este patrimônio');
    }

    const productExists = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!productExists) {
      throw new Error('Produto (modelo) não encontrado');
    }

    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          patrimonio: patrimonioPadded,
          location: data.location,
          responsible: data.responsible,
          productId: data.productId,
          status: data.status,
        },
      });

      await tx.assetHistory.create({
        data: {
          assetId: asset.id,
          newStatus: asset.status,
          newLocation: asset.location,
          observation: 'Criação inicial do ativo',
          userId,
        },
      });

      return asset;
    });
  }

  async createBulk(data: CreateBulkAssetInput, userId: string) {
    const patrimonios = data.map(asset => asset.patrimonio.padStart(6, '0'));
    const uniquePatrimoniosInBatch = new Set(patrimonios);

    if (uniquePatrimoniosInBatch.size !== patrimonios.length) {
      throw new Error('O lote contém números de patrimônio duplicados');
    }

    const existingAssets = await prisma.asset.findMany({
      where: { patrimonio: { in: patrimonios } },
      select: { patrimonio: true }
    });

    if (existingAssets.length > 0) {
      const dups = existingAssets.map(a => a.patrimonio).join(', ');
      throw new Error(`Os seguintes patrimônios já existem no sistema: ${dups}`);
    }

    const productIds = [...new Set(data.map(asset => asset.productId))];
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });

    if (existingProducts.length !== productIds.length) {
      throw new Error('Um ou mais produtos (modelos) informados não existem');
    }

    return prisma.$transaction(async (tx) => {
      const assetsData = data.map(assetData => ({
        patrimonio: assetData.patrimonio.padStart(6, '0'),
        location: assetData.location,
        responsible: assetData.responsible,
        productId: assetData.productId,
        status: assetData.status,
      }));

      // 1. Inserção em massa
      await tx.asset.createMany({
        data: assetsData,
      });

      // 2. Recupera os IDs para o histórico
      const createdAssets = await tx.asset.findMany({
        where: { patrimonio: { in: assetsData.map(a => a.patrimonio) } },
        select: { id: true, status: true, location: true },
      });

      // 3. Histórico em massa
      const historyData = createdAssets.map(asset => ({
        assetId: asset.id,
        newStatus: asset.status,
        newLocation: asset.location,
        observation: 'Criação inicial do ativo (Lote Otimizado)',
        userId,
      }));

      await tx.assetHistory.createMany({
        data: historyData,
      });

      return { count: createdAssets.length };
    }, { timeout: 30000 });
  }

  async getStats() {
    const stats = await prisma.asset.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    // Garante que todos os status apareçam, mesmo que com 0
    const allStatuses = Object.values(AssetStatus);
    allStatuses.forEach(status => {
      if (!formattedStats[status]) {
        formattedStats[status] = 0;
      }
    });

    return formattedStats;
  }

  async getAssetHistory(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    return prisma.assetHistory.findMany({
      where: { assetId },
      include: {
        user: {
          select: {
            matricula: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateAsset(id: string, data: UpdateAssetInput, userId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    const hasStatusChange = data.status && data.status !== asset.status;
    const hasLocationChange = data.location && data.location !== asset.location;
    const hasResponsibleChange = data.responsible !== undefined && data.responsible !== asset.responsible;

    if (!hasStatusChange && !hasLocationChange && !hasResponsibleChange) {
      return asset;
    }

    return prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          status: data.status,
          location: data.location,
          responsible: data.responsible,
        },
      });

      await tx.assetHistory.create({
        data: {
          assetId: id,
          oldStatus: asset.status,
          newStatus: updatedAsset.status,
          oldLocation: asset.location,
          newLocation: updatedAsset.location,
          observation: data.observation,
          userId,
        },
      });

      return updatedAsset;
    });
  }

  async delete(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new Error('Ativo não encontrado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.assetHistory.deleteMany({ where: { assetId: id } });
      await tx.asset.delete({ where: { id } });
    });
  }

  async updateBulk(ids: string[], data: UpdateAssetInput, userId: string) {
    const assets = await prisma.asset.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, location: true },
    });

    if (assets.length === 0) {
      throw new Error('Nenhum ativo encontrado para atualizar');
    }

    return prisma.$transaction(async (tx) => {
      await tx.asset.updateMany({
        where: { id: { in: ids } },
        data: {
          status: data.status,
          location: data.location,
          responsible: data.responsible,
        },
      });

      const historyData = assets.map(asset => ({
        assetId: asset.id,
        oldStatus: asset.status,
        newStatus: data.status || asset.status,
        oldLocation: asset.location,
        newLocation: data.location || asset.location,
        observation: data.observation || 'Atualização em lote',
        userId,
      }));

      await tx.assetHistory.createMany({
        data: historyData,
      });

      return { count: assets.length };
    });
  }
}
