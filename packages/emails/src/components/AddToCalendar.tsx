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


  // const icloudLink = encodeURI(
  //   `https://www.icloud.com/calendar/eventedit?body=${description}&enddt=${getRecipientEnd(
  //     "YYYY-MM-DDTHH:mm:ss"
  //   )}&startdt=${getRecipientStart("YYYY-MM-DDTHH:mm:ss")}&subject=${eventName}&location=${location || ""}`
  // );

  const otherLink = `data:text/calendar,${eventLink(startDate, endDate, eventName, description, location)}`;

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
            style={{
              margin: "0 8px",
              height: "40px",
              width: "40px",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              padding: "8px",
              color: "#000",
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ marginTop: "-6px", display: "inline-block", height: "16px", width: "16px" }}>
              <title>Google</title>
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
          </a>
        </Link>

        <Link href={outlookLiveLink}>
          <a
            style={{ margin: '0 8px', height: '40px', width: '40px', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '8px', color: '#000' }}
            target="_blank"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: '-6px', display: 'inline-block', height: '16px', width: '16px' }}>
              <title>Microsoft Outlook</title>
              <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z" />
            </svg>
          </a>
        </Link>
        <Link href={outlookOfficeLink}>
          <a
            style={{ margin: '0 8px', height: '40px', width: '40px', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '8px', color: '#000' }}
            target="_blank"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: '-6px', display: 'inline-block', height: '16px', width: '16px' }}>
              <title>Microsoft Office</title>
              <path d="M21.53 4.306v15.363q0 .807-.472 1.433-.472.627-1.253.85l-6.888 1.974q-.136.037-.29.055-.156.019-.293.019-.396 0-.72-.105-.321-.106-.656-.292l-4.505-2.544q-.248-.137-.391-.366-.143-.23-.143-.515 0-.434.304-.738.304-.305.739-.305h5.831V4.964l-4.38 1.563q-.533.187-.856.658-.322.472-.322 1.03v8.078q0 .496-.248.912-.25.416-.683.651l-2.072 1.13q-.286.148-.571.148-.497 0-.844-.347-.348-.347-.348-.844V6.563q0-.62.33-1.19.328-.571.874-.881L11.07.285q.515-.26 1.1-.26.257 0 .513.063.258.06.48.156l6.918 2.788q.552.224.88.753.33.528.33 1.221z" />
            </svg>
          </a>
        </Link>
        <Link href={otherLink}>
          <a
            style={{ margin: '0 8px', height: '40px', width: '40px', borderRadius: '4px', border: '1px solid #e5e7eb', padding: '8px', color: '#000' }}
            download={type + ".ics"}
            target="_blank"

          >

            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ marginTop: '-6px', display: 'inline-block', height: '16px', width: '16px' }}>
              <title>Apple iCal</title>
              <path d="M17.854 2.875q.35 0 .57.244.222.244.222.55v1.512h-1.762V3.67q0-.306.22-.55.22-.244.57-.244zm-9.82 0q.35 0 .57.244.22.244.22.55v1.512H7.282V3.67q0-.306.22-.55.22-.244.57-.244zm-3.195 4.83h14.322V18.99q0 .33-.227.56-.226.23-.558.23H4.649q-.33 0-.56-.23-.23-.23-.23-.56V7.705zM17.853 0q-.815 0-1.393.578-.577.577-.577 1.393v1.512H8.12V1.97q0-.816-.578-1.393Q6.965 0 6.15 0q-.815 0-1.393.578-.577.577-.577 1.393v1.512H1.56q-.648 0-1.104.456Q0 4.392 0 5.04v14.978q0 .648.456 1.103.456.456 1.104.456h20.879q.647 0 1.104-.456.455-.455.455-1.103V5.04q0-.648-.455-1.104-.457-.456-1.104-.456h-3.183V1.97q0-.816-.577-1.393Q18.67 0 17.854 0z" />
            </svg>

          </a>
        </Link>
      </div>
    </div>
  );
}
