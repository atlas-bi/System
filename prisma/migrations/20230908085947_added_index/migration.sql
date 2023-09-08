-- CreateIndex
CREATE INDEX "DatabaseFileUsage_databaseFileId_createdAt_idx" ON "DatabaseFileUsage"("databaseFileId", "createdAt");

-- CreateIndex
CREATE INDEX "DatabaseUsage_databaseId_createdAt_idx" ON "DatabaseUsage"("databaseId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveUsage_driveId_createdAt_idx" ON "DriveUsage"("driveId", "createdAt");

-- CreateIndex
CREATE INDEX "DriveUsage_driveId_id_idx" ON "DriveUsage"("driveId", "id");

-- CreateIndex
CREATE INDEX "MonitorFeeds_monitorId_createdAt_idx" ON "MonitorFeeds"("monitorId", "createdAt");
