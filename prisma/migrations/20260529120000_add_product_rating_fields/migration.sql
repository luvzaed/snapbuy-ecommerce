-- AlterTable: add denormalised rating cache columns to Product
-- rating      — nullable average (null = no reviews yet)
-- reviewCount — total review count, defaults to 0 for existing rows
ALTER TABLE "Product" ADD COLUMN "rating" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
