import "server-only";

import { cookies } from "next/headers";

import { listCases } from "./data";

export const ACTIVE_CASE_COOKIE = "trace_active_case";
export const CLOSED_CASES_COOKIE = "trace_closed_cases";

export const caseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
} as const;

/** Get the currently active case ID from cookie. Returns null if none or closed. */
export async function getActiveCaseId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const id = cookieStore.get(ACTIVE_CASE_COOKIE)?.value?.trim();
    if (!id || id === "none") return null;
    return id;
  } catch {
    return null;
  }
}

/** Get list of case IDs that have been closed/solved. */
export async function getClosedCaseIds(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(CLOSED_CASES_COOKIE)?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Check if a specific case is closed. */
export async function isCaseClosed(caseId: string): Promise<boolean> {
  const closed = await getClosedCaseIds();
  return closed.includes(caseId);
}

/** Mark a case as closed and clear it as the active case. */
export async function closeCase(caseId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const closed = await getClosedCaseIds();
    if (!closed.includes(caseId)) {
      closed.push(caseId);
      cookieStore.set(CLOSED_CASES_COOKIE, JSON.stringify(closed), caseCookieOptions);
    }
    const currentActive = cookieStore.get(ACTIVE_CASE_COOKIE)?.value;
    if (currentActive === caseId || !currentActive) {
      cookieStore.set(ACTIVE_CASE_COOKIE, "none", caseCookieOptions);
    }
  } catch {
    // Outside request context
  }
}

/** Set a new or existing case as active (resets closed state if restarted). */
export async function setActiveCase(caseId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_CASE_COOKIE, caseId, caseCookieOptions);
    // If the user actively starts this case, remove it from closed so they can play it fresh
    const closed = await getClosedCaseIds();
    if (closed.includes(caseId)) {
      const updated = closed.filter((id) => id !== caseId);
      cookieStore.set(CLOSED_CASES_COOKIE, JSON.stringify(updated), caseCookieOptions);
    }
  } catch {
    // Outside request context
  }
}

/** Find the next available open case, or null if all are completed. */
export async function getNextOpenCaseId(currentCaseId?: string): Promise<string | null> {
  const cases = await listCases();
  const closed = await getClosedCaseIds();

  // If a current case is given, prefer the next one in sequence
  if (currentCaseId) {
    const currentIndex = cases.findIndex((c) => c.id === currentCaseId);
    if (currentIndex >= 0 && currentIndex < cases.length - 1) {
      const nextCandidate = cases[currentIndex + 1]!;
      if (!closed.includes(nextCandidate.id)) {
        return nextCandidate.id;
      }
    }
  }

  // Otherwise, find the first case that is not closed
  const unclosed = cases.find((c) => !closed.includes(c.id));
  if (unclosed) return unclosed.id;

  // Fallback to case-002 or first case if all closed
  return cases.find((c) => c.id !== currentCaseId)?.id ?? null;
}
