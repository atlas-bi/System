/*
  Warnings:

  - You are about to drop the column `serverId` on the `Drive` table. All the data in the column will be lost.
  - You are about to drop the `Server` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerLogs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[monitorId,name]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `monitorId` to the `Drive` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Drive" DROP CONSTRAINT "Drive_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerLogs" DROP CONSTRAINT "ServerLogs_serverId_fkey";

-- DropIndex
DROP INDEX "Drive_serverId_name_key";

-- AlterTable
ALTER TABLE "Drive" DROP COLUMN "serverId",
ADD COLUMN     "growthRateNotify" BOOLEAN,
ADD COLUMN     "growthRateNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "hasError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "missingNotify" BOOLEAN,
ADD COLUMN     "missingNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "monitorId" TEXT NOT NULL,
ADD COLUMN     "percFreeNotify" BOOLEAN,
ADD COLUMN     "percFreeNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "sizeFreeNotify" BOOLEAN,
ADD COLUMN     "sizeFreeNotifyResendAfterMinutes" INTEGER;

-- DropTable
DROP TABLE "Server";

-- DropTable
DROP TABLE "ServerLogs";

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "hasError" BOOLEAN NOT NULL DEFAULT false,
    "host" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "port" TEXT NOT NULL,
    "privateKey" TEXT,
    "caption" TEXT,
    "name" TEXT,
    "dnsHostName" TEXT,
    "domain" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorLogs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "MonitorLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nofication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "smtpPort" TEXT,
    "smtpUsername" TEXT,
    "smtpHost" TEXT,
    "smtpPassword" TEXT,
    "smtpSecurity" TEXT,
    "ignoreSSLErrors" BOOLEAN,
    "smtpFromName" TEXT,
    "smtpFromEmail" TEXT,
    "smtpToEmail" TEXT,
    "tgBotToken" TEXT,
    "tgChatId" TEXT,
    "tgThreadId" TEXT,
    "tgSendSilently" BOOLEAN,
    "tgProtectMessage" BOOLEAN,

    CONSTRAINT "Nofication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_missingNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_percFreeNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_sizeFreeNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_growthRateNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_missingNotifyTypesTable_AB_unique" ON "_missingNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_missingNotifyTypesTable_B_index" ON "_missingNotifyTypesTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_percFreeNotifyTypesTable_AB_unique" ON "_percFreeNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_percFreeNotifyTypesTable_B_index" ON "_percFreeNotifyTypesTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_sizeFreeNotifyTypesTable_AB_unique" ON "_sizeFreeNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_sizeFreeNotifyTypesTable_B_index" ON "_sizeFreeNotifyTypesTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_growthRateNotifyTypesTable_AB_unique" ON "_growthRateNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_growthRateNotifyTypesTable_B_index" ON "_growthRateNotifyTypesTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Drive_monitorId_name_key" ON "Drive"("monitorId", "name");

-- AddForeignKey
ALTER TABLE "MonitorLogs" ADD CONSTRAINT "MonitorLogs_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_missingNotifyTypesTable" ADD CONSTRAINT "_missingNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_missingNotifyTypesTable" ADD CONSTRAINT "_missingNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Nofication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_percFreeNotifyTypesTable" ADD CONSTRAINT "_percFreeNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_percFreeNotifyTypesTable" ADD CONSTRAINT "_percFreeNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Nofication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sizeFreeNotifyTypesTable" ADD CONSTRAINT "_sizeFreeNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sizeFreeNotifyTypesTable" ADD CONSTRAINT "_sizeFreeNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Nofication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_growthRateNotifyTypesTable" ADD CONSTRAINT "_growthRateNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_growthRateNotifyTypesTable" ADD CONSTRAINT "_growthRateNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Nofication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
