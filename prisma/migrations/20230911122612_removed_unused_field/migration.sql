/*
  Warnings:

  - You are about to drop the column `daysTillFull` on the `Drive` table. All the data in the column will be lost.
  - You are about to drop the column `growthRate` on the `Drive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "daysTillFull",
DROP COLUMN "growthRate";
