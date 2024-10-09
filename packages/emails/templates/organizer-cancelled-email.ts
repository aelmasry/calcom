import { renderEmail } from "../";
import OrganizerScheduledEmail from "./organizer-scheduled-email";

export default class OrganizerCancelledEmail extends OrganizerScheduledEmail {
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

    toAddresses.push("support@techiematter.com");
    this.calEvent.guests.forEach((guest) => {
      toAddresses.push(guest.email); // Assuming guests have an 'email' field
    });

    return {
      from: `Techiematter.com <${this.getMailerOptions().from}>`,
      to: toAddresses.join(","),
      subject: `${this.t("event_cancelled_subject", {
        eventType: this.calEvent.type,
        name: this.calEvent.organizer.name,
        date: this.getFormattedDate(),
      })}`,
      html: renderEmail("OrganizerCancelledEmail", {
        attendee: this.calEvent.organizer,
        calEvent: this.calEvent,
        isCancelled: true,
      }),
      text: this.getTextBody("event_request_cancelled"),
    };
  }
}
