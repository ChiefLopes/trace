import "server-only";

import { z } from "zod";

import {
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
  type Workspace as ApiWorkspace,
  type WalletDetail as ApiWalletDetail,
  type TransactionDetail as ApiTransactionDetail,
} from "@/features/api/schemas";

import {
  getWorkspace as getWorkspaceApi,
  getWalletDetail as getWalletDetailApi,
  getTransactionDetail as getTransactionDetailApi,
} from "./server-api";

export {
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
  type ApiWorkspace,
  type ApiWalletDetail,
  type ApiTransactionDetail,
  mockWorkspaceSchema,
  type MockWorkspace as Workspace,
  type TimelineEntry,
  targetSchema as mockTargetSchema,
  type MockTarget as Target,
  leadSchema as mockLeadSchema,
  type MockLead as Lead,
  transactionSchema,
  type Transaction,
  walletActivitySchema,
  type WalletActivity,
  mockWalletDetailSchema,
  type MockWalletDetail as WalletDetail,
};

/** MOCK types for components - these match the existing component expectations */
const walletSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
});

const timelineEntrySchema = z.object({
  id: z.string(),
  time: z.string(),
  direction: z.enum(["in", "out"]),
  amountLamports: z.number().int().nonnegative(),
  counterparty: z.string().nullable(),
  flagged: z.boolean(),
});

const targetSchema = z.object({
  kind: z.enum(["transaction", "wallet"]),
  id: z.string(),
});

const leadSchema = z.object({
  id: z.string(),
  badge: z.string(),
  trigger: z.enum(["arrival", "idle"]),
  title: z.string(),
  message: z.string(),
  actionLabel: z.string(),
  target: targetSchema,
});

/** MOCK type for workspace - matches component expectations */
const mockWorkspaceSchema = z.object({
  caseId: z.string(),
  caseNumber: z.string(),
  codename: z.string(),
  objectives: z.array(z.object({ text: z.string(), done: z.boolean() })),
  investigator: z.object({ rank: z.string(), state: z.string() }),
  hint: z.string(),
  investigating: walletSummarySchema.extend({
    balanceLamports: z.number().int().nonnegative(),
    transactionCount: z.number().int().nonnegative(),
    tokenCount: z.number().int().nonnegative(),
  }),
  timeline: z.array(timelineEntrySchema),
  trail: z.array(walletSummarySchema),
  otherWallets: z.array(walletSummarySchema),
  evidenceCount: z.number().int().nonnegative(),
  lead: leadSchema.nullable(),
});

type MockWorkspace = z.infer<typeof mockWorkspaceSchema>;
type TimelineEntry = z.infer<typeof timelineEntrySchema>;
type MockTarget = z.infer<typeof targetSchema>;
type MockLead = z.infer<typeof leadSchema>;

/** MOCK type for transaction - matches component expectations */
const transactionSchema = z.object({
  id: z.string(),
  signature: z.string(),
  status: z.enum(["confirmed", "finalized", "failed"]),
  time: z.string(),
  amountLamports: z.number().int().nonnegative(),
  fromWalletId: z.string(),
  toWalletId: z.string(),
  progress: z.object({ completed: z.number().int(), total: z.number().int() }),
  lead: leadSchema.nullable(),
});

type Transaction = z.infer<typeof transactionSchema>;

/** MOCK type for wallet activity - matches component expectations */
const walletActivitySchema = z.object({
  id: z.string(),
  time: z.string(),
  direction: z.enum(["in", "out"]),
  amountLamports: z.number().int().nonnegative(),
  counterparty: z.string(),
  key: z.boolean(),
  flagged: z.boolean(),
  link: targetSchema,
});

type WalletActivity = z.infer<typeof walletActivitySchema>;

/** MOCK type for wallet detail - matches component expectations */
const mockWalletDetailSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  description: z.string(),
  balanceLamports: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  tokenCount: z.number().int().nonnegative(),
  firstActivity: z.string(),
  lastActivity: z.string(),
  receivedFromWalletId: z.string().nullable(),
  sentToWalletId: z.string().nullable(),
  activity: z.array(walletActivitySchema),
});

type MockWalletDetail = z.infer<typeof mockWalletDetailSchema>;

/** Any wallet known to the case, on the trail or not. */
export function findCaseWallet(
  workspace: Pick<MockWorkspace, "trail" | "otherWallets">,
  id: string,
) {
  return [...workspace.trail, ...workspace.otherWallets].find((w) => w.id === id);
}

/** A case is solved once every objective is done (derived, never stored separately). */
export function isSolved(workspace: Pick<MockWorkspace, "objectives">) {
  return workspace.objectives.length > 0 && workspace.objectives.every((o) => o.done);
}

