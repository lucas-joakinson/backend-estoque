import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService, createUserSchema, userQuerySchema, updateUserSchema, changePasswordSchema, updateProfileSchema } from './user.service';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

const paramsSchema = z.object({
  id: z.string().uuid('ID de usuário inválido'),
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const user = await this.userService.getProfile(loggedUserId);
      return reply.status(200).send(user);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ message: 'Nenhum arquivo enviado' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      return reply.status(400).send({ message: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP.' });
    }

    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'avatars');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = path.extname(data.filename);
    const fileName = `${loggedUserId}-${Date.now()}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    try {
      await pump(data.file, fs.createWriteStream(filePath));
      
      const avatarUrl = `/uploads/avatars/${fileName}`;
      const user = await this.userService.updateProfile(loggedUserId, { avatarUrl });

      return reply.status(200).send(user);
    } catch (error: any) {
      return reply.status(500).send({ message: 'Erro ao salvar o arquivo: ' + error.message });
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const data = changePasswordSchema.parse(request.body);
      await this.userService.changePassword(loggedUserId, data);
      return reply.status(200).send({ message: 'Senha alterada com sucesso' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Erro de validação', 
          errors: error.errors.map(err => ({ field: err.path[0], message: err.message })) 
        });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const data = updateProfileSchema.parse(request.body);
      const user = await this.userService.updateProfile(loggedUserId, data);
      return reply.status(200).send(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Erro de validação', 
          errors: error.errors.map(err => ({ field: err.path[0], message: err.message })) 
        });
      }
      return reply.status(400).send({ message: error.message });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const data = updateUserSchema.parse(request.body);
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const user = await this.userService.update(id, data, loggedUserId);
      return reply.status(200).send(user);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = paramsSchema.parse(request.params);
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    if (id === loggedUserId) {
      return reply.status(400).send({ message: 'Você não pode excluir seu próprio usuário.' });
    }

    try {
      await this.userService.delete(id, loggedUserId);
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
    const loggedUserId = request.user?.id;

    if (!loggedUserId) {
      return reply.status(401).send({ message: 'Usuário não autenticado' });
    }

    try {
      const data = createUserSchema.parse(request.body);
      const user = await this.userService.create(data, loggedUserId);
      return reply.status(201).send(user);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
