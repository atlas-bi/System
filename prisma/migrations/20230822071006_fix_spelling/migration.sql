/*
  Warnings:

  - You are about to drop the column `connectionNotifyRetires` on the `Monitor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "connectionNotifyRetires",
ADD COLUMN     "connectionNotifyRetries" INTEGER;
