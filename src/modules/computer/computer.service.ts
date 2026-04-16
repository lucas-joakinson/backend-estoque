import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const computerSchema = z.object({
  patrimonio: z.string().min(1, 'Patrimônio é obrigatório').max(5, 'Patrimônio deve ter no máximo 5 caracteres'),
  hostname: z.string()
    .min(1, 'Hostname é obrigatório')
    .regex(/^PR721ET/i, 'Hostname deve começar com PR721ET'),
  status: z.enum(['Em uso', 'Manutenção', 'Defeito', 'Troca pendente', 'Em estoque'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  localizacao: z.string().min(1, 'Localização é obrigatória'),
  observacoes: z.string().optional().nullable(),
});

export const bulkComputerSchema = z.array(computerSchema).min(1, 'O lote deve conter pelo menos um computador');

export const computerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type ComputerInput = z.infer<typeof computerSchema>;
export type ComputerUpdateInput = Partial<ComputerInput>;
export type ComputerQueryInput = z.infer<typeof computerQuerySchema>;

export class ComputerService {
  async findAll(query: ComputerQueryInput) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { patrimonio: { contains: search, mode: 'insensitive' } },
        { hostname: { contains: search, mode: 'insensitive' } },
        { localizacao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [computers, total] = await Promise.all([
      prisma.computador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.computador.count({ where }),
    ]);

    return {
      computers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const computer = await prisma.computador.findUnique({
      where: { id },
      include: {
        history: {
          include: { user: { select: { name: true, matricula: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!computer) {
      throw new Error('Computador não encontrado');
    }

    return computer;
  }

  async create(data: ComputerInput, userId: string) {
    await this.validateUniqueness(data.patrimonio);

    return prisma.$transaction(async (tx) => {
      const computer = await tx.computador.create({
        data,
      });

      await tx.computerHistory.create({
        data: {
          computadorId: computer.id,
          newStatus: computer.status,
          newLocation: computer.localizacao,
          observation: 'Criação inicial',
          userId,
        },
      });

      return computer;
    });
  }

  async createBulk(data: ComputerInput[], userId: string) {
    const patrimonios = data.map(c => c.patrimonio.trim());
    
    if (new Set(patrimonios).size !== patrimonios.length) {
      throw new Error('O lote contém patrimônios duplicados');
    }

    const existingComputer = await prisma.computador.findFirst({
      where: { patrimonio: { in: patrimonios } },
    });

    if (existingComputer) {
      throw new Error(`O patrimônio ${existingComputer.patrimonio} já existe no sistema`);
    }

    return prisma.$transaction(async (tx) => {
      const results = await Promise.all(data.map(async (c) => {
        const normalizedData = {
          ...c,
          patrimonio: c.patrimonio.trim(),
          hostname: c.hostname.trim(),
          localizacao: c.localizacao.trim(),
        };

        const computer = await tx.computador.create({ data: normalizedData });
        
        await tx.computerHistory.create({
          data: {
            computadorId: computer.id,
            newStatus: computer.status,
            newLocation: computer.localizacao,
            observation: 'Criação inicial (Importação)',
            userId,
          },
        });
        
        return computer;
      }));

      return { count: results.length };
    });
  }

  async update(id: number, data: ComputerUpdateInput, userId: string) {
    const computer = await prisma.computador.findUnique({
      where: { id },
    });

    if (!computer) {
      throw new Error('Computador não encontrado');
    }

    if (data.patrimonio) {
      await this.validateUniqueness(data.patrimonio, id);
    }

    const hasStatusChange = data.status !== undefined && data.status !== computer.status;
    const hasLocationChange = data.localizacao !== undefined && data.localizacao !== computer.localizacao;
    const hasObservationChange = data.observacoes !== undefined && data.observacoes !== computer.observacoes;

    return prisma.$transaction(async (tx) => {
      const updatedComputer = await tx.computador.update({
        where: { id },
        data,
      });

      if (hasStatusChange || hasLocationChange || hasObservationChange) {
        await tx.computerHistory.create({
          data: {
            computadorId: id,
            oldStatus: computer.status,
            newStatus: updatedComputer.status,
            oldLocation: computer.localizacao,
            newLocation: updatedComputer.localizacao,
            observation: data.observacoes || 'Atualização de dados',
            userId,
          },
        });
      }

      return updatedComputer;
    });
  }

  async delete(id: number) {
    const computer = await prisma.computador.findUnique({
      where: { id },
    });

    if (!computer) {
      throw new Error('Computador não encontrado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.computerHistory.deleteMany({ where: { computadorId: id } });
      await tx.computador.delete({ where: { id } });
    });
  }

  async getHistory(id: number) {
    return prisma.computerHistory.findMany({
      where: { computadorId: id },
      include: {
        user: { select: { name: true, matricula: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async validateUniqueness(patrimonio: string, id?: number) {
    const existing = await prisma.computador.findFirst({
      where: { patrimonio, NOT: id ? { id } : undefined },
    });

    if (existing) {
      const error: any = new Error('Já existe um computador cadastrado com este patrimônio');
      error.code = 'P2002';
      throw error;
    }
  }
}
