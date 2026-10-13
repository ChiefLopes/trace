import "server-only";

import { cache } from "react";
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

export type Workspace = z.infer<typeof mockWorkspaceSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
type MockWorkspace = Workspace;
type MockTarget = z.infer<typeof targetSchema>;
type MockLead = z.infer<typeof leadSchema>;

const SOL = 1_000_000_000;

/** MOCK workspace state, values copied from the design. */
const workspaces: Record<string, Workspace> = {
  "case-001": {
    caseId: "case-001",
    caseNumber: "Case 001",
    codename: "The Missing Treasury",
    objectives: [
      { text: "Find the transaction where the funds left the treasury", done: false },
      { text: "Identify the receiving wallet", done: false },
      { text: "Trace the movement of the funds", done: false },
      { text: "Collect important evidence", done: false },
      { text: "Build your theory", done: false },
    ],
    investigator: { rank: "Rookie Investigator", state: "Investigating" },
    hint: "Start with the treasury's outgoing transfers around 02:43 UTC. Which one doesn't fit the pattern?",
    investigating: {
      id: "treasury",
      label: "Treasury Wallet",
      address: "7xH3k9 ... 92KD",
      balanceLamports: 50 * SOL,
      transactionCount: 342,
      tokenCount: 18,
    },
    timeline: [
      {
        id: "tx-1",
        time: "02:39:07",
        direction: "in",
        amountLamports: 5 * SOL,
        counterparty: "4K2c...11ZZ",
        flagged: false,
      },
      {
        id: "tx-2",
        time: "02:41:37",
        direction: "in",
        amountLamports: 10 * SOL,
        counterparty: "6A2c...11ZZ",
        flagged: false,
      },
      {
        id: "tx-3",
        time: "02:43:18",
        direction: "out",
        amountLamports: 20 * SOL,
        counterparty: "9J4K...82PL",
        flagged: true,
      },
      {
        id: "tx-4",
        time: "02:51:04",
        direction: "in",
        amountLamports: 2 * SOL,
        counterparty: "5B3d...22ff",
        flagged: false,
      },
      {
        id: "tx-5",
        time: "03:04:42",
        direction: "out",
        amountLamports: 1.5 * SOL,
        counterparty: null,
        flagged: false,
      },
    ],
    trail: [
      { id: "treasury", label: "Treasury Wallet", address: "7xH3k9 ... 92KD" },
      { id: "wallet-b", label: "Wallet B", address: "9J4K ... 82PL" },
      { id: "wallet-c", label: "Wallet C", address: "3P8N ... 45QR" },
      { id: "wallet-d", label: "Wallet D", address: "6P9R ... 78ST" },
      { id: "exchange", label: "Exchange Wallet", address: "8T3W ... 90UV" },
    ],
    otherWallets: [{ id: "unknown-1f5g", label: "Unknown wallet", address: "1F5g ... 44UU" }],
    evidenceCount: 0,
    lead: {
      id: "lead-time-window",
      title: "Something happened here.",
      message:
        "Start by checking the transactions around {{02:40–03:00 UTC}}. Look for anything that stands out.",
      actionLabel: "View transactions",
      badge: "New lead",
      trigger: "arrival",
      target: { kind: "transaction", id: "tx-3" },
    },
  },
};

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

export type Transaction = z.infer<typeof transactionSchema>;

/** Any wallet known to the case, on the trail or not. */
export function findCaseWallet(workspace: Pick<Workspace, "trail" | "otherWallets">, id: string) {
  return [...workspace.trail, ...workspace.otherWallets].find((w) => w.id === id);
}

/** MOCK transaction details by case, then transaction id. Signatures are placeholders. */
const transactions: Record<string, Record<string, Transaction>> = {
  "case-001": {
    "tx-3": {
      id: "tx-3",
      signature: "5fJ8...2K9L",
      status: "confirmed",
      time: "02:43:18 UTC",
      amountLamports: 20 * SOL,
      fromWalletId: "treasury",
      toWalletId: "wallet-b",
      progress: { completed: 1, total: 5 },
      lead: {
        id: "lead-wallet-b",
        badge: "New lead",
        trigger: "arrival",
        title: "Funds were sent to Wallet B.",
        message: "The funds didn't stay here long. See where Wallet B moved them next.",
        actionLabel: "Inspect receiving wallet",
        target: { kind: "wallet", id: "wallet-b" },
      },
    },
  },
};

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

