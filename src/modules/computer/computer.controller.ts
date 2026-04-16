import { FastifyReply, FastifyRequest } from 'fastify';
import { ComputerService, computerSchema, computerQuerySchema, bulkComputerSchema } from './computer.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro'),
});

export class ComputerController {
  private computerService: ComputerService;

  constructor() {
    this.computerService = new ComputerService();
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = computerQuerySchema.parse(request.query);
      const result = await this.computerService.findAll(query);
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Parâmetros de busca inválidos', errors: error.errors });
      }
      return reply.status(500).send({ message: error.message });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paramsSchema.parse(request.params);
      const computer = await this.computerService.findById(id);
      return reply.status(200).send(computer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: error.errors[0].message });
      }
      return reply.status(404).send({ message: error.message });
    }
  }

  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paramsSchema.parse(request.params);
      const history = await this.computerService.getHistory(id);
      return reply.status(200).send(history);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: error.errors[0].message });
      }
      return reply.status(404).send({ message: error.message });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    try {
      const data = computerSchema.parse(request.body);
      const computer = await this.computerService.create(data, userId);
      return reply.status(201).send(computer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Erro de validação', 
          errors: error.errors.map(err => ({ field: err.path[0], message: err.message })) 
        });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ message: error.message });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async createBulk(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    try {
      const data = bulkComputerSchema.parse(request.body);
      const result = await this.computerService.createBulk(data, userId);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Erro de validação no lote', errors: error.errors });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    try {
      const { id } = paramsSchema.parse(request.params);
      const data = computerSchema.parse(request.body);
      const computer = await this.computerService.update(id, data, userId);
      return reply.status(200).send(computer);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Erro de validação', 
          errors: error.errors.map(err => ({ field: err.path[0], message: err.message })) 
        });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ message: error.message });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paramsSchema.parse(request.params);
      await this.computerService.delete(id);
      return reply.status(204).send();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: error.errors[0].message });
      }
      return reply.status(400).send({ message: error.message });
    }
  }
}
