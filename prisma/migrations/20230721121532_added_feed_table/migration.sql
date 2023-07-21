-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "cpuCores" TEXT,
ADD COLUMN     "cpuManufacturer" TEXT,
ADD COLUMN     "cpuMaxSpeed" TEXT,
ADD COLUMN     "cpuModel" TEXT,
ADD COLUMN     "cpuProcessors" TEXT;

-- CreateTable
CREATE TABLE "MonitorFeeds" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "memoryFree" TEXT,
    "memoryTotal" TEXT,
    "cpuLoad" TEXT,
    "cpuSpeed" TEXT,

    CONSTRAINT "MonitorFeeds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonitorFeeds" ADD CONSTRAINT "MonitorFeeds_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
