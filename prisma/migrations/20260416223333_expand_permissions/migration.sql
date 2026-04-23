-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "canDeleteComputers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canDeleteHeadsets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canExportData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageComputers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageHeadsets" BOOLEAN NOT NULL DEFAULT false;
