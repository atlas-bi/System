/*
  Warnings:

  - You are about to drop the column `sqlFileSizePercentFreeNotifySentAt` on the `Monitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DatabaseFile" ADD COLUMN     "sqlFileSizePercentFreeNotifySentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "sqlFileSizePercentFreeNotifySentAt";
