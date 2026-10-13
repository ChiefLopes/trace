import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  ACTIVE_CASE_COOKIE,
  closeCase,
  getActiveCaseId,
  getClosedCaseIds,
  getNextOpenCaseId,
  isCaseClosed,
  setActiveCase,
} from "./active-case";

// Mock next/headers
const mockCookiesStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (key: string) => {
      const val = mockCookiesStore.get(key);
      return val ? { value: val } : undefined;
    },
    set: (key: string, val: string) => {
      mockCookiesStore.set(key, val);
    },
    delete: (key: string) => {
      mockCookiesStore.delete(key);
    },
  })),
}));

vi.mock("./data", () => ({
  listCases: vi.fn(async () => [
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
  ]),
}));

describe("active-case state management", () => {
  beforeEach(() => {
    mockCookiesStore.clear();
  });

  it("returns null active case when none set or set to 'none'", async () => {
    expect(await getActiveCaseId()).toBeNull();
    mockCookiesStore.set(ACTIVE_CASE_COOKIE, "none");
    expect(await getActiveCaseId()).toBeNull();
  });

  it("sets and gets active case", async () => {
    await setActiveCase("case-002");
    expect(await getActiveCaseId()).toBe("case-002");
    expect(mockCookiesStore.get(ACTIVE_CASE_COOKIE)).toBe("case-002");
  });

  it("closes a case, marks it in closed list, and clears active case", async () => {
    await setActiveCase("case-001");
    expect(await isCaseClosed("case-001")).toBe(false);

    await closeCase("case-001");
    expect(await isCaseClosed("case-001")).toBe(true);
    expect(await getClosedCaseIds()).toContain("case-001");
    expect(await getActiveCaseId()).toBeNull();
  });

  it("restarting a case clears its closed state", async () => {
    await closeCase("case-001");
    expect(await isCaseClosed("case-001")).toBe(true);

    await setActiveCase("case-001");
    expect(await isCaseClosed("case-001")).toBe(false);
    expect(await getActiveCaseId()).toBe("case-001");
  });

  it("getNextOpenCaseId advances to case-002 when case-001 is closed", async () => {
    await closeCase("case-001");
    const nextCase = await getNextOpenCaseId("case-001");
    expect(nextCase).toBe("case-002");
  });
});
