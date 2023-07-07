/*
  Warnings:

  - A unique constraint covering the columns `[serverId,name]` on the table `Drive` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Drive_serverId_name_key" ON "Drive"("serverId", "name");
