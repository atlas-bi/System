-- CreateTable
CREATE TABLE "DatabaseFile" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sqlDatabaseId" TEXT NOT NULL,
    "fileName" TEXT,
    "type" TEXT,
    "state" TEXT,
    "growth" TEXT,
    "isPercentGrowth" TEXT,
    "fileId" TEXT NOT NULL,
    "filePath" TEXT,

    CONSTRAINT "DatabaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseFileUsage" (
    "id" TEXT NOT NULL,
    "databaseFileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasError" BOOLEAN NOT NULL DEFAULT false,
    "size" TEXT,
    "maxSize" TEXT,

    CONSTRAINT "DatabaseFileUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseFile_databaseId_sqlDatabaseId_fileId_key" ON "DatabaseFile"("databaseId", "sqlDatabaseId", "fileId");

-- AddForeignKey
ALTER TABLE "DatabaseFile" ADD CONSTRAINT "DatabaseFile_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseFileUsage" ADD CONSTRAINT "DatabaseFileUsage_databaseFileId_fkey" FOREIGN KEY ("databaseFileId") REFERENCES "DatabaseFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
