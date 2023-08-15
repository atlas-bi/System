-- AlterTable
ALTER TABLE "DriveUsage" ADD COLUMN     "hasError" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MonitorFeeds" ADD COLUMN     "hasError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ping" TEXT;
