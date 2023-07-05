/*
  Warnings:

  - The `totalPhysicalMemory` column on the `Server` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[token]` on the table `Server` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Server" DROP COLUMN "totalPhysicalMemory",
ADD COLUMN     "totalPhysicalMemory" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Server_token_key" ON "Server"("token");
