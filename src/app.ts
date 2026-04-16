import fastify from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import path from 'path';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/product/product.routes';
import { categoryRoutes } from './modules/category/category.routes';
import { assetRoutes } from './modules/asset/asset.routes';
import { userRoutes } from './modules/user/user.routes';
import { permissionRoutes } from './modules/permission/permission.routes';
import { headsetRoutes } from './modules/headset/headset.routes';
import { computerRoutes } from './modules/computer/computer.routes';
import { ZodError } from 'zod';

export const app = fastify();

app.register(cors, {
  origin: true,
});

app.register(jwt, {
  secret: env.JWT_SECRET,
});

app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

app.register(staticPlugin, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
});

// Rota de Status / Health Check
app.get('/', async () => {
  return { status: 'Backend Gerenciador de Ativos Online 🚀' };
});

// Registro de Rotas
app.register(authRoutes, { prefix: '/auth' });
app.register(userRoutes, { prefix: '/users' });
app.register(permissionRoutes, { prefix: '/permissions' });
app.register(headsetRoutes, { prefix: '/headsets' });
app.register(computerRoutes, { prefix: '/computadores' });
app.register(productRoutes, { prefix: '/products' });
app.register(categoryRoutes, { prefix: '/categories' });
app.register(assetRoutes, { prefix: '/assets' });

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
