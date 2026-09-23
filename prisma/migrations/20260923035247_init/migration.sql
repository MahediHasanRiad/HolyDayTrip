/*
  Warnings:

  - You are about to drop the column `customerEmail` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the `owners` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `district` to the `hotels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReservationStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "ReservationStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ReservationStatus" ADD VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "hotels" DROP CONSTRAINT "hotels_ownerId_fkey";

-- DropIndex
DROP INDEX "reservations_customerEmail_idx";

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "district" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
ADD COLUMN     "customerId" UUID NOT NULL;

-- DropTable
DROP TABLE "owners";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(11) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "hotels_district_idx" ON "hotels"("district");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
