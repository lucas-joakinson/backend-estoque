-- DropForeignKey
ALTER TABLE "AssetHistory" DROP CONSTRAINT "AssetHistory_assetId_fkey";

-- DropForeignKey
ALTER TABLE "ComputerHistory" DROP CONSTRAINT "ComputerHistory_computadorId_fkey";

-- DropForeignKey
ALTER TABLE "HeadsetHistory" DROP CONSTRAINT "HeadsetHistory_headsetId_fkey";

-- AlterTable
ALTER TABLE "AssetHistory" ADD COLUMN     "itemName" TEXT,
ALTER COLUMN "assetId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ComputerHistory" ADD COLUMN     "itemName" TEXT,
ALTER COLUMN "computadorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HeadsetHistory" ADD COLUMN     "itemName" TEXT,
ALTER COLUMN "headsetId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CategoryHistory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "itemName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "itemName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHistory" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT,
    "itemName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategoryHistory" ADD CONSTRAINT "CategoryHistory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryHistory" ADD CONSTRAINT "CategoryHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHistory" ADD CONSTRAINT "ProductHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHistory" ADD CONSTRAINT "ProductHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetHistory" ADD CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadsetHistory" ADD CONSTRAINT "HeadsetHistory_headsetId_fkey" FOREIGN KEY ("headsetId") REFERENCES "Headset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerHistory" ADD CONSTRAINT "ComputerHistory_computadorId_fkey" FOREIGN KEY ("computadorId") REFERENCES "Computador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
