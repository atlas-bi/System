/*
  Warnings:

  - A unique constraint covering the columns `[monitorId,sqlDatabaseId,fileId]` on the table `DatabaseFile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `monitorId` to the `DatabaseFile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DatabaseFile_databaseId_sqlDatabaseId_fileId_key";

-- AlterTable
ALTER TABLE "DatabaseFile" ADD COLUMN     "monitorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseFile_monitorId_sqlDatabaseId_fileId_key" ON "DatabaseFile"("monitorId", "sqlDatabaseId", "fileId");

-- AddForeignKey
ALTER TABLE "DatabaseFile" ADD CONSTRAINT "DatabaseFile_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
