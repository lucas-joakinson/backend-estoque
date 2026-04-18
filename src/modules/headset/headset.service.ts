import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';

export const headsetSchema = z.object({
  matricula: z.string().optional().nullable(),
  lacre: z.string().min(1, 'Lacre é obrigatório').max(5, 'Lacre deve ter no máximo 5 caracteres'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  numeroSerie: z.string().optional().nullable(),
  status: z.enum(['EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  observacoes: z.string().optional().nullable(),
});

export const bulkHeadsetSchema = z.array(headsetSchema).min(1, 'O lote deve conter pelo menos um headset');

export const headsetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['matricula', 'lacre', 'marca', 'numeroSerie', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type HeadsetInput = z.infer<typeof headsetSchema>;
export type HeadsetUpdateInput = Partial<HeadsetInput>;
export type HeadsetQueryInput = z.infer<typeof headsetQuerySchema>;

export class HeadsetService {
  async findAll(query: HeadsetQueryInput) {
    const { page, limit, search, status, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { matricula: { contains: search, mode: 'insensitive' } },
        { lacre: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { numeroSerie: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [headsets, total] = await Promise.all([
      prisma.headset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.headset.count({ where }),
    ]);

    return {
      headsets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const stats = await prisma.headset.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    // Garante que todos os status apareçam, mesmo que com 0
    const allStatuses = ['EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];
    allStatuses.forEach(status => {
      if (!formattedStats[status]) {
        formattedStats[status] = 0;
      }
    });

    return formattedStats;
  }

  async findById(id: number) {
    const headset = await prisma.headset.findUnique({
      where: { id },
      include: {
        history: {
          include: { user: { select: { name: true, matricula: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!headset) {
      throw new Error('Headset não encontrado');
    }

    return headset;
  }

  async create(data: HeadsetInput, userId: string) {
    const normalizedData = {
      ...data,
      matricula: data.matricula?.trim() || null,
      numeroSerie: data.numeroSerie?.trim() || null,
      lacre: data.lacre.trim(),
      marca: data.marca.trim(),
    };

    this.validateStatusAndMatricula(normalizedData.status, normalizedData.matricula);
    await this.validateUniqueness(normalizedData.lacre, normalizedData.numeroSerie, normalizedData.matricula);

    return prisma.$transaction(async (tx) => {
      const headset = await tx.headset.create({
        data: normalizedData,
      });

      await tx.headsetHistory.create({
        data: {
          headsetId: headset.id,
          itemName: `Headset Lacre ${headset.lacre}`,
          newStatus: headset.status,
          observation: 'Criação inicial',
          userId,
        },
      });

      return headset;
    });
  }

  async createBulk(data: HeadsetInput[], userId: string) {
    // ... keep validation
    const normalizedList = data.map(h => ({
      ...h,
      matricula: h.matricula?.trim() || null,
      lacre: h.lacre.trim(),
      marca: h.marca.trim(),
      numeroSerie: h.numeroSerie?.trim() || null,
      status: (h.status.toUpperCase().trim().replace(/\s+/g, '_') as any),
    }));

    // Validação de duplicidade no lote
    const lacres = normalizedList.map(h => h.lacre).filter(Boolean);
    if (new Set(lacres).size !== lacres.length) {
      throw new Error('O lote contém lacres duplicados');
    }

    const series = normalizedList.map(h => h.numeroSerie).filter(Boolean) as string[];
    if (new Set(series).size !== series.length) {
      throw new Error('O lote contém números de série duplicados');
    }

    const matriculas = normalizedList.map(h => h.matricula).filter(Boolean) as string[];
    if (new Set(matriculas).size !== matriculas.length) {
      throw new Error('O lote contém matrículas duplicadas');
    }

    // Validação status vs matrícula no lote
    for (const item of normalizedList) {
      this.validateStatusAndMatricula(item.status, item.matricula);
    }

    // Validação de duplicidade no banco
    const existingLacre = await prisma.headset.findFirst({
      where: { lacre: { in: lacres } },
    });
    if (existingLacre) {
      const error: any = new Error(`Lacre ${existingLacre.lacre} já existe no sistema`);
      error.code = 'P2002';
      throw error;
    }

    const existingSerie = await prisma.headset.findFirst({
      where: { numeroSerie: { in: series } },
    });
    if (existingSerie) {
      const error: any = new Error(`Série ${existingSerie.numeroSerie} já existe no sistema`);
      error.code = 'P2002';
      throw error;
    }

    const existingMatricula = await prisma.headset.findFirst({
      where: { matricula: { in: matriculas } },
    });
    if (existingMatricula) {
      const error: any = new Error(`Matrícula ${existingMatricula.matricula} já existe no sistema`);
      error.code = 'P2002';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      await tx.headset.createMany({
        data: normalizedList,
      });

      const createdHeadsets = await tx.headset.findMany({
        where: { lacre: { in: lacres } },
        select: { id: true, lacre: true, status: true },
      });

      const historyData = createdHeadsets.map(h => ({
        headsetId: h.id,
        itemName: `Headset Lacre ${h.lacre}`,
        newStatus: h.status,
        observation: 'Criação inicial (Importação Excel Otimizada)',
        userId,
      }));

      await tx.headsetHistory.createMany({
        data: historyData,
      });

      return { count: createdHeadsets.length };
    }, {
      timeout: 30000
    });
  }

  async update(id: number, data: HeadsetUpdateInput, userId: string) {
    const headset = await prisma.headset.findUnique({
      where: { id },
    });

    if (!headset) {
      throw new Error('Headset não encontrado');
    }

    const normalizedData: HeadsetUpdateInput = { ...data };
    if (data.matricula !== undefined) normalizedData.matricula = data.matricula?.trim() || null;
    if (data.numeroSerie !== undefined) normalizedData.numeroSerie = data.numeroSerie?.trim() || null;
    if (data.lacre !== undefined) normalizedData.lacre = data.lacre.trim();
    if (data.marca !== undefined) normalizedData.marca = data.marca.trim();

    const newStatus = normalizedData.status || headset.status;
    const newMatricula = normalizedData.matricula !== undefined ? normalizedData.matricula : headset.matricula;

    this.validateStatusAndMatricula(newStatus, newMatricula);

    if (normalizedData.lacre || normalizedData.numeroSerie || normalizedData.matricula) {
      await this.validateUniqueness(normalizedData.lacre, normalizedData.numeroSerie, normalizedData.matricula, id);
    }

    const finalData = { ...normalizedData };
    
    // NOVA REGRA: Ao adicionar uma matrícula, força o status para EM_USO se não for passado outro status
    const isLinkingMatricula = normalizedData.matricula && normalizedData.matricula.trim() !== '' && (!headset.matricula);
    if (isLinkingMatricula && !normalizedData.status && headset.status !== 'EM_USO') {
      finalData.status = 'EM_USO';
    }

    const hasStatusChange = finalData.status !== undefined && finalData.status !== headset.status;
    const hasMatriculaChange = finalData.matricula !== undefined && finalData.matricula !== headset.matricula;
    const hasObservationChange = data.observacoes !== undefined && data.observacoes !== headset.observacoes;

    return prisma.$transaction(async (tx) => {
      const updatedHeadset = await tx.headset.update({
        where: { id },
        data: finalData,
      });

      if (hasStatusChange || hasObservationChange || hasMatriculaChange) {
        let observation = data.observacoes || 'Atualização de dados';
        if (hasMatriculaChange && !finalData.matricula && headset.matricula) {
          observation = `Desvinculação de matrícula (${headset.matricula}). ${observation}`;
        }

        await tx.headsetHistory.create({
          data: {
            headsetId: id,
            itemName: `Headset Lacre ${headset.lacre}`,
            oldStatus: (headset.status as any),
            newStatus: updatedHeadset.status,
            observation,
            userId,
          },
        });
      }

      return updatedHeadset;
    });
  }

  async delete(id: number, userId: string) {
    const headset = await prisma.headset.findUnique({
      where: { id },
    });

    if (!headset) {
      throw new Error('Headset não encontrado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.headsetHistory.create({
        data: {
          headsetId: null,
          itemName: `Headset Lacre ${headset.lacre}`,
          newStatus: headset.status,
          observation: 'Excluiu headset',
          userId,
        },
      });
      await tx.headset.delete({ where: { id } });
    });
  }

  async updateBulk(ids: number[], data: HeadsetUpdateInput, userId: string) {
    const headsets = await prisma.headset.findMany({
      where: { id: { in: ids } },
      select: { id: true, lacre: true, status: true },
    });

    if (headsets.length === 0) {
      throw new Error('Nenhum headset encontrado para atualizar');
    }

    return prisma.$transaction(async (tx) => {
      await tx.headset.updateMany({
        where: { id: { in: ids } },
        data,
      });

      const historyData = headsets.map(h => ({
        headsetId: h.id,
        itemName: `Headset Lacre ${h.lacre}`,
        oldStatus: h.status,
        newStatus: data.status || h.status,
        observation: data.observacoes || 'Atualização em lote',
        userId,
      }));

      await tx.headsetHistory.createMany({
        data: historyData,
      });

      return { count: headsets.length };
    });
  }

  async getHistory(id: number) {
    return prisma.headsetHistory.findMany({
      where: { headsetId: id },
      include: {
        user: { select: { name: true, matricula: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private validateStatusAndMatricula(status: string, matricula?: string | null) {
    const restrictedStatuses = ['EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];
    if (restrictedStatuses.includes(status) && matricula && matricula.trim() !== '') {
      throw new Error('Equipamentos nestes estados não podem possuir matrícula vinculada.');
    }
  }

  private async validateUniqueness(lacre?: string | null, numeroSerie?: string | null, matricula?: string | null, id?: number) {
    if (lacre) {
      const existingLacre = await prisma.headset.findFirst({
        where: { lacre, NOT: id ? { id } : undefined },
      });
      if (existingLacre) {
        const error: any = new Error('Já existe um headset cadastrado com este lacre');
        error.code = 'P2002';
        throw error;
      }
    }

    if (numeroSerie) {
      const existingSN = await prisma.headset.findFirst({
        where: { numeroSerie, NOT: id ? { id } : undefined },
      });
      if (existingSN) {
        const error: any = new Error('Já existe um headset cadastrado com este número de série');
        error.code = 'P2002';
        throw error;
      }
    }

    if (matricula && matricula.trim() !== '') {
      const existingMatricula = await prisma.headset.findFirst({
        where: { matricula, NOT: id ? { id } : undefined },
      });
      if (existingMatricula) {
        const error: any = new Error('Já existe um headset cadastrado com esta matrícula');
        error.code = 'P2002';
        throw error;
      }
    }
  }
}
