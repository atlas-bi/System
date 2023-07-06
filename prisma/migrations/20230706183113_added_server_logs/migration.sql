-- CreateTable
CREATE TABLE "ServerLogs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" TEXT NOT NULL,

    CONSTRAINT "ServerLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServerLogs" ADD CONSTRAINT "ServerLogs_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
