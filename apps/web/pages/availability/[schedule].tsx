import { BadgeCheckIcon } from "@heroicons/react/solid";
import { SessionContextValue, signOut, useSession } from "next-auth/react";
import { getCsrfToken, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
// import TimezoneSelect from "@components/ui/form/TimezoneSelect";
// import TimezoneSelect, { ITimezone } from "react-timezone-select";
import TimezoneSelect, { type ITimezone } from "react-timezone-select"


import { DEFAULT_SCHEDULE, availabilityAsString } from "@calcom/lib/availability";
import classNames from "@calcom/lib/classNames";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import showToast from "@calcom/lib/notification";
import Button from "@calcom/ui/Button";
import Switch from "@calcom/ui/Switch";
import { Form } from "@calcom/ui/form/fields";

import { QueryCell } from "@lib/QueryCell";
import { HttpError } from "@lib/core/http/error";
import { inferQueryOutput, trpc } from "@lib/trpc";

import Shell from "@components/Shell";
import Schedule from "@components/availability/Schedule";
import EditableHeading from "@components/ui/EditableHeading";

export function AvailabilityForm(props: inferQueryOutput<"viewer.availability.schedule">) {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useContext();

  
  const form = useForm({
    defaultValues: {
      schedule: props.availability || DEFAULT_SCHEDULE,
      isDefault: !!props.isDefault,
    },
  });

  const updateMutation = trpc.useMutation("viewer.availability.schedule.update", {
    onSuccess: async ({ schedule }) => {
      await utils.invalidateQueries(["viewer.availability.schedule"]);
      await router.push(router.query.next);
      showToast(
        t("availability_updated_successfully", {
          scheduleName: schedule.name,
        }),
        "success"
      );
    },
    onError: (err) => {
      if (err instanceof HttpError) {
        const message = `${err.statusCode}: ${err.message}`;
        showToast(message, "error");
      }
    },
  });

  if (props.schedule.timeZone === "null" || props.schedule.timeZone === undefined) {
    props.schedule.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  const [selectedTimeZone, setSelectedTimeZone] = useState<ITimezone>(
    props.schedule.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const enteredTimeZone = typeof selectedTimeZone === "string" ? selectedTimeZone : selectedTimeZone.value;
  return (
    <Form
      form={form}
      handleSubmit={async (values) => {
        updateMutation.mutate({
          scheduleId: parseInt(router.query.schedule as string, 10),
          name: props.schedule.name,
          timeZone: enteredTimeZone,
          ...values,
        });
      }}
      className="grid grid-cols-3 gap-2">
      <div className="col-span-3 space-y-2 lg:col-span-2">
        <div className="divide-y rounded-sm border border-gray-200 bg-white px-4 py-5 sm:p-6">
          <h3 className="mb-5 text-base font-medium leading-6 text-gray-900">{t("change_start_end")}</h3>
          <Schedule name="schedule" />
        </div>
        <div className="divide-y rounded-sm border border-gray-200 bg-white px-4 py-5 sm:p-6">
          <div className="min-w-48 sm:mb-0">
            <label htmlFor="timeZone" className="mt-2.5 flex text-sm font-medium text-neutral-700">
              {t("timezone")}
            </label>
          </div>
          <div className="w-full">
            <div className="relative mt-1 rounded-sm">
              <TimezoneSelect
                id="timeZone"
                name="timeZone"
                value={selectedTimeZone}
                onChange={(v) => v && setSelectedTimeZone(v)}
                className="block w-full rounded-sm border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="space-x-2 text-right">
          <Button className={classNames("bg-techiepurple mr-4 rounded-md")}>{t("continue")}</Button>
        </div>
      </div>
    </Form>
  );
}

export default function Availability() {
  const router = useRouter();
  
  const { i18n } = useLocale();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jsonwebtoken = require("jsonwebtoken");

  const { data: session, status } = useSession();
  const loading = status === "loading";

  // console.log("### router", router.query.token)
  let token = null;
  if (typeof window !== "undefined") {
    token = window.location.search.split("token=")[1];
  }else {
    token = router.query.token
  }

  const userFromToken = jsonwebtoken.decode(token);

  if (token && !loading && (!session || session == null || session.user.id != userFromToken.data)) {
    signIn<"credentials">("token", {
      token,
      redirect: false,
    }).then((result) => {
      return true;
    });
  }

  const scheduleId = parseInt(router.query.schedule as string);
  
  const query = trpc.useQuery([
    "viewer.availability.schedule",
    {
      // scheduleId: parseInt(router.query.schedule as string),
      scheduleId,
    },
  ]);
  const [name, setName] = useState<string>();
  return (
    <div>
      <QueryCell
        query={query}
        success={({ data }) => {
          return (
            <Shell
              subtitle={data.schedule.availability.map((availability) => (
                <span key={availability.id}>
                  {availabilityAsString(availability, i18n.language)}
                  <br />
                </span>
              ))}>
              <AvailabilityForm
                {...{ ...data, schedule: { ...data.schedule, name: name || data.schedule.name } }}
              />
            </Shell>
          );
        }}
      />
    </div>
  );
}
