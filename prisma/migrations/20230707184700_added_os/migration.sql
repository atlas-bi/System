/*
  Warnings:

  - You are about to drop the column `serverName` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `systemFamily` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `systemSkuNumber` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `systemType` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `totalPhysicalMemory` on the `Server` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Server" DROP COLUMN "serverName",
DROP COLUMN "systemFamily",
DROP COLUMN "systemSkuNumber",
DROP COLUMN "systemType",
DROP COLUMN "totalPhysicalMemory",
ADD COLUMN     "os" TEXT,
ADD COLUMN     "osVersion" TEXT;
