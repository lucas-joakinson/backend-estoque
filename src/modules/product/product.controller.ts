import { FastifyReply, FastifyRequest } from 'fastify';
import { ProductService, createProductSchema, updateProductSchema, productQuerySchema } from './product.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('ID de produto inválido'),
});

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    const query = productQuerySchema.parse(request.query);
    const result = await this.productService.findAll(query);
    return reply.status(200).send(result);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createProductSchema.parse(request.body);

    try {
      const product = await this.productService.create(data);
      return reply.status(201).send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const data = updateProductSchema.parse(request.body);

    try {
      const product = await this.productService.update(id, data);
      return reply.status(200).send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);

    try {
      await this.productService.delete(id);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
