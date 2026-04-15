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
          patrimonio: data.patrimonio,
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
}
