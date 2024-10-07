-- CreateTable
CREATE TABLE "EventType_guests" (
    "id" SERIAL NOT NULL,
    "eventTypeId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "EventType_guests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventType_guests" ADD CONSTRAINT "EventType_guests_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
