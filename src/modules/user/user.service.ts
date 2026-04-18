import { prisma } from '../../shared/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  matricula: z.string().min(6, 'Matrícula deve ter no mínimo 6 caracteres'),
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.string().optional().default('OPERATOR'),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z.string().optional(),
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
        orderBy: sortBy === 'role' ? { role: { name: order } } : { [sortBy]: order },
        include: {
          role: true,
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        matricula: user.matricula,
        name: user.name,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateUserInput, userId: string) {
    const userExists = await prisma.user.findUnique({
      where: { matricula: data.matricula },
    });

    if (userExists) {
      throw new Error('Usuário já cadastrado com esta matrícula');
    }

    const role = await prisma.role.findUnique({
      where: { name: data.role.toUpperCase() },
    });

    if (!role) {
      throw new Error('Cargo especificado não existe');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          matricula: data.matricula,
          name: data.name,
          password: hashedPassword,
          roleId: role.id,
        },
        include: {
          role: true,
        }
      });

      await tx.userHistory.create({
        data: {
          targetUserId: user.id,
          itemName: `Usuário: ${user.name} (${user.matricula})`,
          action: 'Criou',
          userId,
        }
      });

      return {
        id: user.id,
        matricula: user.matricula,
        name: user.name,
        role: user.role.name,
        createdAt: user.createdAt,
      };
    });
  }

  async update(id: string, data: UpdateUserInput, loggedUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    
    if (data.role) {
      const newRole = await prisma.role.findUnique({
        where: { name: data.role.toUpperCase() },
      });

      if (!newRole) {
        throw new Error('Cargo especificado não existe');
      }

      if (user.matricula === 'admin' && newRole.name !== 'ADMIN') {
        throw new Error('Não é possível alterar o cargo do usuário administrador mestre.');
      }

      if (id === loggedUserId && newRole.name !== user.role.name) {
        throw new Error('Você não pode alterar seu próprio cargo para evitar perda de acesso administrativo.');
      }

      updateData.roleId = newRole.id;
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          role: true,
        },
      });

      await tx.userHistory.create({
        data: {
          targetUserId: id,
          itemName: `Usuário: ${updatedUser.name} (${updatedUser.matricula})`,
          action: 'Editou',
          userId: loggedUserId,
        }
      });

      return {
        id: updatedUser.id,
        matricula: updatedUser.matricula,
        name: updatedUser.name,
        role: updatedUser.role.name,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: user.id,
      matricula: user.matricula,
      name: user.name,
      role: user.role.name,
      avatarUrl: user.avatarUrl,
      permissions: user.role.permissions,
      updatedAt: user.updatedAt,
    };
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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return {
      id: updatedUser.id,
      matricula: updatedUser.matricula,
      name: updatedUser.name,
      role: updatedUser.role.name,
      avatarUrl: updatedUser.avatarUrl,
      permissions: updatedUser.role.permissions,
      updatedAt: updatedUser.updatedAt,
    };
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

  async delete(id: string, loggedUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.matricula === 'admin') {
      throw new Error('Não é possível excluir o usuário administrador mestre.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.userHistory.create({
        data: {
          targetUserId: null,
          itemName: `Usuário: ${user.name} (${user.matricula})`,
          action: 'Excluiu',
          userId: loggedUserId,
        }
      });

      await tx.user.delete({
        where: { id },
      });
    });
  }
}
