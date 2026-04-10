import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService, createUserSchema, userQuerySchema } from './user.service';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('ID de usuário inválido'),
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const loggedUserId = request.user?.id;

    if (id === loggedUserId) {
      return reply.status(400).send({ message: 'Você não pode excluir seu próprio usuário.' });
    }

    try {
      await this.userService.delete(id);
      return reply.status(204).send();
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    const query = userQuerySchema.parse(request.query);

    try {
      const result = await this.userService.findAll(query);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createUserSchema.parse(request.body);

    try {
      const user = await this.userService.create(data);
      return reply.status(201).send(user);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
