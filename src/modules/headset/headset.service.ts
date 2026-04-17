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
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type HeadsetInput = z.infer<typeof headsetSchema>;
export type HeadsetUpdateInput = Partial<HeadsetInput>;
export type HeadsetQueryInput = z.infer<typeof headsetQuerySchema>;

export class HeadsetService {
  async findAll(query: HeadsetQueryInput) {
    const { page, limit, search, status } = query;
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
        orderBy: { createdAt: 'desc' },
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
    await this.validateUniqueness(data.lacre, data.numeroSerie);

    return prisma.$transaction(async (tx) => {
      const headset = await tx.headset.create({
        data,
      });

      await tx.headsetHistory.create({
        data: {
          headsetId: headset.id,
          newStatus: headset.status,
          observation: 'Criação inicial',
          userId,
        },
      });

      return headset;
    });
  }

  async createBulk(data: HeadsetInput[], userId: string) {
    // Validação de duplicidade no lote
    const lacres = data.map(h => h.lacre).filter(Boolean) as string[];
    if (new Set(lacres).size !== lacres.length) {
      throw new Error('O lote contém lacres duplicados');
    }

    const series = data.map(h => h.numeroSerie).filter(Boolean) as string[];
    if (new Set(series).size !== series.length) {
      throw new Error('O lote contém números de série duplicados');
    }

    // Validação de duplicidade no banco
    const existingLacre = await prisma.headset.findFirst({
      where: { lacre: { in: lacres } },
    });
    if (existingLacre) throw new Error(`Lacre ${existingLacre.lacre} já existe no sistema`);

    const existingSerie = await prisma.headset.findFirst({
      where: { numeroSerie: { in: series } },
    });
    if (existingSerie) throw new Error(`Série ${existingSerie.numeroSerie} já existe no sistema`);

    return prisma.$transaction(async (tx) => {
      const results = await Promise.all(data.map(async (h) => {
        const normalizedData = {
          ...h,
          matricula: h.matricula?.trim() || null,
          lacre: h.lacre!.trim(),
          marca: h.marca.trim(),
          numeroSerie: h.numeroSerie?.trim() || null,
          status: (h.status.toUpperCase().trim().replace(/\s+/g, '_') as any),
        };

        const headset = await tx.headset.create({ data: normalizedData });
        await tx.headsetHistory.create({
          data: {
            headsetId: headset.id,
            newStatus: headset.status,
            observation: 'Criação inicial (Importação Excel)',
            userId,
          },
        });
        return headset;
      }));

      return { count: results.length };
    });
  }

  async update(id: number, data: HeadsetUpdateInput, userId: string) {
    const headset = await prisma.headset.findUnique({
      where: { id },
    });

    if (!headset) {
      throw new Error('Headset não encontrado');
    }

    if (data.lacre || data.numeroSerie) {
      await this.validateUniqueness(data.lacre, data.numeroSerie, id);
    }

    // Lógica de desvinculação automática de matrícula para certos status
    const unlinkingStatuses = ['EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL'];
    const isUnlinkingStatus = data.status && unlinkingStatuses.includes(data.status);
    
    const finalData = { ...data };
    
    if (isUnlinkingStatus && !data.matricula) {
      finalData.matricula = null;
    }

    // NOVA REGRA: Ao adicionar uma matrícula, força o status para EM_USO
    const isLinkingMatricula = data.matricula && data.matricula.trim() !== '' && (!headset.matricula);
    if (isLinkingMatricula && data.status !== 'EM_USO') {
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

  async delete(id: number) {
    const headset = await prisma.headset.findUnique({
      where: { id },
    });

    if (!headset) {
      throw new Error('Headset não encontrado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.headsetHistory.deleteMany({ where: { headsetId: id } });
      await tx.headset.delete({ where: { id } });
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

  private async validateUniqueness(lacre?: string | null, numeroSerie?: string | null, id?: number) {
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
  }
}
