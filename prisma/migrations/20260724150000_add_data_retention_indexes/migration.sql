-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "usageRetentionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "usageRetentionMonths" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorFeeds_createdAt_idx" ON "MonitorFeeds"("createdAt");

-- CreateIndex
CREATE INDEX "CpuUsage_createdAt_idx" ON "CpuUsage"("createdAt");

-- CreateIndex
CREATE INDEX "DatabaseFileUsage_createdAt_idx" ON "DatabaseFileUsage"("createdAt");
