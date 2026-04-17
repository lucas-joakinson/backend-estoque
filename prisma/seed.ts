import { PrismaClient, AssetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de dados de teste...');

  // 1. Limpar dados existentes
  await prisma.assetHistory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.headsetHistory.deleteMany();
  await prisma.computerHistory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.headset.deleteMany();
  await prisma.computador.deleteMany();

  // 2. Criar Cargos e Permissões
  const adminRole = await prisma.role.create({
    data: {
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

  const operatorRole = await prisma.role.create({
    data: {
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

  const supervisorRole = await prisma.role.create({
    data: {
      name: 'SUPERVISOR',
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

  // 3. Criar Usuários
  const password = await bcrypt.hash('123456', 10);
  
  const adminUser = await prisma.user.create({
    data: { matricula: 'admin', name: 'Admin do Sistema', password, roleId: adminRole.id }
  });

  await prisma.user.createMany({
    data: [
      { matricula: '100001', name: 'João Operador', password, roleId: operatorRole.id },
      { matricula: '100002', name: 'Maria Supervisora', password, roleId: supervisorRole.id },
      { matricula: '100003', name: 'Carlos Técnico', password, roleId: operatorRole.id },
    ]
  });

  // 4. Criar Categorias
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Eletrônicos' } }),
    prisma.category.create({ data: { name: 'Mobiliário' } }),
    prisma.category.create({ data: { name: 'Informática' } }),
    prisma.category.create({ data: { name: 'Ferramentas' } }),
    prisma.category.create({ data: { name: 'Eletrodomésticos' } }),
  ]);

  // 5. Criar Produtos
  const productsData = [
    { name: 'Notebook Dell Latitude', brand: 'Dell', catIdx: 2 },
    { name: 'Monitor 24"', brand: 'LG', catIdx: 2 },
    { name: 'Cadeira Ergonômica', brand: 'Flexform', catIdx: 1 },
    { name: 'Mesa de Escritório', brand: 'Madesa', catIdx: 1 },
    { name: 'Furadeira de Impacto', brand: 'Bosch', catIdx: 3 },
    { name: 'Multímetro Digital', brand: 'Fluke', catIdx: 3 },
    { name: 'Smartphone Galaxy S23', brand: 'Samsung', catIdx: 0 },
    { name: 'Ar Condicionado 12000 BTUs', brand: 'Gree', catIdx: 4 },
  ];

  const products = await Promise.all(
    productsData.map(p => 
      prisma.product.create({
        data: {
          name: p.name,
          brand: p.brand,
          categoryId: categories[p.catIdx].id
        }
      })
    )
  );

  // 6. Criar Ativos (Assets)
  console.log('📦 Gerando 40 ativos de exemplo...');
  const assetStatuses: AssetStatus[] = ['DISPONIVEL', 'EM_USO', 'EM_MANUTENCAO', 'DEFEITO'];
  const locations = ['Sede Central', 'Filial Norte', 'Depósito A', 'Escritório 01', 'TI - Suporte'];

  for (let i = 1; i <= 40; i++) {
    const prodIdx = Math.floor(Math.random() * products.length);
    const statusIdx = Math.floor(Math.random() * assetStatuses.length);
    const locIdx = Math.floor(Math.random() * locations.length);

    const asset = await prisma.asset.create({
      data: {
        patrimonio: `PAT${String(i).padStart(5, '0')}`,
        status: assetStatuses[statusIdx],
        location: locations[locIdx],
        responsible: i % 3 === 0 ? 'Departamento de TI' : 'Almoxarifado Central',
        productId: products[prodIdx].id,
      }
    });

    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        newStatus: asset.status,
        newLocation: asset.location,
        observation: 'Criação inicial',
        userId: adminUser.id
      }
    });
  }

  // 7. Criar Headsets
  console.log('🎧 Gerando 15 headsets de exemplo...');
  const headsetBrands = ['Logitech', 'Jabra', 'Plantronics', 'Sennheiser', 'HyperX'];
  const headsetStatuses: any[] = ['EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];

  for (let i = 1; i <= 15; i++) {
    const brandIdx = Math.floor(Math.random() * headsetBrands.length);
    const statusIdx = Math.floor(Math.random() * headsetStatuses.length);
    const status = headsetStatuses[statusIdx];
    
    // Desvincular matrícula para certos status
    const isUnlinked = ['EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'].includes(status);

    const headset = await prisma.headset.create({
      data: {
        matricula: isUnlinked ? null : `M${100000 + i}`,
        lacre: `L${String(i).padStart(4, '0')}`,
        marca: headsetBrands[brandIdx],
        numeroSerie: i % 5 === 0 ? null : `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: status,
        observacoes: i % 5 === 0 ? 'Equipamento reserva' : null,
      }
    });

    await prisma.headsetHistory.create({
      data: {
        headsetId: headset.id,
        newStatus: headset.status,
        observation: 'Criação inicial',
        userId: adminUser.id
      }
    });
  }

  // 8. Criar Computadores
  console.log('💻 Gerando 10 computadores de exemplo...');
  const computerStatuses = ['Em uso', 'Manutenção', 'Defeito', 'Troca pendente', 'Em estoque'];

  for (let i = 1; i <= 10; i++) {
    const statusIdx = Math.floor(Math.random() * computerStatuses.length);

    const computer = await prisma.computador.create({
      data: {
        patrimonio: `CPU${String(i).padStart(4, '0')}`,
        hostname: `PC-PLANSUL-${String(i).padStart(3, '0')}`,
        status: computerStatuses[statusIdx],
        localizacao: i % 2 === 0 ? 'Sede Central' : 'Filial Norte',
      }
    });

    await prisma.computerHistory.create({
      data: {
        computadorId: computer.id,
        newStatus: computer.status,
        newLocation: computer.localizacao,
        observation: 'Criação inicial',
        userId: adminUser.id
      }
    });
  }

  console.log('✅ Seed finalizado com sucesso!');
  console.log('--- Resumo dos Dados ---');
  console.log('- 3 Cargos (ADMIN, OPERATOR, SUPERVISOR)');
  console.log('- 4 Usuários (Senha padrão: 123456)');
  console.log('- 5 Categorias');
  console.log('- 8 Produtos');
  console.log('- 40 Ativos com Histórico');
  console.log('- 15 Headsets com Histórico');
  console.log('- 10 Computadores com Histórico');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
