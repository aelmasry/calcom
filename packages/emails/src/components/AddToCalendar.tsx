import { createEvent } from "ics";
import { TFunction } from "next-i18next";
import Link from "next/link";

import dayjs from "@calcom/dayjs";
import type { CalendarEvent } from "@calcom/types/Calendar";
import { getCairoTimeWithDST } from "@calcom/web/lib/timeUtils";

// Assuming 'ics' is the package being used for creating calendar events

export function AddToCalendar(props: { calEvent: CalendarEvent; timeZone: string; t: TFunction }) {
  const { timeZone, t, calEvent } = props;
  const { type, description, attendees, startTime, endTime } = calEvent;

  let location;
  if (props.calEvent.videoCallData) {
    location = props.calEvent.videoCallData.url ?? "";
  }

  if (props.calEvent.additionalInformation?.hangoutLink) {
    location = props.calEvent.additionalInformation.hangoutLink;
  }

  function eventLink(
    startDate: dayjs.Dayjs,
    endDate: dayjs.Dayjs,
    eventName: string,
    description: string,
    location?: string
  ): string {
    const optional: { location?: string } = {};
    if (location) {
      optional["location"] = location ?? "";
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
    `https://outlook.office365.com/calendar/deeplink/compose?body=${description}&enddt=${getRecipientEnd(
      "YYYY-MM-DDTHH:mm:ss"
    )}&startdt=${getRecipientStart("YYYY-MM-DDTHH:mm:ss")}&subject=${eventName}&location=${location || ""}`
  );

  const otherLink = `data:text/calendar,${eventLink(startDate, endDate, eventName, description, location)}`;

  console.log("### otherLink", otherLink)
  return (
    <div
      className="border-bookinglightest mt-9 flex border-b pt-2 pb-4 text-center dark:border-gray-900 sm:mt-0 sm:pt-4"
      style={{ lineHeight: "50px" }}>
      <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">
        {t("add_to_calendar")}
      </span>
      <div
        style={{
          flexGrow: 1,
          justifyContent: "center",
          lineHeight: "50px",
        }}>
        <Link href={googleCalendarLink}>
          <a target="_blank"
          title="Google calendar"
            style={{
              margin: "0 8px",
              height: "40px",
              width: "40px",
              borderRadius: "4px",
              color: "#000",
            }}>

            <img src="https://img.icons8.com/?size=100&id=17935&format=png&color=000000" alt="Google Calendar" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />

          </a>
        </Link>

        <Link href={outlookLiveLink}>
          <a
            title="Microsoft Outlook"
            style={{ margin: '0 8px', height: '40px', width: '40px', borderRadius: '4px', color: '#000' }}
            target="_blank"
          >

            <img src="https://img.icons8.com/?size=100&id=24035&format=png&color=000000" alt="Microsoft Outlook" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />


          </a>
        </Link>
        <Link href={outlookOfficeLink}>
          <a
            title="Microsoft office 360"
            style={{ margin: '0 8px', height: '40px', width: '40px', borderRadius: '4px', color: '#000' }}
            target="_blank"
          >##

            <img src="https://img.icons8.com/?size=100&id=117062&format=png&color=000000" alt="Microsoft Outlook" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />

          </a>
        </Link>

        <Link href={otherLink}>
          <a
            className="mx-2 flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white"
            download={type + ".ics"}
            style={{ padding: "10px" }}>
            <img src="https://img.icons8.com/?size=100&id=890&format=png&color=000000" alt={t("other")} style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
          </a>
        </Link>
      </div>
    </div>
  );
}
