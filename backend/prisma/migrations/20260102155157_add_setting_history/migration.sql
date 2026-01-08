-- CreateTable
CREATE TABLE "SettingHistory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettingHistory_key_idx" ON "SettingHistory"("key");

-- CreateIndex
CREATE INDEX "SettingHistory_createdAt_idx" ON "SettingHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "SettingHistory" ADD CONSTRAINT "SettingHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
