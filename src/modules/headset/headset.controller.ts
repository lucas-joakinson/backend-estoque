import { FastifyReply, FastifyRequest } from 'fastify';
import { HeadsetService, headsetSchema, headsetQuerySchema, bulkHeadsetSchema } from './headset.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro'),
});

export class HeadsetController {
  private headsetService: HeadsetService;

  constructor() {
    this.headsetService = new HeadsetService();
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = headsetQuerySchema.parse(request.query);
      const result = await this.headsetService.findAll(query);
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Parâmetros de busca inválidos', errors: error.errors });
      }
      return reply.status(500).send({ message: error.message });
    }
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.headsetService.getStats();
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = paramsSchema.parse(request.params);
      const headset = await this.headsetService.findById(id);
      return reply.status(200).send(headset);
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
      const history = await this.headsetService.getHistory(id);
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
      const data = headsetSchema.parse(request.body);
      const headset = await this.headsetService.create(data, userId);
      return reply.status(201).send(headset);
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
      const data = bulkHeadsetSchema.parse(request.body);
      const result = await this.headsetService.createBulk(data, userId);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Erro de validação no lote', errors: error.errors });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ message: error.message });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    try {
      const { id } = paramsSchema.parse(request.params);
      const data = headsetSchema.partial().parse(request.body);
      const headset = await this.headsetService.update(id, data, userId);
      return reply.status(200).send(headset);
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
      await this.headsetService.delete(id);
      return reply.status(204).send();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: error.errors[0].message });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async updateBulk(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    const bulkUpdateSchema = z.object({
      ids: z.array(z.number()),
      data: headsetSchema.partial(),
    });

    try {
      const { ids, data } = bulkUpdateSchema.parse(request.body);
      const result = await this.headsetService.updateBulk(ids, data, userId);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
