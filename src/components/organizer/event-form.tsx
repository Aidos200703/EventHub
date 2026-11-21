"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { eventFormSchema, type EventFormInput, type EventFormValues } from "@/lib/validation/event";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { CoverUpload } from "./cover-upload";
import { eventsKey, statsKey } from "./overview";

type Props = {
  mode: "create" | "edit";
  eventId?: string;
  defaults: EventFormInput;
  /** Sold count per existing ticket type id, to show limits. */
  soldByType?: Record<string, number>;
};

export const emptyTicketType = {
  name: "",
  description: "",
  price: Number.NaN,
  quantity: Number.NaN,
  maxPerOrder: 10,
};

export function EventForm({ mode, eventId, defaults, soldByType = {} }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const form = useForm<EventFormInput, unknown, EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const { register, control, formState, handleSubmit, setError } = form;
  const errors = formState.errors;
  const tickets = useFieldArray({ control, name: "ticketTypes", keyName: "key" });
  const program = useFieldArray({ control, name: "program" });

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      mode === "create"
        ? api<{ id: string }>("/api/organizer/events", { method: "POST", json: values })
        : api<{ id: string }>(`/api/organizer/events/${eventId}`, { method: "PUT", json: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: statsKey });
      toast.success(mode === "create" ? "Draft created" : "Changes saved", {
        description:
          mode === "create" ? "Publish it from the events list when you're ready." : undefined,
      });
      router.push("/organizer/events");
      router.refresh();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) {
        for (const [path, msgs] of Object.entries(err.fields))
          setError(path as Path<EventFormInput>, { message: msgs[0] });
      }
      toast.error("Couldn't save the event", { description: err.message });
    },
  });

  const num = { valueAsNumber: true } as const;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(
        (v) => mutation.mutate(v),
        () => toast.error("Please fix the highlighted fields"),
      )}
      className="grid gap-8"
    >
      <Section title="Basics" description="What attendees see first in the catalog.">
        <Field label="Title" required error={errors.title?.message} className="md:col-span-2">
          {(p) => <Input {...p} {...register("title")} />}
        </Field>
        <Field
          label="Short summary"
          required
          error={errors.summary?.message}
          hint="One or two sentences, up to 200 characters"
          className="md:col-span-2"
        >
          {(p) => <Input {...p} {...register("summary")} />}
        </Field>
        <Field label="Category" required error={errors.category?.message}>
          {(p) => (
            <NativeSelect {...p} {...register("category")}>
              <option value="">Choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field label="City" required error={errors.city?.message}>
          {(p) => (
            <NativeSelect {...p} {...register("city")}>
              <option value="">Choose…</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field
          label="Description"
          required
          error={errors.description?.message}
          hint="Separate paragraphs with an empty line"
          className="md:col-span-2"
        >
          {(p) => <Textarea {...p} rows={8} {...register("description")} />}
        </Field>
      </Section>

      <Section title="Cover image" description="Required to publish.">
        <div className="md:col-span-2">
          <Controller
            control={control}
            name="coverUrl"
            render={({ field, fieldState }) => (
              <CoverUpload
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </Section>

      <Section title="When & where" description="Times are in Kazakhstan time (UTC+5).">
        <Field label="Starts" required error={errors.startsAt?.message}>
          {(p) => <Input {...p} type="datetime-local" {...register("startsAt")} />}
        </Field>
        <Field label="Ends" required error={errors.endsAt?.message}>
          {(p) => <Input {...p} type="datetime-local" {...register("endsAt")} />}
        </Field>
        <Field label="Venue name" required error={errors.venueName?.message}>
          {(p) => <Input {...p} {...register("venueName")} />}
        </Field>
        <Field label="Address" required error={errors.venueAddress?.message}>
          {(p) => <Input {...p} {...register("venueAddress")} />}
        </Field>
      </Section>

      <Section
        title="Tickets"
        description="Prices in tenge. Quantity can't go below what's already sold."
      >
        <div className="grid gap-4 md:col-span-2">
          {tickets.fields.map((f, i) => {
            const e = errors.ticketTypes?.[i];
            // keyName "key" keeps the database id intact in the form values.
            const realId = form.getValues(`ticketTypes.${i}.id`);
            const soldNow = realId ? (soldByType[realId] ?? 0) : 0;
            return (
              <fieldset
                key={f.key}
                className="grid gap-4 rounded-2xl border bg-background p-4 md:grid-cols-[1.4fr_1fr_1fr_0.8fr]"
              >
                <legend className="sr-only">Ticket type {i + 1}</legend>
                <Field label="Name" required error={e?.name?.message}>
                  {(p) => (
                    <Input
                      {...p}
                      placeholder="General admission"
                      {...register(`ticketTypes.${i}.name`)}
                    />
                  )}
                </Field>
                <Field label="Price, ₸" required error={e?.price?.message}>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={100}
                      step={100}
                      inputMode="numeric"
                      {...register(`ticketTypes.${i}.price`, num)}
                    />
                  )}
                </Field>
                <Field
                  label="Quantity"
                  required
                  error={e?.quantity?.message}
                  hint={soldNow ? `${soldNow} sold` : undefined}
                >
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={Math.max(1, soldNow)}
                      inputMode="numeric"
                      {...register(`ticketTypes.${i}.quantity`, num)}
                    />
                  )}
                </Field>
                <Field label="Max / order" required error={e?.maxPerOrder?.message}>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={1}
                      max={20}
                      inputMode="numeric"
                      {...register(`ticketTypes.${i}.maxPerOrder`, num)}
                    />
                  )}
                </Field>
                <Field
                  label="Description"
                  error={e?.description?.message}
                  className="md:col-span-3"
                >
                  {(p) => (
                    <Input
                      {...p}
                      placeholder="Optional, e.g. Rows 1–5"
                      {...register(`ticketTypes.${i}.description`)}
                    />
                  )}
                </Field>
                <div className="flex items-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ticket type ${i + 1} up`}
                    disabled={i === 0}
                    onClick={() => tickets.move(i, i - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ticket type ${i + 1} down`}
                    disabled={i === tickets.fields.length - 1}
                    onClick={() => tickets.move(i, i + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label={`Remove ticket type ${i + 1}`}
                    disabled={tickets.fields.length === 1 || soldNow > 0}
                    title={soldNow > 0 ? "Ticket types with sales can't be removed" : undefined}
                    onClick={() => tickets.remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </fieldset>
            );
          })}
          {errors.ticketTypes?.root?.message && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.ticketTypes.root.message}
            </p>
          )}
          {errors.ticketTypes?.message && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.ticketTypes.message}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={tickets.fields.length >= 8}
            onClick={() => tickets.append(emptyTicketType)}
          >
            <Plus /> Add ticket type
          </Button>
        </div>
      </Section>

      <Section title="Programme" description="Optional schedule shown on the event page.">
        <div className="grid gap-3 md:col-span-2">
          {program.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No programme items yet.</p>
          )}
          {program.fields.map((f, i) => {
            const e = errors.program?.[i];
            return (
              <fieldset
                key={f.id}
                className="grid gap-3 rounded-2xl border bg-background p-4 md:grid-cols-[110px_1fr_1fr_auto]"
              >
                <legend className="sr-only">Programme item {i + 1}</legend>
                <Field label="Time" required error={e?.time?.message}>
                  {(p) => <Input {...p} type="time" {...register(`program.${i}.time`)} />}
                </Field>
                <Field label="Title" required error={e?.title?.message}>
                  {(p) => <Input {...p} {...register(`program.${i}.title`)} />}
                </Field>
                <Field label="Details" error={e?.description?.message}>
                  {(p) => <Input {...p} {...register(`program.${i}.description`)} />}
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label={`Remove programme item ${i + 1}`}
                    onClick={() => program.remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </fieldset>
            );
          })}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={program.fields.length >= 20}
            onClick={() => program.append({ time: "19:00", title: "", description: "" })}
          >
            <Plus /> Add programme item
          </Button>
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t bg-background/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {mode === "create" ? "Create draft" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 rounded-3xl border bg-card p-5 md:grid-cols-[220px_1fr] md:p-7">
      <div className="grid content-start gap-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
