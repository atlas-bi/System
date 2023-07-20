-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "connectionNotify" BOOLEAN,
ADD COLUMN     "connectionNotifyResendAfterMinutes" INTEGER,
ADD COLUMN     "connectionNotifySentAt" TIMESTAMP(3),
ADD COLUMN     "rebootNotify" BOOLEAN;

-- CreateTable
CREATE TABLE "_connectionNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_rebootNotifyTypesTable" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_connectionNotifyTypesTable_AB_unique" ON "_connectionNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_connectionNotifyTypesTable_B_index" ON "_connectionNotifyTypesTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_rebootNotifyTypesTable_AB_unique" ON "_rebootNotifyTypesTable"("A", "B");

-- CreateIndex
CREATE INDEX "_rebootNotifyTypesTable_B_index" ON "_rebootNotifyTypesTable"("B");

-- AddForeignKey
ALTER TABLE "_connectionNotifyTypesTable" ADD CONSTRAINT "_connectionNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_connectionNotifyTypesTable" ADD CONSTRAINT "_connectionNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_rebootNotifyTypesTable" ADD CONSTRAINT "_rebootNotifyTypesTable_A_fkey" FOREIGN KEY ("A") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_rebootNotifyTypesTable" ADD CONSTRAINT "_rebootNotifyTypesTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
