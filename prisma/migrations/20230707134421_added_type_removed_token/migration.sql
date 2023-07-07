/*
  Warnings:

  - You are about to drop the column `token` on the `Server` table. All the data in the column will be lost.
  - Added the required column `type` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Server_token_key";

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "token",
ADD COLUMN     "type" TEXT NOT NULL;
