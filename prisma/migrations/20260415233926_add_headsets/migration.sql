-- CreateTable
CREATE TABLE "Headset" (
    "id" SERIAL NOT NULL,
    "matricula" TEXT NOT NULL,
    "lacre" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Headset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Headset_lacre_key" ON "Headset"("lacre");

-- CreateIndex
CREATE UNIQUE INDEX "Headset_numeroSerie_key" ON "Headset"("numeroSerie");
