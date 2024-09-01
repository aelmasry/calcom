import { createEvent } from "ics";
import type { TFunction } from "next-i18next";

import dayjs from "@calcom/dayjs";
import type { CalendarEvent, Person } from "@calcom/types/Calendar";

import {
  BaseEmailHtml,
  CustomInputs,
  Info,
  LocationInfo,
  ManageLink,
  WhenInfo,
  WhoInfo,
} from "../components";

export const BaseScheduledEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
    timeZone: string;
    t: TFunction;
  } & Partial<React.ComponentProps<typeof BaseEmailHtml>>
) => {
  const { t, timeZone } = props;

  function getRecipientStart(format: string) {
    return dayjs(props.calEvent.startTime).utc().tz(timeZone).format(format);
  }

  function getRecipientEnd(format: string) {
    return dayjs(props.calEvent.endTime).utc().tz(timeZone).format(format);
  }

  function addToCalendar() {
    console.log("### addToCalendar");
    const { calEvent, t } = props;
    const { type, description, location, attendees, startTime, endTime } = calEvent;

    const startDate = dayjs(startTime).utc();
    const endDate = dayjs(endTime).utc();
    const eventName = t("ics_event_title", {
      eventType: type,
      name: attendees[0].name,
    });

    const googleCalendarLink = `https://calendar.google.com/calendar/r/eventedit?dates=${startDate.format(
      "YYYYMMDDTHHmmssZ"
    )}/${endDate.format(
      "YYYYMMDDTHHmmssZ"
    )}&text=${eventName}&details=${description}&location=${encodeURIComponent(location || "")}`;

    const outlookLiveLink = encodeURI(
      `https://outlook.live.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${
        location || ""
      }`
    );

    const outlookOfficeLink = encodeURI(
      `https://outlook.office.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${
        location || ""
      }`
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

  function eventLink(
    startDate: dayjs.Dayjs,
    endDate: dayjs.Dayjs,
    eventName: string,
    description: string,
    location?: string
  ): string {
    console.log("### eventLink");
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
      description: description,
      duration: { minutes: endDate.diff(startDate, "minute") },
      ...optional,
    });

    if (event.error) {
      throw event.error;
    }

    return encodeURIComponent(event.value || "");
  }

  const subject = t(props.subject || "confirmed_event_type_subject", {
    eventType: props.calEvent.type,
    name: props.calEvent.team?.name || props.calEvent.organizer.name,
    date: `${getRecipientStart("h:mm:ss a")} - ${getRecipientEnd("h:mm:ss a")}, ${t(
      getRecipientStart("dddd").toLowerCase()
    )}, ${t(getRecipientStart("MMMM"))} ${getRecipientStart("D, YYYY")}`,
  });

  return (
    <BaseEmailHtml
      headerType={props.headerType || "checkCircle"}
      subject={props.subject || subject}
      title={t(
        props.title
          ? props.title
          : props.calEvent.recurringEvent?.count
          ? "your_event_has_been_scheduled_recurring"
          : "your_event_has_been_scheduled"
      )}
      callToAction={
        props.callToAction === null
          ? null
          : props.callToAction || <ManageLink attendee={props.attendee} calEvent={props.calEvent} />
      }
      subtitle={props.subtitle || <>{t("emailed_you_and_any_other_attendees")}</>}>
      <Info label={t("cancellation_reason")} description={props.calEvent.cancellationReason} withSpacer />
      <Info label={t("rejection_reason")} description={props.calEvent.rejectionReason} withSpacer />
      <Info label={t("what")} description={props.calEvent.type} withSpacer />
      <WhenInfo calEvent={props.calEvent} t={t} timeZone={timeZone} />
      <WhoInfo calEvent={props.calEvent} t={t} />
      <LocationInfo calEvent={props.calEvent} t={t} />
      <Info label={t("description")} description={props.calEvent.description} withSpacer />
      <Info label={t("additional_notes")} description={props.calEvent.additionalNotes} withSpacer />
      <CustomInputs calEvent={props.calEvent} />
      {addToCalendar()}
    </BaseEmailHtml>
  );
};
