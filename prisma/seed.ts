import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Criar Cargo ADMIN
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      permissions: {
        create: {
          canManageUsers: true,
          canManageProducts: true,
          canManageCategories: true,
          canManageAssets: true,
          canDeleteItems: true,
          canViewReports: true,
        }
      }
    }
  });

  // 2. Criar Cargo OPERATOR (permissões parciais)
  await prisma.role.upsert({
    where: { name: 'OPERATOR' },
    update: {},
    create: {
      name: 'OPERATOR',
      permissions: {
        create: {
          canManageUsers: false,
          canManageProducts: true,
          canManageCategories: true,
          canManageAssets: true,
          canDeleteItems: false,
          canViewReports: false,
        }
      }
    }
  });

  const adminPassword = await bcrypt.hash('admin123', 10);

  // 3. Criar Usuário Admin Mestre vinculado ao cargo ADMIN
  await prisma.user.upsert({
    where: { matricula: 'admin' },
    update: {
      roleId: adminRole.id,
      name: 'Administrador',
    },
    create: {
      matricula: 'admin',
      name: 'Administrador',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Seed de Cargos, Permissões e Admin concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
