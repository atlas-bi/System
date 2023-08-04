/*
  Warnings:

  - You are about to drop the column `load` on the `Cpu` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Cpu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cpu" DROP COLUMN "load",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CpuUsage" (
    "id" TEXT NOT NULL,
    "cpuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "load" TEXT,

    CONSTRAINT "CpuUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CpuUsage" ADD CONSTRAINT "CpuUsage_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "Cpu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
