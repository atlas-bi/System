/*
  Warnings:

  - You are about to drop the `Nofication` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_growthRateNotifyTypesTable" DROP CONSTRAINT "_growthRateNotifyTypesTable_B_fkey";

-- DropForeignKey
ALTER TABLE "_missingNotifyTypesTable" DROP CONSTRAINT "_missingNotifyTypesTable_B_fkey";

-- DropForeignKey
ALTER TABLE "_percFreeNotifyTypesTable" DROP CONSTRAINT "_percFreeNotifyTypesTable_B_fkey";

-- DropForeignKey
ALTER TABLE "_sizeFreeNotifyTypesTable" DROP CONSTRAINT "_sizeFreeNotifyTypesTable_B_fkey";

-- DropTable
DROP TABLE "Nofication";

-- CreateTable
CREATE TABLE "Notification" (
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

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "_missingNotifyTypesTable" ADD CONSTRAINT "_missingNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_percFreeNotifyTypesTable" ADD CONSTRAINT "_percFreeNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sizeFreeNotifyTypesTable" ADD CONSTRAINT "_sizeFreeNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_growthRateNotifyTypesTable" ADD CONSTRAINT "_growthRateNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
