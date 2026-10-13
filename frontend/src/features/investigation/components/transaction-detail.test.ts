import { describe, expect, it } from "vitest";

import { getTraceButtonLabel, walletName } from "./transaction-detail";

describe("transaction-detail helpers", () => {
  it("adds 'the' only to descriptive wallet names", () => {
    expect(walletName("Treasury Wallet")).toBe("the Treasury Wallet");
    expect(walletName("Unknown wallet")).toBe("the Unknown wallet");
    expect(walletName("Wallet B")).toBe("Wallet B");
  });

  it("returns 'Trace the Funds' on initial hops (Treasury -> Wallet B)", () => {
    const from = { id: "treasury", label: "Treasury Wallet", address: "7x...KD" };
    const to = { id: "wallet-b", label: "Wallet B", address: "9J...PL" };
    expect(getTraceButtonLabel(from, to)).toBe("Trace the Funds");
  });

  it("returns 'Keep Tracing' when tracing has gotten to Wallet C and Wallet D", () => {
    const walletB = { id: "wallet-b", label: "Wallet B", address: "9J...PL" };
    const walletC = { id: "wallet-c", label: "Wallet C", address: "3P...QR" };
    const walletD = { id: "wallet-d", label: "Staging Wallet D", address: "4k...ZY" };
    const exchange = { id: "exchange", label: "Exchange Deposit Hot Wallet", address: "8T...UV" };

    // Tracing to Wallet C
    expect(getTraceButtonLabel(walletB, walletC)).toBe("Keep Tracing");

    // Tracing from Wallet C to Wallet D
    expect(getTraceButtonLabel(walletC, walletD)).toBe("Keep Tracing");

    // Tracing from Wallet D to Exchange
    expect(getTraceButtonLabel(walletD, exchange)).toBe("Keep Tracing");
  });
});
