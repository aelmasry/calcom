import { TFunction } from "next-i18next";
import rrule from "rrule";

import dayjs from "@calcom/dayjs";
import { getEveryFreqFor } from "@calcom/lib/recurringStrings";
import type { CalendarEvent } from "@calcom/types/Calendar";
import { RecurringEvent } from "@calcom/types/Calendar";
import { getCairoTimeWithDST } from "@calcom/web/lib/timeUtils"

import { Info } from "./Info";

function getRecurringWhen({ calEvent }: { calEvent: CalendarEvent }) {
  if (calEvent.recurringEvent) {
    const t = calEvent.attendees[0].language.translate;
    const rruleOptions = new rrule(calEvent.recurringEvent).options;
    const recurringEvent: RecurringEvent = {
      freq: rruleOptions.freq,
      count: rruleOptions.count || 1,
      interval: rruleOptions.interval,
    };
    return ` - ${getEveryFreqFor({ t, recurringEvent })}`;
  }
  return "";
}

export function WhenInfo(props: { calEvent: CalendarEvent; timeZone: string; t: TFunction }) {
  const { timeZone, t, calEvent: { recurringEvent } = {} } = props;

  function getRecipientStart(format: string) {
    if (timeZone.includes("Cairo")) {
      const date = getCairoTimeWithDST(dayjs(props.calEvent.startTime));
      return date.format(format)
    } else {
      return dayjs(props.calEvent.startTime).tz(timeZone).format(format);
    }
    
  }

  function getRecipientEnd(format: string) {
    if (timeZone.includes("Cairo")) {
      const date = getCairoTimeWithDST(dayjs(props.calEvent.endTime));
      return date.format(format)
    } else {
      return dayjs(props.calEvent.endTime).tz(timeZone).format(format);
    }
    // return dayjs(props.calEvent.endTime).tz(timeZone).format(format);
  }

  return (
    <div>
      <Info
        label={`${t("when")} ${getRecurringWhen(props)}`}
        lineThrough={!!props.calEvent.cancellationReason}
        description={
          <>
            {recurringEvent?.count ? `${t("starting")} ` : ""}
            {t(getRecipientStart("dddd").toLowerCase())}, {t(getRecipientStart("MMMM").toLowerCase())}{" "}
            {getRecipientStart("D, YYYY | h:mma")} - {getRecipientEnd("h:mma")}{" "}
            <span style={{ color: "#888888" }}>({timeZone})</span>
          </>
        }
        withSpacer
      />
    </div>
  );
}
