import { prisma } from '../../shared/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  matricula: z.string().min(6, 'Matrícula deve ter no mínimo 6 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.nativeEnum(Role).optional().default(Role.OPERATOR),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(['matricula', 'createdAt', 'role']).default('matricula'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;

export class UserService {
  async findAll(query: UserQueryInput) {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
        select: {
          id: true,
          matricula: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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
        role: data.role,
      },
    });

    return {
      id: user.id,
      matricula: user.matricula,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async findByMatricula(matricula: string) {
    return prisma.user.findUnique({
      where: { matricula },
    });
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.matricula === 'admin') {
      throw new Error('Não é possível excluir o usuário administrador mestre.');
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}
