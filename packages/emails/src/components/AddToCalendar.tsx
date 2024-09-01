import { createEvent } from "ics";
import { TFunction } from "next-i18next";

import dayjs from "@calcom/dayjs";
import type { CalendarEvent } from "@calcom/types/Calendar";
import { getCairoTimeWithDST } from "@calcom/web/lib/timeUtils";

// Assuming 'ics' is the package being used for creating calendar events

export function AddToCalendar(props: { calEvent: CalendarEvent; timeZone: string; t: TFunction }) {
  const { timeZone, t, calEvent } = props;
  const { type, description, location, attendees, startTime, endTime } = calEvent;

  function eventLink(
    startDate: dayjs.Dayjs,
    endDate: dayjs.Dayjs,
    eventName: string,
    description: string,
    location?: string
  ): string {
    const optional: { location?: string } = {};
    if (location) {
      optional["location"] = location;
    }

    const event = createEvent({
      start: [
        startDate.year(),
        startDate.month() + 1,
        startDate.date(),
        startDate.hour(),
        startDate.minute(),
      ],
      startInputType: "utc",
      title: eventName,
      description,
      duration: { minutes: endDate.diff(startDate, "minute") },
      ...optional,
    });

    if (event.error) {
      throw event.error;
    }

    return encodeURIComponent(event.value || "");
  }

  function getRecipientStart(format: string) {
    if (timeZone.includes("Cairo")) {
      const date = getCairoTimeWithDST(dayjs(calEvent.startTime));
      return date.format(format);
    } else {
      return dayjs(calEvent.startTime).tz(timeZone).format(format);
    }
  }

  function getRecipientEnd(format: string) {
    if (timeZone.includes("Cairo")) {
      const date = getCairoTimeWithDST(dayjs(calEvent.endTime));
      return date.format(format);
    } else {
      return dayjs(calEvent.endTime).tz(timeZone).format(format);
    }
  }

  const startDate = dayjs(startTime).utc();
  const endDate = dayjs(endTime).utc();
  const eventName = t("ics_event_title", {
    eventType: type,
    name: attendees[0]?.name || "Attendee",
  });

  const googleCalendarLink = `https://calendar.google.com/calendar/r/eventedit?dates=${getRecipientStart(
    "YYYYMMDDTHHmmssZ"
  )}/${getRecipientEnd(
    "YYYYMMDDTHHmmssZ"
  )}&text=${eventName}&details=${description}&location=${encodeURIComponent(location || "")}`;

  const outlookLiveLink = encodeURI(
    `https://outlook.live.com/calendar/0/deeplink/compose?body=${description}&enddt=${getRecipientEnd(
      "YYYY-MM-DDTHH:mm:ss"
    )}&startdt=${getRecipientStart("YYYY-MM-DDTHH:mm:ss")}&subject=${eventName}&location=${location || ""}`
  );

  const outlookOfficeLink = encodeURI(
    `https://outlook.office.com/calendar/0/deeplink/compose?body=${description}&enddt=${getRecipientEnd(
      "YYYY-MM-DDTHH:mm:ss"
    )}&startdt=${getRecipientStart("YYYY-MM-DDTHH:mm:ss")}&subject=${eventName}&location=${location || ""}`
  );

  const otherLink = `data:text/calendar,${eventLink(startDate, endDate, eventName, description, location)}`;

  return (
    <div className="border-bookinglightest mt-9 flex border-b pt-2 pb-4 text-center dark:border-gray-900 sm:mt-0 sm:pt-4">
      <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">
        {t("add_to_calendar")}
      </span>
      <div className="-ml-16 flex flex-grow justify-center text-center">
        <a
          href={googleCalendarLink}
          className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
          target="_blank"
          rel="noopener noreferrer">
          Google Icon
        </a>
        <a
          href={outlookLiveLink}
          className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
          target="_blank"
          rel="noopener noreferrer">
          Outlook Live Icon
        </a>
        <a
          href={outlookOfficeLink}
          className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
          target="_blank"
          rel="noopener noreferrer">
          Outlook Office Icon
        </a>
        <a
          href={otherLink}
          className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
          download={`${type}.ics`}>
          Other Icon
        </a>
      </div>
    </div>
  );
}
