/*
  Warnings:

  - You are about to drop the column `size` on the `DatabaseFileUsage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DatabaseFileUsage" DROP COLUMN "size",
ADD COLUMN     "currentSize" TEXT,
ADD COLUMN     "usedSize" TEXT;
