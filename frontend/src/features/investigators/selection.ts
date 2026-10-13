import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { defaultInvestigatorId, getInvestigator, type Investigator } from "./data";
import { getSession } from "@/features/auth/server-api";

export const SELECTED_INVESTIGATOR_COOKIE = "trace_investigator";

export const selectedInvestigatorCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
} as const;

/**
 * Investigator choice is stored on the authenticated backend profile,
 * falling back to local cookie and default.
 */
const SHOW_PLAYER_CHOICE = process.env.SHOW_PLAYER_CHOICE !== "false";

/** The player's chosen investigator, or the design default if none is available. */
export const getSelectedInvestigator = cache(
  async function getSelectedInvestigator(): Promise<Investigator> {
    const fallback = getInvestigator(defaultInvestigatorId)!;
    if (!SHOW_PLAYER_CHOICE) return fallback;

    try {
      const session = await getSession();
      if (session.user?.selectedInvestigatorId) {
        const found = getInvestigator(session.user.selectedInvestigatorId);
        if (found) return found;
      }
    } catch {
      // Unauthenticated or network error
    }

    try {
      const cookieStore = await cookies();
      const id = cookieStore.get(SELECTED_INVESTIGATOR_COOKIE)?.value;
      if (id) {
        const found = getInvestigator(id);
        if (found) return found;
      }
    } catch {
      // Outside request store
    }

    return fallback;
  },
);
