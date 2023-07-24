/*
  Warnings:

  - You are about to drop the column `description` on the `Drive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "description",
ADD COLUMN     "systemDescription" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "description" TEXT;
