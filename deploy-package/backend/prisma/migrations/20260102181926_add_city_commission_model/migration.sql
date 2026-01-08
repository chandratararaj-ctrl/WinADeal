-- CreateTable
CREATE TABLE "CityCommission" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "vendorCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "deliveryCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "minOrderAmount" DOUBLE PRECISION,
    "baseDeliveryFee" DOUBLE PRECISION,
    "perKmDeliveryFee" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityCommission_city_key" ON "CityCommission"("city");

-- CreateIndex
CREATE INDEX "CityCommission_city_idx" ON "CityCommission"("city");

-- CreateIndex
CREATE INDEX "CityCommission_isActive_idx" ON "CityCommission"("isActive");
