import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService, loginSchema } from './auth.service';
import { UserService, createUserSchema } from '../user/user.service';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = createUserSchema.parse(request.body);

    try {
      const user = await this.userService.create(data);
      return reply.status(201).send(user);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);

    try {
      const user = await this.authService.authenticate(data);
      const token = await reply.jwtSign(
        { 
          id: user.id,
          matricula: user.matricula,
          role: user.role 
        },
        { sign: { expiresIn: '8h' } }
      );
      return reply.status(200).send({ 
        token, 
        user: {
          id: user.id,
          matricula: user.matricula,
          name: user.name,
          role: user.role,
          permissions: user.permissions
        }
      });
    } catch (error: any) {
      return reply.status(401).send({ message: error.message });
    }
  }
}
