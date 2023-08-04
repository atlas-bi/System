-- CreateTable
CREATE TABLE "Cpu" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "load" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monitorId" TEXT,

    CONSTRAINT "Cpu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cpu" ADD CONSTRAINT "Cpu_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
