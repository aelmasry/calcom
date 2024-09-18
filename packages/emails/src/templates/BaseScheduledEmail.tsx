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
  AddToCalendar,
} from "../components";

export const BaseScheduledEmail = (
  props: {
    calEvent: CalendarEvent;
    attendee: Person;
    timeZone: string;
    t: TFunction;
    isCancelled?: boolean; // Optional property to indicate if the event is canceled
  } & Partial<React.ComponentProps<typeof BaseEmailHtml>>
) => {
  const { t, timeZone } = props;
  
  function getRecipientStart(format: string) {
    return dayjs(props.calEvent.startTime).utc().tz(timeZone).format(format);
  }

  function getRecipientEnd(format: string) {
    return dayjs(props.calEvent.endTime).utc().tz(timeZone).format(format);
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
      <WhenInfo calEvent={props.calEvent} t={t} timeZone={timeZone} lineThrough={props.isCancelled}/>
      <WhoInfo calEvent={props.calEvent} t={t} />
      <LocationInfo calEvent={props.calEvent} t={t} />
      <Info label={t("description")} description={props.calEvent.description} withSpacer />
      <Info label={t("additional_notes")} description={props.calEvent.additionalNotes} withSpacer />
      <CustomInputs calEvent={props.calEvent} />
      {!props.isCancelled && (
        <AddToCalendar calEvent={props.calEvent} t={t} timeZone={timeZone} />
      )}
    </BaseEmailHtml>
  );
};
