import "server-only";

import { serverApi } from "@/lib/api/server";

import {
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
} from "@/features/api/schemas";

import type { Workspace, WalletDetail, TransactionDetail } from "@/features/api/schemas";

export async function getWorkspace(caseId: string): Promise<Workspace> {
  return serverApi.get(`/api/cases/${caseId}/workspace`, workspaceSchema);
}

export async function getWalletDetail(caseId: string, walletId: string): Promise<WalletDetail> {
  return serverApi.get(`/api/cases/${caseId}/wallets/${walletId}`, walletDetailSchema);
}

export async function getTransactionDetail(
  caseId: string,
  txId: string,
): Promise<TransactionDetail> {
  return serverApi.get(`/api/cases/${caseId}/transactions/${txId}`, transactionDetailSchema);
}
