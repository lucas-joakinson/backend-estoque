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

export class StockService {
  async stockIn(data: StockInInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new Error('Produto não encontrado');
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
          productId: data.productId,
          userId,
          quantity: data.quantity,
          type: MovementType.IN,
          reason: data.reason,
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
        throw new Error('Produto não encontrado');
      }

      if (product.quantity < data.quantity) {
        throw new Error('Estoque insuficiente');
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
          productId: data.productId,
          userId,
          quantity: data.quantity,
          type: MovementType.OUT,
          reason: data.reason,
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
