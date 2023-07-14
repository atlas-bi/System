-- AlterTable
ALTER TABLE "Drive" ADD COLUMN     "growthRateNotifySentAt" TIMESTAMP(3),
ADD COLUMN     "missingNotifySentAt" TIMESTAMP(3),
ADD COLUMN     "percFreeNotifySentAt" TIMESTAMP(3),
ADD COLUMN     "sizeFreeNotifySentAt" TIMESTAMP(3);
