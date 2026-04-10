import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService, createUserSchema, userQuerySchema } from './user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
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
