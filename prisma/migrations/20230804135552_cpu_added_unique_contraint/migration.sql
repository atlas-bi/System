/*
  Warnings:

  - A unique constraint covering the columns `[monitorId,title]` on the table `Cpu` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Cpu_monitorId_title_key" ON "Cpu"("monitorId", "title");
