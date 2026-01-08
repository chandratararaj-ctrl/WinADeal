/*
  Warnings:

  - You are about to drop the column `rating` on the `Review` table. All the data in the column will be lost.
  - Added the required column `overallRating` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "estimatedDeliveryAt" TIMESTAMP(3),
ADD COLUMN     "etaMinutes" INTEGER,
ADD COLUMN     "isTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "routePolyline" TEXT,
ADD COLUMN     "trackingStartedAt" TIMESTAMP(3),
ADD COLUMN     "verificationCode" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "rating",
ADD COLUMN     "deliveryRating" INTEGER,
ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overallRating" INTEGER NOT NULL,
ADD COLUMN     "productRating" INTEGER,
ADD COLUMN     "shopRating" INTEGER,
ADD COLUMN     "vendorResponse" TEXT,
ADD COLUMN     "vendorResponseAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryLocation_deliveryId_idx" ON "DeliveryLocation"("deliveryId");

-- CreateIndex
CREATE INDEX "DeliveryLocation_timestamp_idx" ON "DeliveryLocation"("timestamp");

-- CreateIndex
CREATE INDEX "Delivery_isTracking_idx" ON "Delivery"("isTracking");

-- CreateIndex
CREATE INDEX "Review_isApproved_idx" ON "Review"("isApproved");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- AddForeignKey
ALTER TABLE "DeliveryLocation" ADD CONSTRAINT "DeliveryLocation_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
