-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING');

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "location" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "hotelId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rooms_capacity_positive" CHECK ("capacity" > 0)
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "offers_price_positive" CHECK ("price" > 0),
    CONSTRAINT "offers_currency_iso_4217_format" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "offers_weekend_stay" CHECK (
        EXTRACT(ISODOW FROM "checkIn") IN (5, 6)
        AND "checkOut" > "checkIn"
        AND "checkOut" <= "checkIn" + CASE
            WHEN EXTRACT(ISODOW FROM "checkIn") = 5 THEN 3
            ELSE 2
        END
    )
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "customerName" VARCHAR(120) NOT NULL,
    "customerEmail" VARCHAR(320) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "hotelNameSnapshot" VARCHAR(180) NOT NULL,
    "roomNameSnapshot" VARCHAR(120) NOT NULL,
    "priceSnapshot" DECIMAL(12,2) NOT NULL,
    "currencySnapshot" CHAR(3) NOT NULL,
    "checkInSnapshot" DATE NOT NULL,
    "checkOutSnapshot" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reservations_price_positive" CHECK ("priceSnapshot" > 0),
    CONSTRAINT "reservations_currency_iso_4217_format" CHECK ("currencySnapshot" ~ '^[A-Z]{3}$'),
    CONSTRAINT "reservations_stay_ordered" CHECK ("checkOutSnapshot" > "checkInSnapshot")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");
CREATE INDEX "hotels_ownerId_idx" ON "hotels"("ownerId");
CREATE INDEX "hotels_location_idx" ON "hotels"("location");
CREATE INDEX "rooms_hotelId_idx" ON "rooms"("hotelId");
CREATE UNIQUE INDEX "rooms_hotelId_name_key" ON "rooms"("hotelId", "name");
CREATE INDEX "offers_roomId_idx" ON "offers"("roomId");
CREATE INDEX "offers_checkIn_idx" ON "offers"("checkIn");
CREATE INDEX "offers_checkIn_checkOut_idx" ON "offers"("checkIn", "checkOut");
CREATE INDEX "reservations_offerId_idx" ON "reservations"("offerId");
CREATE INDEX "reservations_customerEmail_idx" ON "reservations"("customerEmail");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
