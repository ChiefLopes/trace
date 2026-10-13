"use client";

import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { fieldErrorId } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { TraceLossModal } from "@/features/investigation/components/trace-loss-modal";
import { cn } from "@/lib/utils/cn";

import type { EvidenceFormState } from "../data";

export type Choice = { value: string; label: string };

type EvidenceFormProps = {
  action: (state: EvidenceFormState, formData: FormData) => Promise<EvidenceFormState>;
  destinations: Choice[];
  scenarios: Choice[];
  theoryPlaceholder: string;
  caseId: string;
  evidenceCount?: number;
  defaultDestination?: string;
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

/** "Where did the funds go?" Pick destination + scenario, write a theory, verify trace. */
export function EvidenceForm({
  action,
  destinations,
  scenarios,
  theoryPlaceholder,
  caseId,
  evidenceCount = 0,
  defaultDestination,
}: EvidenceFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const theoryId = useId();
  const invalid = state.status === "invalid" ? state : null;

  // Redirect to outcome page on success
  useEffect(() => {
    if (state.status === "received") {
      toast.success("Trace verified! Case solved.", { description: state.message });
      router.push(`/investigation/${caseId}/outcome`);
      router.refresh();
    }
  }, [state, caseId, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (evidenceCount === 0) {
      e.preventDefault();
      toast.warning("Evidence required", {
        description:
          "Please pin at least one piece of evidence from your investigation before verifying the trace.",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const destination = formData.get("destination");

    // If a destination was picked and it's not the correct exchange wallet, show loss modal
    if (destination && destination !== "exchange") {
      e.preventDefault();
      setIsLossModalOpen(true);
      return;
    }
  };

  return (
    <>
      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-[26px]"
      >
        {invalid && <FormAlert message="Check the highlighted answers and try again." />}

        {evidenceCount === 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            ⚠️ <strong>Evidence reminder:</strong> You currently have 0 pinned items. Pin wallets or
            transactions from your investigation before verifying trace.
          </div>
        )}

        <ChoiceGroup
          name="destination"
          legend="Which wallet was the final destination?"
          choices={destinations}
          error={invalid?.fieldErrors.destination}
          defaultValue={invalid?.values.destination ?? defaultDestination}
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
          className="group relative flex h-[45px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-accent via-[#ffbe4d] to-accent font-display text-[12px] font-black tracking-wide text-accent-foreground uppercase shadow-[0_6px_22px_-6px_var(--accent)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(252,163,17,0.75)] hover:brightness-105 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
          />
          {pending ? (
            <span className="relative z-10 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying Trace…</span>
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-2">
              <ShieldCheck
                className="size-4 transition-transform duration-200 group-hover:scale-120 group-hover:rotate-6"
                strokeWidth={2.5}
              />
              <span>Verify Trace</span>
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-1.5"
                strokeWidth={2.25}
              />
            </span>
          )}
        </button>
      </form>

      <TraceLossModal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        onRetry={() => setIsLossModalOpen(false)}
        title="Investigation Trail Lost"
        message="The final destination wallet you selected is incorrect. Stolen funds continued moving past this address or never arrived there. Review your transactions and trail evidence."
        caseId={caseId}
      />
    </>
  );
}
