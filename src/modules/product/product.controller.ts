import { FastifyReply, FastifyRequest } from 'fastify';
import { ProductService, productSchema } from './product.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = productSchema.parse(request.body);
    try {
      const product = await this.productService.create(data);
      return reply.status(201).send(product);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const products = await this.productService.findAll();
    return reply.status(200).send(products);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    try {
      const product = await this.productService.findById(id);
      return reply.status(200).send(product);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const data = productSchema.parse(request.body);
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
