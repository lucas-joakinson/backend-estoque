import { prisma } from '../../shared/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const loginSchema = z.object({
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  async authenticate(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { matricula: data.matricula },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Matrícula ou senha inválidos');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Matrícula ou senha inválidos');
    }

    return {
      id: user.id,
      matricula: user.matricula,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions,
    };
  }
}
