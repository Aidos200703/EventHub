"use client";

import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { CITIES } from "@/lib/constants";
import { profileSchema, type ProfileInput } from "@/lib/validation/account";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

type ProfileValues = z.output<typeof profileSchema>;

export function ProfileForm({ defaults, email }: { defaults: ProfileInput; email: string }) {
  const router = useRouter();
  const form = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });
  const { errors, isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      api<ProfileValues>("/api/account/profile", {
        method: "PATCH",
        json: values,
      }),
    onSuccess: (saved) => {
      form.reset({
        name: saved.name,
        phone: saved.phone ?? "",
        city: saved.city ?? "",
        bio: saved.bio ?? "",
      });
      toast.success("Profile saved");
      router.refresh();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) {
        for (const [k, v] of Object.entries(err.fields))
          form.setError(k as Path<ProfileInput>, { message: v[0] });
      }
      toast.error("Couldn't save profile", { description: err.message });
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      className="grid max-w-2xl gap-6 rounded-3xl border bg-card p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name?.message} className="sm:col-span-2">
          {(p) => <Input {...p} autoComplete="name" {...form.register("name")} />}
        </Field>
        <Field label="Email" hint="Email is used to sign in and can't be changed here.">
          {(p) => <Input {...p} value={email} readOnly disabled />}
        </Field>
        <Field label="Phone" error={errors.phone?.message} hint="Used to pre-fill checkout">
          {(p) => (
            <Input
              {...p}
              type="tel"
              autoComplete="tel"
              placeholder="+7 701 234 56 78"
              {...form.register("phone")}
            />
          )}
        </Field>
        <Field label="Home city" error={errors.city?.message}>
          {(p) => (
            <NativeSelect {...p} {...form.register("city")}>
              <option value="">Not set</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field
          label="About"
          error={errors.bio?.message}
          className="sm:col-span-2"
          hint="Shown on your event pages if you're an organizer"
        >
          {(p) => <Textarea {...p} rows={4} {...form.register("bio")} />}
        </Field>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!isDirty || mutation.isPending}
          onClick={() => form.reset()}
        >
          Discard
        </Button>
      </div>
    </form>
  );
}