/** Fetch workspace from backend. Returns null if not found. */
export async function getWorkspace(caseId: string): Promise<MockWorkspace | null> {
  try {
    const workspace = await getWorkspaceApi(caseId);
    const mockWorkspace = convertToMockWorkspace(workspace);
    return mockWorkspace;
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** Convert API Workspace to MockWorkspace for components. */
function convertToMockWorkspace(apiWorkspace: ApiWorkspace): MockWorkspace {
  return {
    caseId: apiWorkspace.caseId,
    caseNumber: apiWorkspace.caseNumber,
    codename: apiWorkspace.codename,
    objectives: apiWorkspace.objectives,
    investigator: apiWorkspace.investigator,
    hint: apiWorkspace.hint,
    investigating: {
      id: apiWorkspace.investigating.id,
      label: apiWorkspace.investigating.label,
      address: apiWorkspace.investigating.address,
      balanceLamports: apiWorkspace.investigating.balanceLamports,
      transactionCount: apiWorkspace.investigating.transactionCount,
      tokenCount: apiWorkspace.investigating.tokenCount,
    },
    timeline: apiWorkspace.timeline.map((t) => ({
      id: t.id,
      time: t.time,
      direction: t.direction,
      amountLamports: t.amountLamports,
      counterparty: t.counterparty,
      flagged: t.flagged,
    })),
    trail: apiWorkspace.trail.map((w) => ({
      id: w.id,
      label: w.label,
      address: w.address,
    })),
    otherWallets: apiWorkspace.otherWallets.map((w) => ({
      id: w.id,
      label: w.label,
      address: w.address,
    })),
    evidenceCount: apiWorkspace.evidenceCount,
    lead: apiWorkspace.lead
      ? {
          id: apiWorkspace.lead.id,
          badge: apiWorkspace.lead.badge,
          trigger: apiWorkspace.lead.trigger,
          title: apiWorkspace.lead.title,
          message: apiWorkspace.lead.message,
          actionLabel: apiWorkspace.lead.actionLabel,
          target: apiWorkspace.lead.target,
        }
      : null,
  };
}

/** Fetch transaction detail from backend. Returns null if not found. */
export async function getTransaction(caseId: string, id: string): Promise<Transaction | null> {
  try {
    const apiTransaction = await getTransactionDetailApi(caseId, id);
    return convertToMockTransaction(apiTransaction);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** Convert API TransactionDetail to mock Transaction for components. */
function convertToMockTransaction(apiTx: ApiTransactionDetail): Transaction {
  return {
    id: apiTx.id,
    signature: apiTx.signature,
    status: apiTx.status,
    time: apiTx.time,
    amountLamports: apiTx.amountLamports,
    fromWalletId: apiTx.fromWalletId,
    toWalletId: apiTx.toWalletId,
    progress: apiTx.progress,
    lead: apiTx.lead
      ? {
          id: apiTx.lead.id,
          badge: apiTx.lead.badge,
          trigger: apiTx.lead.trigger,
          title: apiTx.lead.title,
          message: apiTx.lead.message,
          actionLabel: apiTx.lead.actionLabel,
          target: apiTx.lead.target,
        }
      : null,
  };
}

/** Fetch wallet detail from backend. Returns null if not found. */
export async function getWalletDetail(
  caseId: string,
  id: string,
): Promise<MockWalletDetail | null> {
  try {
    const apiWallet = await getWalletDetailApi(caseId, id);
    return convertToMockWalletDetail(apiWallet);
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    if (error instanceof Error && error.name === "ApiError" && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/** Convert API WalletDetail to MockWalletDetail for components. */
function convertToMockWalletDetail(apiWallet: ApiWalletDetail): MockWalletDetail {
  return {
    id: apiWallet.id,
    label: apiWallet.label,
    address: apiWallet.address,
    description: apiWallet.description,
    balanceLamports: apiWallet.balanceLamports,
    transactionCount: apiWallet.transactionCount,
    tokenCount: apiWallet.tokenCount,
    firstActivity: apiWallet.firstActivity,
    lastActivity: apiWallet.lastActivity,
    receivedFromWalletId: apiWallet.receivedFromWalletId,
    sentToWalletId: apiWallet.sentToWalletId,
    activity: apiWallet.activity.map((a) => {
      // Activity rows in wallet view represent transactions.
      // If the API provided a transaction link use it; otherwise use the entry's transaction ID.
      const txId = a.link?.kind === "transaction" && a.link.id ? a.link.id : a.id;
      return {
        id: a.id,
        time: a.time,
        direction: a.direction,
        amountLamports: a.amountLamports,
        counterparty: a.counterparty ?? "",
        key: a.key,
        flagged: a.flagged,
        link: { kind: "transaction" as const, id: txId },
      };
    }),
  };
}

// Known params for static generation (generateStaticParams)
export const transactionParams: Array<{ caseId: string; transactionId: string }> = [
  { caseId: "case-001", transactionId: "tx-drain" },
  { caseId: "case-001", transactionId: "tx-drain-in" },
  { caseId: "case-001", transactionId: "tx-hop-1" },
  { caseId: "case-001", transactionId: "tx-hop-1-in" },
  { caseId: "case-001", transactionId: "tx-hop-2" },
  { caseId: "case-001", transactionId: "tx-hop-2-in" },
  { caseId: "case-001", transactionId: "tx-deposit" },
  { caseId: "case-001", transactionId: "tx-deposit-in" },
];

export const walletParams: Array<{ caseId: string; walletId: string }> = [
  { caseId: "case-001", walletId: "treasury" },
  { caseId: "case-001", walletId: "wallet-b" },
  { caseId: "case-001", walletId: "wallet-c" },
  { caseId: "case-001", walletId: "wallet-d" },
  { caseId: "case-001", walletId: "exchange" },
];

/** Mock case IDs for static generation - replace with real API when available. */
export const caseIds: string[] = ["case-001"];