export type WalletActivity = z.infer<typeof walletActivitySchema>;

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

export type WalletDetail = z.infer<typeof mockWalletDetailSchema>;
type MockWalletDetail = WalletDetail;

/** MOCK wallet details by case, then trail wallet id. Values copied from the design. */
const wallets: Record<string, Record<string, WalletDetail>> = {
  "case-001": {
    "wallet-b": {
      id: "wallet-b",
      label: "Wallet B",
      address: "9J4Kp2Lm8Qr5Vx3Nw7Zc1Tb6Fd4Gh9Mn2Qp8Rv5Vx3N82PL",
      description: "A freshly created wallet with no prior history. Received the missing funds.",
      balanceLamports: 0.5 * SOL,
      transactionCount: 12,
      tokenCount: 3,
      firstActivity: "2026-10-01",
      lastActivity: "2026-10-01",
      receivedFromWalletId: "treasury",
      sentToWalletId: "wallet-c",
      activity: [
        {
          id: "wb-1",
          time: "02:43:18",
          direction: "in",
          amountLamports: 20 * SOL,
          counterparty: "7xH3k9...92KD",
          key: true,
          flagged: true,
          link: { kind: "transaction", id: "tx-3" },
        },
      ],
    },
  },
};

/** A case is solved once every objective is done (derived, never stored separately). */
export function isSolved(workspace: Pick<Workspace, "objectives">) {
  return workspace.objectives.length > 0 && workspace.objectives.every((o) => o.done);
}

/**
 * MOCK preview of a finished case, until the backend tracks real progress:
 * every objective done, no pending lead.
 */
export type WorkspacePreview = "solved";

/** Fetch workspace from backend with fallback to mock workspace (memoized per request). */
export const getWorkspace = cache(async function getWorkspace(
  caseId: string,
  preview?: WorkspacePreview,
): Promise<Workspace | null> {
  let workspace: Workspace | null = null;
  try {
    const apiWorkspace = await getWorkspaceApi(caseId);
    if (apiWorkspace) {
      workspace = convertToMockWorkspace(apiWorkspace);
    }
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }

  if (!workspace) {
    const found = workspaces[caseId];
    workspace = found ? mockWorkspaceSchema.parse(found) : null;
  }

  if (!workspace) return null;
  if (preview !== "solved") return workspace;
  return {
    ...workspace,
    objectives: workspace.objectives.map((o) => ({ ...o, done: true })),
    lead: null,
  };
});

/** Convert API Workspace to MockWorkspace for components.. */
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

/** Fetch transaction detail from backend with fallback to mock transaction. */
export async function getTransaction(caseId: string, id: string): Promise<Transaction | null> {
  try {
    const apiTransaction = await getTransactionDetailApi(caseId, id);
    if (apiTransaction) {
      return convertToMockTransaction(apiTransaction);
    }
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = transactions[caseId]?.[id];
  return found ? transactionSchema.parse(found) : null;
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

/** Fetch wallet detail from backend with fallback to mock wallet. */
export async function getWalletDetail(caseId: string, id: string): Promise<WalletDetail | null> {
  try {
    const apiWallet = await getWalletDetailApi(caseId, id);
    if (apiWallet) {
      return convertToMockWalletDetail(apiWallet);
    }
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = wallets[caseId]?.[id];
  return found ? mockWalletDetailSchema.parse(found) : null;
}

/** Convert API WalletDetail to MockWalletDetail for components. */
function convertToMockWalletDetail(apiWallet: ApiWalletDetail): WalletDetail {
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

export const transactionParams = Object.entries(transactions).flatMap(([caseId, byId]) =>
  Object.keys(byId).map((transactionId) => ({ caseId, transactionId })),
);

export const walletParams = Object.entries(wallets).flatMap(([caseId, byId]) =>
  Object.keys(byId).map((walletId) => ({ caseId, walletId })),
);

/** Mock case IDs for static generation. */
export const caseIds: string[] = ["case-001"];

export {
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
  type ApiWorkspace,
  type ApiWalletDetail,
  type ApiTransactionDetail,
  mockWorkspaceSchema,
  type MockWorkspace,
  targetSchema as mockTargetSchema,
  type MockTarget as Target,
  leadSchema as mockLeadSchema,
  type MockLead as Lead,
  transactionSchema,
  walletActivitySchema,
  mockWalletDetailSchema,
  type MockWalletDetail,
};
