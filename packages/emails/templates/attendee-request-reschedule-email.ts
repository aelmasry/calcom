import { createEvent, DateArray, Person } from "ics";

import dayjs from "@calcom/dayjs";
import { getCancelLink } from "@calcom/lib/CalEventParser";
import { CalendarEvent } from "@calcom/types/Calendar";

import { renderEmail } from "../";
import OrganizerScheduledEmail from "./organizer-scheduled-email";

export default class AttendeeRequestRescheduledEmail extends OrganizerScheduledEmail {
  private metadata: { rescheduleLink: string };
  constructor(calEvent: CalendarEvent, metadata: { rescheduleLink: string }) {
    super(calEvent);
    this.metadata = metadata;
  }
  protected getNodeMailerPayload(): Record<string, unknown> {
    const toAddresses = [this.calEvent.attendees[0].email];

    return {
      icalEvent: {
        filename: "event.ics",
        content: this.getiCalEventAsString(),
      },
      from: `Cal.com <${this.getMailerOptions().from}>`,
      to: toAddresses.join(","),
      subject: `${this.t("requested_to_reschedule_subject_attendee", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
      })}`,
      html: renderEmail("AttendeeRequestRescheduledEmail", {
        calEvent: this.calEvent,
        attendee: this.calEvent.organizer,
        metadata: this.metadata,
      }),
      text: this.getTextBody(),
    };
  }

  // @OVERRIDE
  protected getiCalEventAsString(): string | undefined {
    const icsEvent = createEvent({
      start: dayjs(this.calEvent.startTime)
        .utc()
        .toArray()
        .slice(0, 6)
        .map((v, i) => (i === 1 ? v + 1 : v)) as DateArray,
      startInputType: "utc",
      productId: "calendso/ics",
      title: this.t("ics_event_title", {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
      }),
      description: this.getTextBody(),
      duration: { minutes: dayjs(this.calEvent.endTime).diff(dayjs(this.calEvent.startTime), "minute") },
      organizer: { name: this.calEvent.organizer.name, email: this.calEvent.organizer.email },
      attendees: this.calEvent.attendees.map((attendee: Person) => ({
        name: attendee.name,
        email: attendee.email,
      })),
      status: "CANCELLED",
      method: "CANCEL",
    });
    if (icsEvent.error) {
      throw icsEvent.error;
    }
    return icsEvent.value;
  }
  // @OVERRIDE
  protected getWhen(): string {
    return `
    <p style="height: 6px"></p>
    <div style="line-height: 6px;">
      <p style="color: #494949;">${this.t("when")}</p>
      <p style="color: #494949; font-weight: 400; line-height: 24px;text-decoration: line-through;">
      ${this.t(this.getOrganizerStart("dddd").toLowerCase())}, ${this.t(
      this.getOrganizerStart("MMMM").toLowerCase()
    )} ${this.getOrganizerStart("D")}, ${this.getOrganizerStart("YYYY")} | ${this.getOrganizerStart(
      "h:mma"
    )} - ${this.getOrganizerEnd("h:mma")} <span style="color: #888888">(${this.getTimezone()})</span>
      </p>
    </div>`;
  }

  protected addToCalender(): string {
    const { eventType, description } = this.calEvent;
    const startDate = dayjs(this.calEvent.startTime).utc();
    const endDate = dayjs(this.calEvent.endTime).utc();
    const duration = endDate.diff(startDate, "minute");
    const eventName = this.t("ics_event_title", {
      eventType: eventType.type,
      name: this.calEvent.attendees[0].name,
    });
    const location = this.calEvent.location || "";

    const googleCalendarLink = `https://calendar.google.com/calendar/r/eventedit?dates=${startDate.format(
      "YYYYMMDDTHHmmss[Z]"
    )}/${endDate.format(
      "YYYYMMDDTHHmmss[Z]"
    )}&text=${eventName}&details=${description}&location=${encodeURIComponent(location)}`;
    const outlookLiveLink = encodeURI(
      `https://outlook.live.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${location}`
    );
    const outlookOfficeLink = encodeURI(
      `https://outlook.office.com/calendar/0/deeplink/compose?body=${description}&enddt=${endDate.format()}&startdt=${startDate.format()}&subject=${eventName}&location=${location}`
    );
    const otherLink = `data:text/calendar,${this.eventLink()}`;

    return `
      <div className="border-bookinglightest mt-9 flex border-b pt-2 pb-4 text-center dark:border-gray-900 sm:mt-0 sm:pt-4">
        <span className="flex self-center font-medium text-gray-700 ltr:mr-2 rtl:ml-2 dark:text-gray-50">${this.t(
          "add_to_calendar"
        )}</span>
        <div className="-ml-16 flex flex-grow justify-center text-center">
          <Link href="${googleCalendarLink}"><a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">Google Icon</a></Link>
          <Link href="${outlookLiveLink}" target="_blank"><a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">Outlook Live Icon</a></Link>
          <Link href="${outlookOfficeLink}" target="_blank"><a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">Outlook Office Icon</a></Link>
          <Link href="${otherLink}" download="${
      eventType.title
    }.ics"><a className="mx-2 h-10 w-10 rounded-sm border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:text-white">Other Icon</a></Link>
        </div>
      </div>
    `;
  }

  protected getTextBody(): string {
    return `
${this.t("request_reschedule_title_attendee")}
${this.t("request_reschedule_subtitle", {
  organizer: this.calEvent.organizer.name,
})},
${this.getWhen()} 
${this.t("need_to_reschedule_or_cancel")}
${getCancelLink(this.calEvent)}
${this.addToCalender()}
`.replace(/(<([^>]+)>)/gi, "");
  }
}
