-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "httpCertNotify" BOOLEAN,
ADD COLUMN     "httpCertNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "httpCertNotifySentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_httpCertNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_httpCertNotifyTypesTable_AB_unique" ON "_httpCertNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_httpCertNotifyTypesTable_B_index" ON "_httpCertNotifyTypesTable"("B");

-- AddForeignKey
ALTER TABLE "_httpCertNotifyTypesTable" ADD CONSTRAINT "_httpCertNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_httpCertNotifyTypesTable" ADD CONSTRAINT "_httpCertNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
