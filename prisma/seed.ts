import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { matricula: 'admin' },
    update: {
      role: 'ADMIN',
      name: 'Administrador',
    },
    create: {
      matricula: 'admin',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
