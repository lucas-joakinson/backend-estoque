import { FastifyReply, FastifyRequest } from 'fastify';
import { StockService, stockInSchema, stockOutSchema } from './stock.service';

export class StockController {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
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
