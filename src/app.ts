import fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/product/product.routes';
import { categoryRoutes } from './modules/category/category.routes';
import { stockRoutes } from './modules/stock/stock.routes';
import { userRoutes } from './modules/user/user.routes';
import { ZodError } from 'zod';

export const app = fastify();

app.register(cors, {
  origin: true,
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

// Registro de Rotas
app.register(authRoutes, { prefix: '/auth' });
app.register(userRoutes, { prefix: '/users' });
app.register(productRoutes, { prefix: '/products' });
app.register(categoryRoutes, { prefix: '/categories' });
app.register(stockRoutes, { prefix: '/stock' });

// Handler de Erros Global
app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Erro de validação',
      issues: error.format(),
    });
  }

  if (env.DATABASE_URL.includes('localhost')) {
    console.error(error);
  }

  return reply.status(500).send({ message: 'Internal server error.' });
});
