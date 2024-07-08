import { createEvent, DateArray, Person } from "ics";
import { TFunction } from "next-i18next";
import rrule from "rrule";

import dayjs from "@calcom/dayjs";
import { getRichDescription } from "@calcom/lib/CalEventParser";
import type { CalendarEvent, CalendarEventType } from "@calcom/types/Calendar";

import prisma from "@lib/prisma";

import { renderEmail } from "../";
import BaseEmail from "./_base-email";

export default class OrganizerScheduledEmail extends BaseEmail {
  calEvent: CalendarEvent;
  calEventType: CalendarEventType;
  t: TFunction;
  newSeat?: boolean;

  constructor(calEvent: CalendarEvent, newSeat?: boolean, calEventType: CalendarEventType) {
    super();
    this.name = "SEND_BOOKING_CONFIRMATION";
    this.calEvent = calEvent;
    this.calEventType = calEventType;
    this.t = this.calEvent.organizer.language.translate;
    this.newSeat = newSeat;
  }

  protected getiCalEventAsString(): string | undefined {
    // Taking care of recurrence rule
    let recurrenceRule: string | undefined = undefined;
    if (this.calEvent.recurringEvent?.count) {
      // ics appends "RRULE:" already, so removing it from RRule generated string
      recurrenceRule = new rrule(this.calEvent.recurringEvent).toString().replace("RRULE:", "");
    }
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
      ...{ recurrenceRule },
      attendees: this.calEvent.attendees.map((attendee: Person) => ({
        name: attendee.name,
        email: attendee.email,
      })),
      status: "CONFIRMED",
    });
    if (icsEvent.error) {
      throw icsEvent.error;
    }
    return icsEvent.value;
  }

  protected getNodeMailerPayload(): Record<string, unknown> {
    const toAddresses = [this.calEvent.organizer.email];
    if (this.calEvent.team) {
      this.calEvent.team.members.forEach((member) => {
        const memberAttendee = this.calEvent.attendees.find((attendee) => attendee.name === member);
        if (memberAttendee) {
          toAddresses.push(memberAttendee.email);
        }
      });
    }

    // SEND_BOOKING_CONFIRMATION to supprt
    toAddresses.push("support@techiematter.com");

    let subject;
    if (this.newSeat) {
      subject = "new_seat_subject";
    } else {
      subject = "confirmed_event_type_subject";
    }

    return {
      icalEvent: {
        filename: "event.ics",
        content: this.getiCalEventAsString(),
      },
      from: `TechiMatter.com <${this.getMailerOptions().from}>`,
      to: toAddresses.join(","),
      subject: `${this.t(subject, {
        eventType: this.calEvent.type,
        name: this.calEvent.attendees[0].name,
        date: this.getFormattedDate(),
      })}`,
      html: renderEmail("OrganizerScheduledEmail", {
        calEvent: this.calEvent,
        attendee: this.calEvent.organizer,
        newSeat: this.newSeat,
      }),
      text: this.getTextBody(),
    };
  }

  protected getTextBody(
    title = "",
    subtitle = "emailed_you_and_any_other_attendees",
    extraInfo = "",
    callToAction = ""
  ): string {
    return `
${this.t(
  title || this.calEvent.recurringEvent?.count ? "new_event_scheduled_recurring" : "new_event_scheduled"
)}
${this.t(subtitle)}
${extraInfo}
${getRichDescription(this.calEvent)}
${callToAction}
`.trim();
  }

  protected getTimezone(): string {
    const eventType = this.getTimezoneByEventTypeId(this.calEvent.eventTypeId);
    // return this.calEvent.organizer.timeZone;
    return eventType ? eventType.timeZone : this.calEvent.organizer.timeZone;
  }

  protected getOrganizerStart(format: string) {
    return this.getRecipientTime(this.calEvent.startTime, format);
  }

  protected getOrganizerEnd(format: string) {
    return this.getRecipientTime(this.calEvent.endTime, format);
  }

  protected getFormattedDate() {
    return `${this.getOrganizerStart("h:mma")} - ${this.getOrganizerEnd("h:mma")}, ${this.t(
      this.getOrganizerStart("dddd").toLowerCase()
    )}, ${this.t(this.getOrganizerStart("MMMM").toLowerCase())} ${this.getOrganizerStart("D, YYYY")}`;
  }

<<<<<<< HEAD
  protected async getTimezoneByEventTypeId(eventTypeId) {
    const eventType = await prisma.eventType.findUnique({
      where: {
        id: eventTypeId,
      },
    });

    return eventType;
  }
=======
>>>>>>> 69d2ebd621bf3218aee9d31107603269612e2d88
}
