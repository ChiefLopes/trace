import "server-only";

import { z } from "zod";

import { caseBriefSchema, caseCatalogItemSchema, caseFileSchema } from "@/features/api/schemas";

import type { CaseBrief, CaseCatalogItem, CaseFile } from "@/features/api/schemas";

import { getCaseBrief as getCaseBriefApi, getCaseFile as getCaseFileApi } from "./server-api";

export { caseBriefSchema, caseCatalogItemSchema, caseFileSchema };
export type { CaseBrief, CaseCatalogItem, CaseFile };

/** Fetch case brief from backend. Returns null if not found. */
export async function getCaseBrief(caseId: string): Promise<CaseBrief | null> {
  try {
    return await getCaseBriefApi(caseId);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** Fetch case file from backend. Returns null if not found. */
export async function getCaseFile(caseId: string): Promise<CaseFile | null> {
  try {
    return await getCaseFileApi(caseId);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** List all available cases from backend. */
export async function listCases(): Promise<CaseCatalogItem[]> {
  const { listCases: listCasesApi } = await import("./server-api");
  return listCasesApi();
}

/** Mock case IDs for static generation - replace with real API when available. */
export const caseIds: string[] = ["case-001"];
