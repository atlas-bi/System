/*
  Warnings:

  - Added the required column `token` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "token" TEXT NOT NULL;
