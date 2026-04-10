import { prisma } from '../../shared/db/prisma';
import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const stockInSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  reason: z.string().optional(),
});

export const stockOutSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  reason: z.string().optional(),
});

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;

export const updateMovementSchema = z.object({
  reason: z.string().min(1, 'O motivo não pode ser vazio'),
});

export type UpdateMovementInput = z.infer<typeof updateMovementSchema>;

export class StockService {
  async updateMovementReason(id: string, data: UpdateMovementInput) {
    const movement = await prisma.stockMovement.findUnique({
      where: { id },
    });

    if (!movement) {
      throw new Error('Movimentação não encontrada');
    }

    return prisma.stockMovement.update({
      where: { id },
      data: {
        reason: data.reason,
      },
    });
  }

  async stockIn(data: StockInInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error(`Produto com id '${data.productId}' não encontrado.`);
      }

      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: {
          quantity: {
            increment: data.quantity,
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          quantity: data.quantity,
          type: MovementType.IN,
          reason: data.reason,
          product: { connect: { id: data.productId } },
          user: { connect: { id: userId } },
        },
      });

      return { updatedProduct, movement };
    });
  }

  async stockOut(data: StockOutInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error(`Produto com id '${data.productId}' não encontrado.`);
      }

      if (product.quantity < data.quantity) {
        throw new Error(
          `Estoque insuficiente. Disponível: ${product.quantity}, solicitado: ${data.quantity}.`
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          quantity: data.quantity,
          type: MovementType.OUT,
          reason: data.reason,
          product: { connect: { id: data.productId } },
          user: { connect: { id: userId } },
        },
      });

      return { updatedProduct, movement };
    });
  }

  async getMovements() {
    return prisma.stockMovement.findMany({
      include: {
        product: {
          select: { name: true, sku: true }
        },
        user: {
          select: { matricula: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
