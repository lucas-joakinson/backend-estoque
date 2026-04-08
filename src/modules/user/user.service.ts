import { prisma } from '../../shared/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const createUserSchema = z.object({
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export class UserService {
  async create(data: CreateUserInput) {
    const userExists = await prisma.user.findUnique({
      where: { matricula: data.matricula },
    });

    if (userExists) {
      throw new Error('Usuário já cadastrado com esta matrícula');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        matricula: data.matricula,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      matricula: user.matricula,
      createdAt: user.createdAt,
    };
  }

  async findByMatricula(matricula: string) {
    return prisma.user.findUnique({
      where: { matricula },
    });
  }
}
