/*
  Warnings:

  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DISPONIVEL', 'EM_USO', 'EM_MANUTENCAO', 'DEFEITO', 'DESCARTADO');

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_userId_fkey";

-- DropIndex
DROP INDEX "Product_sku_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "quantity",
DROP COLUMN "sku",
ADD COLUMN     "brand" TEXT;

-- DropTable
DROP TABLE "StockMovement";

-- DropEnum
DROP TYPE "MovementType";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "location" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "oldStatus" "AssetStatus",
    "newStatus" "AssetStatus" NOT NULL,
    "oldLocation" TEXT,
    "newLocation" TEXT,
    "observation" VARCHAR(500),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_patrimonio_key" ON "Asset"("patrimonio");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
