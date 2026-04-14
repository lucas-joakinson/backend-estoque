import { prisma } from '../../shared/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  matricula: z.string().min(6, 'Matrícula deve ter no mínimo 6 caracteres'),
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.nativeEnum(Role).optional().default(Role.OPERATOR),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.nativeEnum(Role).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').optional(),
  avatarUrl: z.string().url('URL da foto de perfil inválida').optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação da nova senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(['matricula', 'name', 'createdAt', 'role']).default('matricula'),
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
          name: true,
          role: true,
          avatarUrl: true,
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
        name: data.name,
        password: hashedPassword,
        role: data.role,
      },
    });

    return {
      id: user.id,
      matricula: user.matricula,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async update(id: string, data: UpdateUserInput, loggedUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.matricula === 'admin' && data.role && data.role !== user.role) {
      throw new Error('Não é possível alterar o cargo do usuário administrador mestre.');
    }

    if (id === loggedUserId && data.role && data.role !== user.role) {
      throw new Error('Você não pode alterar seu próprio cargo para evitar perda de acesso administrativo.');
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.role) {
      updateData.role = data.role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        matricula: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        matricula: true,
        name: true,
        role: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
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
