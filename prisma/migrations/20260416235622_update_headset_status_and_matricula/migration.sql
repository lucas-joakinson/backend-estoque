-- CreateEnum
CREATE TYPE "HeadsetStatus" AS ENUM ('EM_USO', 'RESERVA', 'TROCA_PENDENTE', 'EM_MANUTENCAO', 'DEFEITO', 'DISPONIVEL');

-- Update existing data to match enum values
UPDATE "Headset" SET "status" = 'EM_USO' WHERE "status" = 'EM USO';
UPDATE "Headset" SET "status" = 'TROCA_PENDENTE' WHERE "status" = 'TROCA PENDENTE';
UPDATE "Headset" SET "status" = 'DISPONIVEL' WHERE "status" = 'DESLIGADO';

UPDATE "HeadsetHistory" SET "oldStatus" = 'EM_USO' WHERE "oldStatus" = 'EM USO';
UPDATE "HeadsetHistory" SET "oldStatus" = 'TROCA_PENDENTE' WHERE "oldStatus" = 'TROCA PENDENTE';
UPDATE "HeadsetHistory" SET "oldStatus" = 'DISPONIVEL' WHERE "oldStatus" = 'DESLIGADO';

UPDATE "HeadsetHistory" SET "newStatus" = 'EM_USO' WHERE "newStatus" = 'EM USO';
UPDATE "HeadsetHistory" SET "newStatus" = 'TROCA_PENDENTE' WHERE "newStatus" = 'TROCA PENDENTE';
UPDATE "HeadsetHistory" SET "newStatus" = 'DISPONIVEL' WHERE "newStatus" = 'DESLIGADO';

-- AlterTable Headset
ALTER TABLE "Headset" ALTER COLUMN "matricula" DROP NOT NULL;
ALTER TABLE "Headset" ALTER COLUMN "status" TYPE "HeadsetStatus" USING "status"::"HeadsetStatus";

-- AlterTable HeadsetHistory
ALTER TABLE "HeadsetHistory" ALTER COLUMN "oldStatus" TYPE "HeadsetStatus" USING "oldStatus"::"HeadsetStatus";
ALTER TABLE "HeadsetHistory" ALTER COLUMN "newStatus" TYPE "HeadsetStatus" USING "newStatus"::"HeadsetStatus";
