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

  function addToCalender() {
    const { eventType, description } = this.props.calEvent;
    console.log("### eventType", eventType);
    console.log("### description", description);

    const startDate = dayjs(this.props.calEvent.startTime).utc();
    const endDate = dayjs(this.props.calEvent.endTime).utc();
    const duration = endDate.diff(startDate, "minute");
    const eventName = this.t("ics_event_title", {
      eventType: eventType.type,
      name: this.props.calEvent.attendees[0].name,
    });
    const location = this.props.calEvent.location || "";

    const googleCalendarLink = `https://calendar.google.com/calendar/r/eventedit?dates=${startDate.format(
      "YYYYMMDDTHHmmssZ"
    )}/${endDate.format(
      "YYYYMMDDTHHmmssZ"
    )}&text=${eventName}&details=${description}&location=${encodeURIComponent(location)}`;
    const outlookLiveLink = encodeURI(
      `https://outlook.live.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${location}`
    );
    const outlookOfficeLink = encodeURI(
      `https://outlook.office.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${location}`
    );
    const otherLink = `data:text/calendar,${this.eventLink()}`;

    return (
      <div className="border-bookinglightest mt-9 flex border-b pt-2 pb-4 text-center dark:border-gray-900 sm:mt-0 sm:pt-4">
        <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">
          {this.t("add_to_calendar")}
        </span>
        <div className="-ml-16 flex flex-grow justify-center text-center">
          <Link href={googleCalendarLink}>
            <a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">
              Google Icon
            </a>
          </Link>
          <Link href={outlookLiveLink} target="_blank">
            <a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">
              Outlook Live Icon
            </a>
          </Link>
          <Link href={outlookOfficeLink} target="_blank">
            <a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">
              Outlook Office Icon
            </a>
          </Link>
          <Link href={otherLink} download={`${eventType.title}.ics`}>
            <a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">
              Other Icon
            </a>
          </Link>
        </div>
      </div>
    );
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
      addToCalender()
    </BaseEmailHtml>
  );
};
