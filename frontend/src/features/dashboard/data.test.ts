import { describe, expect, it, vi, beforeEach } from "vitest";

import { getDashboardSummary } from "./data";
import * as activeCaseModule from "@/features/cases/active-case";
import * as serverApiModule from "./server-api";

vi.mock("./server-api", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("@/features/cases/active-case", () => ({
  getActiveCaseId: vi.fn(),
  getClosedCaseIds: vi.fn(),
}));

vi.mock("@/features/cases/data", () => ({
  getCaseFile: vi.fn(async (caseId: string) => ({
    id: caseId,
    number: caseId === "case-002" ? "Case 002" : "Case 001",
    codename: "Test Case",
    difficulty: "Rookie",
    status: "open",
    briefing: [],
    knownInformation: { initialWallet: "", missingAmount: "", approximateTime: "" },
    objectives: ["Obj 1", "Obj 2", "Obj 3", "Obj 4", "Obj 5"],
  })),
}));

describe("getDashboardSummary objective clearing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active case and objectives normally when case is open", async () => {
    vi.mocked(serverApiModule.getDashboardSummary).mockResolvedValueOnce({
      activeCase: { id: "case-001", label: "Case 001" },
      objectives: { completed: 2, total: 5 },
      evidenceCount: 2,
      academy: { completed: 0, total: 8 },
    });
    vi.mocked(activeCaseModule.getActiveCaseId).mockResolvedValueOnce(null);
    vi.mocked(activeCaseModule.getClosedCaseIds).mockResolvedValueOnce([]);

    const summary = await getDashboardSummary();
    expect(summary.activeCase?.id).toBe("case-001");
    expect(summary.objectives).toEqual({ completed: 2, total: 5 });
  });

  it("clears active case and objectives when the case is closed", async () => {
    vi.mocked(serverApiModule.getDashboardSummary).mockResolvedValueOnce({
      activeCase: { id: "case-001", label: "Case 001" },
      objectives: { completed: 5, total: 5 },
      evidenceCount: 4,
      academy: { completed: 0, total: 8 },
    });
    vi.mocked(activeCaseModule.getActiveCaseId).mockResolvedValueOnce(null);
    vi.mocked(activeCaseModule.getClosedCaseIds).mockResolvedValueOnce(["case-001"]);

    const summary = await getDashboardSummary();
    // Objectives cleared and active case is null
    expect(summary.activeCase).toBeNull();
    expect(summary.objectives).toEqual({ completed: 0, total: 0 });
  });

  it("resets objectives to 0/5 when a new case (case-002) is clicked and activated", async () => {
    vi.mocked(serverApiModule.getDashboardSummary).mockResolvedValueOnce({
      activeCase: { id: "case-001", label: "Case 001" },
      objectives: { completed: 5, total: 5 },
      evidenceCount: 4,
      academy: { completed: 0, total: 8 },
    });
    vi.mocked(activeCaseModule.getActiveCaseId).mockResolvedValueOnce("case-002");
    vi.mocked(activeCaseModule.getClosedCaseIds).mockResolvedValueOnce(["case-001"]);

    const summary = await getDashboardSummary();
    // Active case switched to case-002 with clean, fresh 0/5 objectives
    expect(summary.activeCase?.id).toBe("case-002");
    expect(summary.activeCase?.label).toBe("Case 002");
    expect(summary.objectives).toEqual({ completed: 0, total: 5 });
    expect(summary.evidenceCount).toBe(0);
  });
});
