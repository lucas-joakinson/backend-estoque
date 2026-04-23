-- AlterTable
ALTER TABLE "Headset" ALTER COLUMN "lacre" DROP NOT NULL,
ALTER COLUMN "numeroSerie" DROP NOT NULL;

-- CreateTable
CREATE TABLE "HeadsetHistory" (
    "id" SERIAL NOT NULL,
    "headsetId" INTEGER NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "oldLocation" TEXT,
    "newLocation" TEXT,
    "observation" VARCHAR(500),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeadsetHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HeadsetHistory" ADD CONSTRAINT "HeadsetHistory_headsetId_fkey" FOREIGN KEY ("headsetId") REFERENCES "Headset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadsetHistory" ADD CONSTRAINT "HeadsetHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
