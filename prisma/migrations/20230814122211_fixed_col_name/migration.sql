/*
  Warnings:

  - You are about to drop the column `httpMethod` on the `Monitor` table. All the data in the column will be lost.
  - The `httpAcceptedStatusCodes` column on the `Monitor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "httpMethod",
ADD COLUMN     "httpRequestMethod" TEXT,
ALTER COLUMN "host" DROP NOT NULL,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "port" DROP NOT NULL,
DROP COLUMN "httpAcceptedStatusCodes",
ADD COLUMN     "httpAcceptedStatusCodes" TEXT[];
