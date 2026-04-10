import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  brand: z.string().optional(),
  categoryId: z.string().uuid('ID de categoria inválido'),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'brand', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export class ProductService {
  async findAll(query: ProductQueryInput) {
    const { page, limit, search, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { brand: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          category: true,
          _count: {
            select: { assets: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateProductInput) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!categoryExists) {
      throw new Error('Categoria não encontrada');
    }

    return prisma.product.create({
      data,
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateProductInput>) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Produto (modelo) não encontrado');
    }

    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async delete(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { assets: true } } },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    if (product._count.assets > 0) {
      throw new Error('Não é possível excluir um produto que possui ativos vinculados.');
    }

    await prisma.product.delete({
      where: { id },
    });
  }
}
