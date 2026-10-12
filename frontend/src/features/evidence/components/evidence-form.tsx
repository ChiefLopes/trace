"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { fieldErrorId } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";

import type { EvidenceFormState } from "../data";

export type Choice = { value: string; label: string };

type EvidenceFormProps = {
  action: (state: EvidenceFormState, formData: FormData) => Promise<EvidenceFormState>;
  destinations: Choice[];
  scenarios: Choice[];
  theoryPlaceholder: string;
  caseId: string;
};

function ChoiceGroup({
  name,
  legend,
  choices,
  error,
  defaultValue,
}: {
  name: string;
  legend: string;
  choices: Choice[];
  error?: string;
  defaultValue?: string;
}) {
  return (
    <fieldset aria-describedby={error ? fieldErrorId(name) : undefined}>
      <legend className="text-[13px] font-semibold">{legend}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              "flex min-h-[45px] items-center gap-3 rounded-lg border bg-[#070d2b]/80 px-3.5 py-2 text-xs transition-colors",
              "hover:border-white/25 has-checked:border-accent has-checked:bg-[#0b1d5e]",
              "has-focus-visible:ring-2 has-focus-visible:ring-accent/60",
              error ? "border-destructive/60" : "border-white/[0.08]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              defaultChecked={choice.value === defaultValue}
              className="peer size-4 shrink-0 appearance-none rounded-full border border-white/40 transition-colors outline-none checked:border-[5px] checked:border-accent"
            />
            <span className="leading-snug">{choice.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={fieldErrorId(name)} className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** "Where did the funds go?" Pick destination + scenario, write a theory, submit. */
export function EvidenceForm({
  action,
  destinations,
  scenarios,
  theoryPlaceholder,
  caseId,
}: EvidenceFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const theoryId = useId();
  const invalid = state.status === "invalid" ? state : null;

  // Redirect to outcome page on success
  useEffect(() => {
    if (state.status === "received") {
      toast.success("Evidence submitted", { description: state.message });
      router.push(`/investigation/${caseId}/outcome`);
      router.refresh();
    }
  }, [state, caseId, router]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-[26px]">
      {invalid && <FormAlert message="Check the highlighted answers and try again." />}

      <ChoiceGroup
        name="destination"
        legend="Which wallet was the final destination?"
        choices={destinations}
        error={invalid?.fieldErrors.destination}
        defaultValue={invalid?.values.destination}
      />
      <ChoiceGroup
        name="scenario"
        legend="What happened?"
        choices={scenarios}
        error={invalid?.fieldErrors.scenario}
        defaultValue={invalid?.values.scenario}
      />

      <div>
        <label htmlFor={theoryId} className="text-[13px] font-semibold">
          Your Theory
        </label>
        <textarea
          id={theoryId}
          name="theory"
          rows={4}
          defaultValue={invalid?.values.theory}
          placeholder={theoryPlaceholder}
          aria-invalid={!!invalid?.fieldErrors.theory}
          aria-describedby={invalid?.fieldErrors.theory ? fieldErrorId("theory") : undefined}
          className={cn(
            "mt-3 w-full resize-y rounded-lg border bg-[#070d2b]/80 px-3.5 py-3 text-xs leading-relaxed placeholder:text-[#7c84a0]",
            "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
            invalid?.fieldErrors.theory ? "border-destructive/60" : "border-white/[0.08]",
          )}
        />
        {invalid?.fieldErrors.theory && (
          <p id={fieldErrorId("theory")} className="mt-2 text-xs text-destructive">
            {invalid.fieldErrors.theory}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[45px] items-center justify-center gap-2 rounded-xl bg-accent font-display text-[11px] font-black tracking-wide text-accent-foreground uppercase shadow-[0_8px_20px_-8px_var(--accent)] transition-[filter] hover:brightness-110 disabled:opacity-70"
      >
        {pending ? "Submitting…" : "Submit evidence"}
        <ArrowRight className="size-4" strokeWidth={2.25} />
      </button>
    </form>
  );
}
