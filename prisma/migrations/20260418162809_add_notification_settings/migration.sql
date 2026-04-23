-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "canManageNotifications" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "min_headsets_disponiveis" INTEGER NOT NULL DEFAULT 10,
    "max_headsets_defeito" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);
