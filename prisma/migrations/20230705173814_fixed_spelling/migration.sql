/*
  Warnings:

  - You are about to drop the column `maxiumumSize` on the `Drive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "maxiumumSize",
ADD COLUMN     "maximumSize" TEXT;
