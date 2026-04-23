/*
  Warnings:

  - Made the column `lacre` on table `Headset` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Headset" ALTER COLUMN "lacre" SET NOT NULL;

-- CreateTable
CREATE TABLE "Computador" (
    "id" SERIAL NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputerHistory" (
    "id" SERIAL NOT NULL,
    "computadorId" INTEGER NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "oldLocation" TEXT,
    "newLocation" TEXT,
    "observation" VARCHAR(500),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComputerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Computador_patrimonio_key" ON "Computador"("patrimonio");

-- AddForeignKey
ALTER TABLE "ComputerHistory" ADD CONSTRAINT "ComputerHistory_computadorId_fkey" FOREIGN KEY ("computadorId") REFERENCES "Computador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerHistory" ADD CONSTRAINT "ComputerHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
