-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "openingTime" TEXT,
ADD COLUMN     "rejectionReason" TEXT;
