import { FastifyReply, FastifyRequest } from 'fastify';
import { CategoryService, categorySchema } from './category.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    const data = categorySchema.parse(request.body);
    try {
      const category = await this.categoryService.create(data, userId);
      return reply.status(201).send(category);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const categories = await this.categoryService.findAll();
    return reply.status(200).send(categories);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    const { id } = paramsSchema.parse(request.params);
    const data = categorySchema.parse(request.body);
    try {
      const category = await this.categoryService.update(id, data, userId);
      return reply.status(200).send(category);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    const { id } = paramsSchema.parse(request.params);
    try {
      await this.categoryService.delete(id, userId);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
