-- AlterTable
ALTER TABLE "MonitorLogs" ADD COLUMN     "databaseId" TEXT;

-- CreateTable
CREATE TABLE "Database" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "hasError" BOOLEAN NOT NULL DEFAULT false,
    "monitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "databaseId" TEXT,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "recoveryModel" TEXT,
    "compatLevel" TEXT,
    "backupDataDate" TEXT,
    "backupDataSize" TEXT,
    "backupLogDate" TEXT,
    "backupLogSize" TEXT,

    CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseUsage" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasError" BOOLEAN NOT NULL DEFAULT false,
    "memory" TEXT,

    CONSTRAINT "DatabaseUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Database_monitorId_name_key" ON "Database"("monitorId", "name");

-- AddForeignKey
ALTER TABLE "MonitorLogs" ADD CONSTRAINT "MonitorLogs_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Database" ADD CONSTRAINT "Database_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseUsage" ADD CONSTRAINT "DatabaseUsage_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
