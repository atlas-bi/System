-- AlterTable
ALTER TABLE "MonitorLogs" ADD COLUMN     "fileId" TEXT;

-- AddForeignKey
ALTER TABLE "MonitorLogs" ADD CONSTRAINT "MonitorLogs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "DatabaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
