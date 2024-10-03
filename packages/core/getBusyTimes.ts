import { BookingStatus, Credential, SelectedCalendar } from "@prisma/client";

import { getBusyCalendarTimes } from "@calcom/core/CalendarManager";
import logger from "@calcom/lib/logger";
// import { getBusyVideoTimes } from "@calcom/core/videoClient";
// import notEmpty from "@calcom/lib/notEmpty";
import prisma from "@calcom/prisma";
import type { EventBusyDate } from "@calcom/types/Calendar";

export async function getBusyTimes(params: {
  credentials: Credential[];
  userId: number;
  eventTypeId?: number;
  startTime: string;
  endTime: string;
  selectedCalendars: SelectedCalendar[];
}) {
  const { credentials, userId, eventTypeId, startTime, endTime, selectedCalendars } = params;
  const startPrismaBookingGet = performance.now();
  const busyTimes: EventBusyDate[] = await prisma.booking
    .findMany({
      where: {
        AND: [
          {
            OR: [
              { userId }, // userId = $1
              { eventTypeId }, // eventTypeId = $2
            ],
          },
          {
            startTime: { gte: startTime }, // startTime >= $3
          },
          {
            endTime: { lte: endTime }, // endTime <= $4
          },
          {
            status: {
              in: [BookingStatus.ACCEPTED], // status IN ('ACCEPTED')
            },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })
    .then((bookings) => bookings.map(({ startTime, endTime }) => ({ end: endTime, start: startTime })));
  const endPrismaBookingGet = performance.now();
  logger.debug(`prisma booking get took ${endPrismaBookingGet - startPrismaBookingGet}ms`);
  if (credentials.length > 0) {
    const calendarBusyTimes = await getBusyCalendarTimes(credentials, startTime, endTime, selectedCalendars);
    // console.log("calendarBusyTimes", calendarBusyTimes);
    busyTimes.push(...calendarBusyTimes); /*
    // TODO: Disabled until we can filter Zoom events by date. Also this is adding too much latency.
    const videoBusyTimes = (await getBusyVideoTimes(credentials)).filter(notEmpty);
    console.log("videoBusyTimes", videoBusyTimes);
    busyTimes.push(...videoBusyTimes);
    */
  }

  return busyTimes;
}

export default getBusyTimes;
