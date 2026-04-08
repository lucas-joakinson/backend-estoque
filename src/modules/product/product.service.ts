import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  categoryId: z.string().uuid('Categoria inválida'),
});

export type ProductInput = z.infer<typeof productSchema>;

export class ProductService {
  async create(data: ProductInput) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    const skuExists = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (skuExists) {
      throw new Error('SKU já cadastrado');
    }

    return prisma.product.create({
      data,
    });
  }

  async findAll() {
    return prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new Error('Produto não encontrado');
    return product;
  }

  async update(id: string, data: ProductInput) {
    await this.findById(id);

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    const skuExists = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        NOT: { id },
      },
    });

    if (skuExists) {
      throw new Error('SKU já cadastrado em outro produto');
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const hasMovements = await prisma.stockMovement.findFirst({
      where: { productId: id },
    });

    if (hasMovements) {
      throw new Error('Não é possível excluir um produto que possui movimentações de estoque');
    }

    return prisma.product.delete({ where: { id } });
  }
}
