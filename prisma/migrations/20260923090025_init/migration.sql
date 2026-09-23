/*
  Warnings:

  - You are about to drop the column `checkInSnapshot` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutSnapshot` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `currencySnapshot` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `hotelNameSnapshot` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `priceSnapshot` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `roomNameSnapshot` on the `reservations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "checkInSnapshot",
DROP COLUMN "checkOutSnapshot",
DROP COLUMN "currencySnapshot",
DROP COLUMN "hotelNameSnapshot",
DROP COLUMN "priceSnapshot",
DROP COLUMN "roomNameSnapshot";
