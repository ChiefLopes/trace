import { describe, expect, it } from "vitest";

import {
  findCaseWallet,
  getTransaction,
  getWalletDetail,
  getWorkspace,
  isSolved,
  walletParams,
} from "./data";

describe("case data integrity", () => {
  it("every wallet activity row opens a transaction that exists, between known wallets", async () => {
    for (const { caseId, walletId } of walletParams) {
      const [wallet, workspace] = await Promise.all([
        getWalletDetail(caseId, walletId),
        getWorkspace(caseId),
      ]);
      for (const entry of wallet!.activity) {
        expect(entry.link.kind, `${walletId}/${entry.id}`).toBe("transaction");
        const tx = await getTransaction(caseId, entry.link.id);
        expect(tx, `${walletId}/${entry.id} -> ${entry.link.id}`).not.toBeNull();
        expect(findCaseWallet(workspace!, tx!.fromWalletId)).toBeDefined();
        expect(findCaseWallet(workspace!, tx!.toWalletId)).toBeDefined();
        expect(tx!.amountLamports).toBe(entry.amountLamports);
      }
    }
  }, 20000);
});

describe("isSolved", () => {
  it("is true only when every objective is done", () => {
    expect(
      isSolved({
        objectives: [
          { text: "a", done: true },
          { text: "b", done: true },
        ],
      }),
    ).toBe(true);
    expect(
      isSolved({
        objectives: [
          { text: "a", done: true },
          { text: "b", done: false },
        ],
      }),
    ).toBe(false);
    expect(isSolved({ objectives: [] })).toBe(false);
  });
});

describe("getWorkspace", () => {
  it("returns the in-progress case by default", async () => {
    const workspace = await getWorkspace("case-001");
    expect(workspace && isSolved(workspace)).toBe(false);
    expect(workspace?.lead).not.toBeNull();
  });
});
