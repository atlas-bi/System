/*
  Warnings:

  - You are about to drop the `DriveLogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DriveLogs" DROP CONSTRAINT "DriveLogs_driveId_fkey";

-- AlterTable
ALTER TABLE "MonitorLogs" ADD COLUMN     "driveId" TEXT;

-- DropTable
DROP TABLE "DriveLogs";

-- AddForeignKey
ALTER TABLE "MonitorLogs" ADD CONSTRAINT "MonitorLogs_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
