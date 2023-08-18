/*
  Warnings:

  - A unique constraint covering the columns `[monitorId,databaseId]` on the table `Database` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Database_monitorId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Database_monitorId_databaseId_key" ON "Database"("monitorId", "databaseId");
