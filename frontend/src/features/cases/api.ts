"use client";

import { api } from "@/lib/api/browser";

import {
  caseCatalogItemSchema,
  caseBriefSchema,
  caseFileSchema,
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
} from "@/features/api/schemas";

import type {
  CaseCatalogItem,
  CaseBrief,
  CaseFile,
  Workspace,
  WalletDetail,
  TransactionDetail,
} from "@/features/api/schemas";

export async function listCases(): Promise<CaseCatalogItem[]> {
  return api.get("/api/cases", caseCatalogItemSchema.array());
}

export async function getCaseBrief(caseId: string): Promise<CaseBrief> {
  return api.get(`/api/cases/${caseId}`, caseBriefSchema);
}

export async function getCaseFile(caseId: string): Promise<CaseFile> {
  return api.get(`/api/cases/${caseId}/file`, caseFileSchema);
}

export async function getWorkspace(caseId: string): Promise<Workspace> {
  return api.get(`/api/cases/${caseId}/workspace`, workspaceSchema);
}

export async function getWalletDetail(caseId: string, walletId: string): Promise<WalletDetail> {
  return api.get(`/api/cases/${caseId}/wallets/${walletId}`, walletDetailSchema);
}

export async function getTransactionDetail(
  caseId: string,
  txId: string,
): Promise<TransactionDetail> {
  return api.get(`/api/cases/${caseId}/transactions/${txId}`, transactionDetailSchema);
}
