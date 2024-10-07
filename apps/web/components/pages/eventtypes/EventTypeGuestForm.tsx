import { zodResolver } from "@hookform/resolvers/zod";
import { EventTypeGuests } from "@prisma/client";
import React, { FC } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import Button from "@calcom/ui/Button";

import { useLocale } from "@lib/hooks/useLocale";

// Define schema validation using zod
const eventTypeSchema = z.object({
  email: z.string().email(),
});

type EventTypeFormValues = zod.infer<typeof eventTypeSchema>;

interface Props {
  onSubmit: SubmitHandler<EventTypeFormValues>;
  onCancel: () => void;
  selectedCustomInput?: EventTypeGuests;
}

const EventTypeGuestForm: FC<Props> = (props) => {
  const { t } = useLocale();

  // Assuming inputOptions is defined elsewhere and might control input types
  const inputOptions = [
    { value: "TEXT", label: t("text") },
    { value: "EMAIL", label: t("email") },
  ];

  const { selectedCustomInput } = props;
  const defaultValues: EventTypeFormValues = {
    email: props.selectedCustomInput?.email || "",
  };

  // Using useForm with zodResolver and defaultValues
  const { register, control, handleSubmit } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues,
  });

  // Watch the type field if it's dynamic
  const selectedInputType = useWatch({ name: "email", control });
  const selectedInputOption = inputOptions.find((e) => selectedInputType === e.value);

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <div className="mb-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t("email")}
        </label>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <input
              {...field}
              type="email"
              id="email"
              required
              className="block w-full rounded-sm border-gray-300 text-sm"
            />
          )}
        />
      </div>
      <input
        type="hidden"
        id="eventTypeId"
        value={selectedCustomInput?.eventTypeId || -1}
        {...register("eventTypeId", { valueAsNumber: true })}
      />
      <input
        type="hidden"
        id="id"
        value={selectedCustomInput?.id || -1}
        {...register("id", { valueAsNumber: true })}
      />
      <div className="mt-5 flex space-x-2 sm:mt-4">
        <Button type="button" color="secondary" onClick={props.onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("save")}</Button>
      </div>
    </form>
  );
};

export default EventTypeGuestForm;
