/*
  Warnings:

  - Added the required column `host` to the `Server` table without a default value. This is not possible if the table is not empty.
  - Added the required column `port` to the `Server` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "host" TEXT NOT NULL,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "port" TEXT NOT NULL,
ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;
