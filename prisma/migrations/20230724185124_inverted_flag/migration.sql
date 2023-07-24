/*
  Warnings:

  - You are about to drop the column `inactive` on the `Drive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "inactive",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;
