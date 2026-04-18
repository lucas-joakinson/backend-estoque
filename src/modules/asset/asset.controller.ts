import { FastifyReply, FastifyRequest } from 'fastify';
import { AssetService, createAssetSchema, updateAssetSchema, assetQuerySchema, createBulkAssetSchema } from './asset.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('ID de ativo inválido'),
});

const patrimonioParamsSchema = z.object({
  patrimonio: z.string().min(1, 'Patrimônio é obrigatório'),
});

export class AssetController {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    const query = assetQuerySchema.parse(request.query);
    const result = await this.assetService.findAll(query);
    return reply.status(200).send(result);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.assetService.getStats();
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getCategoryStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.assetService.getCategoryStats();
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);

    try {
      const history = await this.assetService.getAssetHistory(id);
      return reply.status(200).send(history);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async getByPatrimonio(request: FastifyRequest, reply: FastifyReply) {
    const { patrimonio } = patrimonioParamsSchema.parse(request.params);

    const asset = await this.assetService.findByPatrimonio(patrimonio);

    if (!asset) {
      return reply.status(404).send({ message: 'Ativo não encontrado' });
    }

    return reply.status(200).send(asset);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createAssetSchema.parse(request.body);
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const asset = await this.assetService.create(data, userId);
      return reply.status(201).send(asset);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async createBulk(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const data = createBulkAssetSchema.parse(request.body);
      const result = await this.assetService.createBulk(data, userId);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const data = updateAssetSchema.parse(request.body);
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const asset = await this.assetService.updateAsset(id, data, userId);
      return reply.status(200).send(asset);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      await this.assetService.delete(id, userId);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async updateBulk(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) return reply.status(401).send({ message: 'Não autenticado' });

    const bulkUpdateSchema = z.object({
      ids: z.array(z.string().uuid()),
      data: updateAssetSchema.partial(),
    });

    try {
      const { ids, data } = bulkUpdateSchema.parse(request.body);
      const result = await this.assetService.updateBulk(ids, data, userId);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
