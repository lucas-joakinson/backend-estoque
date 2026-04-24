-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "canViewNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewPermissions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewUsers" BOOLEAN NOT NULL DEFAULT false;
