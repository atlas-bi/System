-- CreateIndex
CREATE INDEX "CpuUsage_cpuId_createdAt_idx" ON "CpuUsage"("cpuId", "createdAt");

-- CreateIndex
CREATE INDEX "MonitorLogs_monitorId_createdAt_idx" ON "MonitorLogs"("monitorId", "createdAt");
