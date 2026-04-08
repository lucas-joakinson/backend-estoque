import { FastifyReply, FastifyRequest } from 'fastify';
import { StockService, stockInSchema, stockOutSchema, updateMovementSchema } from './stock.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class StockController {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
  }

  async updateMovementReason(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const data = updateMovementSchema.parse(request.body);

    try {
      const result = await this.stockService.updateMovementReason(id, data);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async stockIn(request: FastifyRequest, reply: FastifyReply) {
    const data = stockInSchema.parse(request.body);
    const userId = request.user.sub as string;

    try {
      const result = await this.stockService.stockIn(data, userId);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async stockOut(request: FastifyRequest, reply: FastifyReply) {
    const data = stockOutSchema.parse(request.body);
    const userId = request.user.sub as string;

    try {
      const result = await this.stockService.stockOut(data, userId);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async listMovements(request: FastifyRequest, reply: FastifyReply) {
    const movements = await this.stockService.getMovements();
    return reply.status(200).send(movements);
  }
}
