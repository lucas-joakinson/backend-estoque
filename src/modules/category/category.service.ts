import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório'),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export class CategoryService {
  async create(data: CategoryInput) {
    const categoryExists = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (categoryExists) {
      throw new Error('Categoria já existe');
    }

    return prisma.category.create({ data });
  }

  async findAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error('Categoria não encontrada');
    return category;
  }

  async update(id: string, data: CategoryInput) {
    const category = await this.findById(id);
    
    const categoryWithName = await prisma.category.findFirst({
      where: { 
        name: data.name,
        NOT: { id }
      },
    });

    if (categoryWithName) {
      throw new Error('Já existe outra categoria com este nome');
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    const hasProducts = await prisma.product.findFirst({
      where: { categoryId: id },
    });

    if (hasProducts) {
      throw new Error('Não é possível excluir uma categoria que possui produtos');
    }

    return prisma.category.delete({ where: { id } });
  }
}
