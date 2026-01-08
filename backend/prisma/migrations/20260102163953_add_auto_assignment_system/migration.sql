-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'TIMED_OUT', 'EXPIRED');

-- AlterTable
ALTER TABLE "DeliveryPartner" ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "rejectionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DeliveryRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryPartnerId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "isExclusive" BOOLEAN NOT NULL DEFAULT true,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "penaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryRequest_orderId_idx" ON "DeliveryRequest"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_deliveryPartnerId_idx" ON "DeliveryRequest"("deliveryPartnerId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_status_idx" ON "DeliveryRequest"("status");

-- CreateIndex
CREATE INDEX "DeliveryRequest_expiresAt_idx" ON "DeliveryRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "DeliveryRequest_createdAt_idx" ON "DeliveryRequest"("createdAt");

-- CreateIndex
CREATE INDEX "DeliveryPartner_currentLatitude_currentLongitude_idx" ON "DeliveryPartner"("currentLatitude", "currentLongitude");

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "DeliveryPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
