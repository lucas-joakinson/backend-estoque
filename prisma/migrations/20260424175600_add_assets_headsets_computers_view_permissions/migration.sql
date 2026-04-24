-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "canViewAssets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewComputers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewHeadsets" BOOLEAN NOT NULL DEFAULT false;
