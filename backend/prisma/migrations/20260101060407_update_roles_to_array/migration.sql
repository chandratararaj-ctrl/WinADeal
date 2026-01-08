/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CASH');

-- CreateEnum
CREATE TYPE "PayoutCycleType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayoutCycleStatus" AS ENUM ('ACTIVE', 'CLOSED', 'PROCESSING', 'COMPLETED');

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "partnerEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DeliveryPartner" ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vendorEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "roles" "UserRole"[];

-- CreateTable
CREATE TABLE "PayoutCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycleType" "PayoutCycleType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayoutCycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalPayouts" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "deliveryPartnerId" TEXT,
    "payoutCycleId" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PayoutMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "transactionRef" TEXT,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionHistory" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldRate" DOUBLE PRECISION NOT NULL,
    "newRate" DOUBLE PRECISION NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayoutCycle_status_idx" ON "PayoutCycle"("status");

-- CreateIndex
CREATE INDEX "PayoutCycle_startDate_idx" ON "PayoutCycle"("startDate");

-- CreateIndex
CREATE INDEX "PayoutCycle_endDate_idx" ON "PayoutCycle"("endDate");

-- CreateIndex
CREATE INDEX "Payout_shopId_idx" ON "Payout"("shopId");

-- CreateIndex
CREATE INDEX "Payout_deliveryPartnerId_idx" ON "Payout"("deliveryPartnerId");

-- CreateIndex
CREATE INDEX "Payout_payoutCycleId_idx" ON "Payout"("payoutCycleId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "CommissionHistory_entityType_entityId_idx" ON "CommissionHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CommissionHistory_createdAt_idx" ON "CommissionHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "DeliveryPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payoutCycleId_fkey" FOREIGN KEY ("payoutCycleId") REFERENCES "PayoutCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
