-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "sqlFileSizePercentFreeNotify" BOOLEAN,
ADD COLUMN     "sqlFileSizePercentFreeNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "sqlFileSizePercentFreeNotifySentAt" TIMESTAMP(3),
ADD COLUMN     "sqlFileSizePercentFreeValue" INTEGER;

-- CreateTable
CREATE TABLE "_sqlFileSizePercentFreeNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_sqlFileSizePercentFreeNotifyTypesTable_AB_unique" ON "_sqlFileSizePercentFreeNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_sqlFileSizePercentFreeNotifyTypesTable_B_index" ON "_sqlFileSizePercentFreeNotifyTypesTable"("B");

-- AddForeignKey
ALTER TABLE "_sqlFileSizePercentFreeNotifyTypesTable" ADD CONSTRAINT "_sqlFileSizePercentFreeNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sqlFileSizePercentFreeNotifyTypesTable" ADD CONSTRAINT "_sqlFileSizePercentFreeNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
