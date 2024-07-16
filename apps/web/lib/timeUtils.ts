// timeUtils.ts
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import dayjs from "@calcom/dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

// Function to get Cairo time with DST adjustment
export function getCairoTimeWithDST(date: dayjs.Dayjs): dayjs.Dayjs {
  const year = date.year();
  // Define DST start and end dates for Cairo for the current year
  const DST_START = dayjs.tz(`${year}-04-26 00:00:00`, "Africa/Cairo");
  const DST_END = dayjs.tz(`${year}-10-25 00:00:00`, "Africa/Cairo");

  const cairoTime = date.tz("Africa/Cairo");
  if (cairoTime.isAfter(DST_START) && cairoTime.isBefore(DST_END)) {
    return cairoTime.add(1, "hour");
  }

  return cairoTime;
}
