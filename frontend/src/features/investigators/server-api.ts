import "server-only";

import { z } from "zod";

import { serverApi } from "@/lib/api/server";

import {
  investigatorsResponseSchema,
  updateInvestigatorRequestSchema,
} from "@/features/api/schemas";

import type { InvestigatorsResponse, UpdateInvestigatorRequest } from "@/features/api/schemas";

export async function listInvestigators(): Promise<InvestigatorsResponse> {
  return serverApi.get("/api/investigators", investigatorsResponseSchema);
}

export async function updateInvestigator(values: UpdateInvestigatorRequest): Promise<void> {
  const parsed = updateInvestigatorRequestSchema.parse(values);
  await serverApi.put("/api/user/investigator", z.unknown(), { body: parsed });
}
