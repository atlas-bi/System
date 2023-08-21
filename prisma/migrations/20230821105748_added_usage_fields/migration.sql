-- AlterTable
ALTER TABLE "Database" ADD COLUMN     "online" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "DatabaseFile" ADD COLUMN     "daysTillFull" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "growthRate" TEXT,
ADD COLUMN     "online" BOOLEAN NOT NULL DEFAULT true;
