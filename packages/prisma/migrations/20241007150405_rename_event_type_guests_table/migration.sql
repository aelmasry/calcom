/*
  Warnings:

  - You are about to drop the `EventType_guests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventType_guests" DROP CONSTRAINT "EventType_guests_eventTypeId_fkey";

-- DropTable
DROP TABLE "EventType_guests";

-- CreateTable
CREATE TABLE "EventTypeGuests" (
    "id" SERIAL NOT NULL,
    "eventTypeId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "EventTypeGuests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventTypeGuests" ADD CONSTRAINT "EventTypeGuests_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
