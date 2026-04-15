import { FastifyReply, FastifyRequest } from 'fastify';
import { PermissionService, updatePermissionsSchema, createRoleSchema } from './permission.service';
import { z } from 'zod';

const paramsSchema = z.object({
  role: z.string(),
});

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  async listAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const roles = await this.permissionService.listAllRoles();
      return reply.status(200).send(roles);
    } catch (error: any) {
      return reply.status(500).send({ message: error.message });
    }
  }

  async getByRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { role } = paramsSchema.parse(request.params);
      const roleData = await this.permissionService.getRolePermissions(role);
      return reply.status(200).send(roleData);
    } catch (error: any) {
      return reply.status(404).send({ message: error.message });
    }
  }

  async updateRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { role } = paramsSchema.parse(request.params);
      const data = updatePermissionsSchema.parse(request.body);
      const updatedPermissions = await this.permissionService.updateRolePermissions(role, data);
      return reply.status(200).send(updatedPermissions);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }

  async createRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createRoleSchema.parse(request.body);
      const newRole = await this.permissionService.createRole(data);
      return reply.status(201).send(newRole);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message });
    }
  }
}
