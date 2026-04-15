import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const updatePermissionsSchema = z.object({
  canManageUsers: z.boolean().optional(),
  canManageProducts: z.boolean().optional(),
  canManageCategories: z.boolean().optional(),
  canManageAssets: z.boolean().optional(),
  canDeleteItems: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Nome do cargo deve ter no mínimo 2 caracteres').toUpperCase(),
  permissions: updatePermissionsSchema.optional(),
});

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export class PermissionService {
  async listAllRoles() {
    return prisma.role.findMany({
      include: {
        permissions: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getRolePermissions(roleName: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName.toUpperCase() },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new Error('Cargo não encontrado');
    }

    return role;
  }

  async updateRolePermissions(roleName: string, data: UpdatePermissionsInput) {
    const role = await prisma.role.findUnique({
      where: { name: roleName.toUpperCase() },
    });

    if (!role) {
      throw new Error('Cargo não encontrado');
    }

    return prisma.rolePermission.update({
      where: { roleId: role.id },
      data,
    });
  }

  async createRole(data: CreateRoleInput) {
    const roleExists = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (roleExists) {
      throw new Error('Cargo já existe');
    }

    return prisma.role.create({
      data: {
        name: data.name,
        permissions: {
          create: {
            canManageUsers: data.permissions?.canManageUsers ?? false,
            canManageProducts: data.permissions?.canManageProducts ?? false,
            canManageCategories: data.permissions?.canManageCategories ?? false,
            canManageAssets: data.permissions?.canManageAssets ?? false,
            canDeleteItems: data.permissions?.canDeleteItems ?? false,
            canViewReports: data.permissions?.canViewReports ?? false,
          }
        }
      },
      include: {
        permissions: true,
      }
    });
  }
}
