import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const updatePermissionsSchema = z.object({
  canManageUsers: z.boolean().optional(),
  canManageProducts: z.boolean().optional(),
  canManageCategories: z.boolean().optional(),
  canManageAssets: z.boolean().optional(),
  canDeleteItems: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canManageComputers: z.boolean().optional(),
  canDeleteComputers: z.boolean().optional(),
  canManageHeadsets: z.boolean().optional(),
  canDeleteHeadsets: z.boolean().optional(),
  canExportData: z.boolean().optional(),
  canManageNotifications: z.boolean().optional(),
  canViewUsers: z.boolean().optional(),
  canViewPermissions: z.boolean().optional(),
  canViewNotifications: z.boolean().optional(),
  canViewAssets: z.boolean().optional(),
  canViewHeadsets: z.boolean().optional(),
  canViewComputers: z.boolean().optional(),
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
        _count: {
          select: { users: true }
        }
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
            canManageComputers: data.permissions?.canManageComputers ?? false,
            canDeleteComputers: data.permissions?.canDeleteComputers ?? false,
            canManageHeadsets: data.permissions?.canManageHeadsets ?? false,
            canDeleteHeadsets: data.permissions?.canDeleteHeadsets ?? false,
            canExportData: data.permissions?.canExportData ?? false,
            canManageNotifications: data.permissions?.canManageNotifications ?? false,
            canViewUsers: data.permissions?.canViewUsers ?? false,
            canViewPermissions: data.permissions?.canViewPermissions ?? false,
            canViewNotifications: data.permissions?.canViewNotifications ?? false,
            canViewAssets: data.permissions?.canViewAssets ?? false,
            canViewHeadsets: data.permissions?.canViewHeadsets ?? false,
            canViewComputers: data.permissions?.canViewComputers ?? false,
          }
        }
      },
      include: {
        permissions: true,
      }
    });
  }

  async deleteRole(roleName: string) {
    const name = roleName.toUpperCase();
    
    if (name === 'ADMIN') {
      throw new Error('O cargo ADMIN não pode ser excluído');
    }

    const role = await prisma.role.findUnique({
      where: { name },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      throw new Error('Cargo não encontrado');
    }

    if (role._count.users > 0) {
      throw new Error('Não é possível excluir um cargo que possui usuários vinculados');
    }

    return prisma.role.delete({
      where: { id: role.id }
    });
  }
}
