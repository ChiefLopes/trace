"use client";

import { ArrowRight, ArrowRightLeft, Loader2, Plus, Trash2, Wallet, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
import {
  addEvidenceAction,
  getCaseEvidenceAction,
  removeEvidenceAction,
} from "@/app/(dashboard)/evidence/[caseId]/collection-actions";
import type { EvidenceItemRequest } from "@/features/api/schemas";

export function AddEvidenceButton({
  caseId,
  kind,
  targetId,
  label,
  className,
}: {
  caseId: string;
  kind: "wallet" | "transaction";
  targetId: string;
  label: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceItemRequest[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, startTransition] = useTransition();
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load previous evidence whenever the dialog is opened
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingList(true);
    getCaseEvidenceAction(caseId)
      .then((items) => {
        setEvidenceList(items);
      })
      .catch((err) => {
        console.error("Failed to load previous evidence:", err);
      })
      .finally(() => {
        setIsLoadingList(false);
      });
  }, [isOpen, caseId]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("targetId", targetId);
      formData.set("label", label);
      if (notes.trim()) {
        formData.set("notes", notes.trim());
      }

      const res = await addEvidenceAction(caseId, { status: "idle" }, formData);
      if (res.status === "added") {
        toast.success("Evidence saved to your notebook");
        setNotes("");
        try {
          const freshList = await getCaseEvidenceAction(caseId);
          setEvidenceList(freshList);
        } catch {
          const newItem: EvidenceItemRequest = {
            kind,
            targetId,
            label,
            notes: notes.trim() || null,
          };
          setEvidenceList((prev) => {
            const exists = prev.findIndex((p) => p.kind === kind && p.targetId === targetId);
            if (exists >= 0 && prev[exists]) {
              const next = [...prev];
              const existing = prev[exists]!;
              next[exists] = { ...existing, notes: newItem.notes };
              return next;
            }
            return [newItem, ...prev];
          });
        }
      } else {
        toast.error(res.message || "Could not save evidence");
      }
    });
  };

  const handleRemove = async (itemToRemove: EvidenceItemRequest) => {
    const evId = itemToRemove.id ?? itemToRemove.targetId;
    setDeletingId(evId);
    try {
      const res = await removeEvidenceAction(caseId, evId, { status: "idle" }, new FormData());
      if (res.status === "error") {
        toast.error(res.message || "Could not remove evidence item");
        return;
      }
      setEvidenceList((prev) =>
        prev.filter((item) => {
          if (itemToRemove.id && item.id) {
            return item.id !== itemToRemove.id;
          }
          return item.targetId !== itemToRemove.targetId;
        }),
      );
      toast.success("Evidence item removed");
    } catch {
      toast.error("Could not remove evidence item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground",
          "shadow-[0_6px_18px_-6px_var(--accent)] transition-[filter] hover:brightness-110",
          className,
        )}
      >
        <Plus className="size-4" strokeWidth={2.5} />
        Add to Evidence
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[16px] border border-white/10 bg-linear-to-b from-[#0a1c5a] via-[#050c2e] to-[#03081f] shadow-[0_30px_90px_-20px_rgb(0_0_0/0.95)]">
            {/* Header */}
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="font-display text-[9px] font-black tracking-[0.15em] text-accent uppercase">
                  Evidence Notebook
                </p>
                <h2 className="mt-1 font-display text-xl font-black text-foreground uppercase">
                  Record Evidence
                </h2>
                <p className="mt-1 flex items-center gap-2 text-xs text-[#9aa3bd]">
                  <span className="font-semibold text-accent">{label}</span>
                  <span>·</span>
                  <span className="font-mono text-[10px] text-[#8f98b3] uppercase">{kind}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
                className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#9aa3bd] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </header>

            {/* Scrollable Content Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Previous Evidence List */}
              <section aria-labelledby="previous-evidence-title">
                <div className="flex items-center justify-between">
                  <h3
                    id="previous-evidence-title"
                    className="font-display text-[11px] font-black tracking-wide text-[#9aa3bd] uppercase"
                  >
                    Previous Evidence ({evidenceList.length})
                  </h3>
                  {isLoadingList && <Loader2 className="size-3.5 animate-spin text-accent" />}
                </div>

                <div className="mt-2.5 max-h-[220px] overflow-y-auto rounded-lg border border-white/10 bg-[#040822]/80 p-3">
                  {evidenceList.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#8f98b3]">
                      No previous evidence recorded yet. Add your first piece below.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {evidenceList.map((item) => (
                        <li
                          key={item.id ?? `${item.kind}:${item.targetId}`}
                          className="rounded-md border border-white/5 bg-[#060e33] p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="grid size-5 shrink-0 place-items-center rounded bg-accent/15 text-accent">
                                {item.kind === "wallet" ? (
                                  <Wallet className="size-3" />
                                ) : (
                                  <ArrowRightLeft className="size-3" />
                                )}
                              </span>
                              <span className="truncate text-xs font-semibold text-white">
                                {item.label}
                              </span>
                              <span className="rounded bg-white/5 px-1 py-0.5 font-mono text-[8.5px] text-[#8f98b3] uppercase">
                                {item.kind}
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={deletingId === (item.id ?? item.targetId)}
                              onClick={() => handleRemove(item)}
                              aria-label={`Remove ${item.label}`}
                              className="text-[#8f98b3] transition-colors hover:text-destructive disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          {item.notes && (
                            <p className="mt-2 rounded border border-white/5 bg-[#03061a] p-2 text-xs leading-relaxed text-[#c9d4ee] italic">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Form Input for New Evidence */}
              <form id="add-evidence-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="evidence-notes-input"
                    className="block text-[13px] font-semibold text-white"
                  >
                    Your Theory / What did you notice?
                  </label>
                  <textarea
                    id="evidence-notes-input"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Explain the trail in your own words... e.g. 'The 20 SOL left the treasury at 02:43, hopped through three fresh wallets, and ended at an exchange deposit address.'"
                    className="mt-2.5 w-full resize-y rounded-lg border border-white/10 bg-[#070d2b]/90 px-3.5 py-3 text-xs leading-relaxed text-white outline-none placeholder:text-[#7c84a0] focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer with Submit Button at bottom */}
            <footer className="border-t border-white/10 bg-[#03071e]/90 px-6 py-4">
              <button
                type="submit"
                form="add-evidence-form"
                disabled={isSubmitting}
                className="flex h-[45px] w-full items-center justify-center gap-2 rounded-xl bg-accent font-display text-[11px] font-black tracking-wide text-accent-foreground uppercase shadow-[0_8px_20px_-8px_var(--accent)] transition-[filter] hover:brightness-110 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Evidence…</span>
                  </>
                ) : (
                  <>
                    <span>Submit Evidence</span>
                    <ArrowRight className="size-4" strokeWidth={2.25} />
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
