/*
  Warnings:

  - You are about to drop the column `offerId` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `offers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roomId` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bedType` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkIn` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkOut` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountedPrice` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regularPrice` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomSize` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `viewType` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_roomId_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_offerId_fkey";

-- DropIndex
DROP INDEX "reservations_offerId_idx";

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "Facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT;

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "offerId",
ADD COLUMN     "roomId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "bedType" TEXT NOT NULL,
ADD COLUMN     "checkIn" DATE NOT NULL,
ADD COLUMN     "checkOut" DATE NOT NULL,
ADD COLUMN     "currency" CHAR(3) NOT NULL,
ADD COLUMN     "discountedPrice" DECIMAL NOT NULL,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "regularPrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "roomSize" TEXT NOT NULL,
ADD COLUMN     "viewType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordHash",
ADD COLUMN     "password" VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE "offers";

-- CreateIndex
CREATE INDEX "reservations_roomId_idx" ON "reservations"("roomId");

-- CreateIndex
CREATE INDEX "reservations_customerId_idx" ON "reservations"("customerId");
