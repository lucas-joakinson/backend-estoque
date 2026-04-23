/*
  Warnings:

  - A unique constraint covering the columns `[matricula]` on the table `Headset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Headset_matricula_key" ON "Headset"("matricula");
