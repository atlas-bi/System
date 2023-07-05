/*
  Warnings:

  - You are about to drop the column `title` on the `Drive` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `Drive` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "title",
ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Drive_name_key" ON "Drive"("name");
