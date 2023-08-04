/*
  Warnings:

  - Made the column `title` on table `Cpu` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cpu" ALTER COLUMN "title" SET NOT NULL;
