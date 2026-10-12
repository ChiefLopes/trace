import "server-only";

import { z } from "zod";

import {
  caseBriefSchema,
  caseCatalogItemSchema,
  caseFileSchema,
  type CaseBrief,
  type CaseCatalogItem,
  type CaseFile,
} from "@/features/api/schemas";

import {
  getCaseBrief as getCaseBriefApi,
  getCaseFile as getCaseFileApi,
  listCases as listCasesApi,
} from "./server-api";

export { caseBriefSchema, caseCatalogItemSchema, caseFileSchema };
export type { CaseBrief, CaseCatalogItem, CaseFile };

/** MOCK case content until the backend serves cases. Keyed by case id. */
const cases: Record<string, CaseBrief> = {
  "case-001": {
    id: "case-001",
    number: "Case 001",
    title: "Trace the missing 20 SOL",
    brief: [
      "{{20\u00a0SOL}} disappeared. Find out where it went.",
      "At {{02:43\u00a0UTC}}, a project's treasury wallet sent {{20\u00a0SOL}} to an unknown wallet.",
      "No one authorized the transfer.",
      "The treasury wallet had been holding funds for an upcoming project launch. Minutes after the transfer, the receiving wallet moved the funds again.",
      "Someone is moving the money. Your job is to {{find out where it went.}}",
    ],
    objectives: [
      "Identify the transaction where the 20 SOL left the treasury.",
      "Investigate the wallet that received the funds.",
      "Find out where the 20 SOL went after arriving.",
      "Save the transactions and wallets that help explain the trail.",
      "Use your investigation board to reconstruct the movement of the funds.",
      "Explain where the money went and what happened to it.",
    ],
  },
  "case-002": {
    id: "case-002",
    number: "Case 002",
    title: "The 120,000 wETH Wormhole Bridge Exploit",
    brief: [
      "{{120,000 wETH}} (~$325M USD) was fraudulently minted on the Wormhole Solana Bridge.",
      "On {{February 2, 2022 at 18:24 UTC}}, an attacker exploited a vulnerability in the Wormhole core program on Solana.",
      "The attacker bypassed Guardian signature verification by injecting a fake Instructions sysvar account via deprecated {{load_instruction_at}}.",
      "A fraudulent Validator Action Approval (VAA) was posted via {{post_vaa}}, enabling {{complete_wrapped}} to mint 120,000 unbacked wETH.",
      "The attacker bridged 93,750 ETH directly to Ethereum address {{0x629e7Da20197a5429d30da36E77d06CdF796b71A}}.",
    ],
    objectives: [
      "Inspect the signature verification bypass transaction (tx-verify-bypass).",
      "Examine the fraudulent Guardian post_vaa authorization record.",
      "Trace the complete_wrapped mint transaction that spawned 120,000 wETH.",
      "Trace the capital outflow bridging 93,750 ETH across to Ethereum.",
      "Submit your forensic conclusion on the exploit vector and exit address.",
    ],
  },
};

/** MOCK case files until the backend serves them. Values copied from the design. */
const caseFiles: Record<string, CaseFile> = {
  "case-001": {
    id: "case-001",
    number: "Case 001",
    codename: "The Missing Treasury",
    difficulty: "Rookie",
    status: "open",
    briefing: [
      "At {{02:43\u00a0UTC}}, 20 SOL disappeared from a project's treasury wallet.",
      "The funds were moved through several wallets.",
      "Your task is to determine where the money went and identify the trail that connects the wallets.",
    ],
    knownInformation: {
      initialWallet: "7XH3\u00a0.\u00a0.\u00a0.\u00a092KD",
      missingAmount: "20 SOL",
      approximateTime: "02 : 3 MIN",
    },
    objectives: [
      "Find the transaction where the funds left the treasury",
      "Identify the receiving wallet",
      "Trace the movement of the funds",
      "Collect important evidence",
      "Build your theory",
    ],
  },
  "case-002": {
    id: "case-002",
    number: "Case 002",
    codename: "Operation Secp256k1 Bypass",
    difficulty: "Veteran",
    status: "open",
    briefing: [
      "{{120,000 wETH}} (~$325M USD) was fraudulently minted on the Wormhole Solana Bridge.",
      "On {{February 2, 2022 at 18:24 UTC}}, an attacker exploited a vulnerability in the Wormhole core program on Solana.",
      "The attacker bypassed Guardian signature verification by injecting a fake Instructions sysvar account via deprecated {{load_instruction_at}}.",
      "A fraudulent Validator Action Approval (VAA) was posted via {{post_vaa}}, enabling {{complete_wrapped}} to mint 120,000 unbacked wETH.",
      "The attacker bridged 93,750 ETH directly to Ethereum address {{0x629e7Da20197a5429d30da36E77d06CdF796b71A}}.",
    ],
    knownInformation: {
      initialWallet: "wormDTUJ...LBCgUb",
      missingAmount: "120,000 wETH ($325M)",
      approximateTime: "18 : 24 UTC",
    },
    objectives: [
      "Inspect the signature verification bypass transaction (tx-verify-bypass).",
      "Examine the fraudulent Guardian post_vaa authorization record.",
      "Trace the complete_wrapped mint transaction that spawned 120,000 wETH.",
      "Trace the capital outflow bridging 93,750 ETH across to Ethereum.",
      "Submit your forensic conclusion on the exploit vector and exit address.",
    ],
  },
};

/** Fetch case brief from backend with fallback to mock cases. */
export async function getCaseBrief(caseId: string): Promise<CaseBrief | null> {
  try {
    const brief = await getCaseBriefApi(caseId);
    if (brief) return brief;
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = cases[caseId];
  return found ? caseBriefSchema.parse(found) : null;
}

/** Fetch case file from backend with fallback to mock case files. */
export async function getCaseFile(caseId: string): Promise<CaseFile | null> {
  try {
    const file = await getCaseFileApi(caseId);
    if (file) return file;
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
  }
  const found = caseFiles[caseId];
  return found ? caseFileSchema.parse(found) : null;
}

/** List all available cases from backend with fallback. */
export async function listCases(): Promise<CaseCatalogItem[]> {
  try {
    return await listCasesApi();
  } catch {
    return [
      {
        id: "case-001",
        number: "Case 001",
        title: "Trace the missing 20 SOL",
        codename: "The Missing Treasury",
        difficulty: "Rookie",
        status: "open",
      },
      {
        id: "case-002",
        number: "Case 002",
        title: "The 120,000 wETH Wormhole Bridge Exploit",
        codename: "Operation Secp256k1 Bypass",
        difficulty: "Veteran",
        status: "open",
      },
    ];
  }
}

/** Known case IDs for static generation. */
export const caseIds: string[] = ["case-001", "case-002"];
