/*
  Warnings:

  - You are about to drop the column `maximumSize` on the `Drive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "maximumSize",
ALTER COLUMN "inactive" SET DEFAULT false;

-- CreateTable
CREATE TABLE "DriveLogs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "driveId" TEXT NOT NULL,

    CONSTRAINT "DriveLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DriveLogs" ADD CONSTRAINT "DriveLogs_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
