-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('GRAM', 'KILOGRAM');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "gstEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "flavor" TEXT,
ADD COLUMN     "isEggless" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weightUnit" "WeightUnit",
ADD COLUMN     "weightValue" DECIMAL(6,2);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "checkInDate" TIMESTAMP(3),
ADD COLUMN     "checkOutDate" TIMESTAMP(3),
ADD COLUMN     "guestCount" INTEGER;

