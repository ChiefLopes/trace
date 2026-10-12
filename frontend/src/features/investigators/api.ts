"use client";

import { z } from "zod";

import { api } from "@/lib/api/browser";

import {
  investigatorsResponseSchema,
  updateInvestigatorRequestSchema,
} from "@/features/api/schemas";

import type { InvestigatorsResponse, UpdateInvestigatorRequest } from "@/features/api/schemas";

export async function listInvestigators(): Promise<InvestigatorsResponse> {
  return api.get("/api/investigators", investigatorsResponseSchema);
}

export async function updateInvestigator(values: UpdateInvestigatorRequest): Promise<void> {
  const parsed = updateInvestigatorRequestSchema.parse(values);
  await api.put("/api/user/investigator", z.unknown(), { body: parsed });
}
