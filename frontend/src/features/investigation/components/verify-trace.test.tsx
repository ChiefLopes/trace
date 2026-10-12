import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VerifyTraceButton } from "./verify-trace-button";
import { TraceLossModal } from "./trace-loss-modal";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockGetCaseEvidenceAction = vi.fn();
vi.mock("@/app/(dashboard)/evidence/[caseId]/collection-actions", () => ({
  getCaseEvidenceAction: (...args: unknown[]) => mockGetCaseEvidenceAction(...args),
}));

const mockVerifyAndSolveCaseAction = vi.fn();
vi.mock("@/features/investigation/actions", () => ({
  verifyAndSolveCaseAction: (...args: unknown[]) => mockVerifyAndSolveCaseAction(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe("VerifyTraceButton & TraceLossModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCaseEvidenceAction.mockResolvedValue([]);
    mockVerifyAndSolveCaseAction.mockResolvedValue({ success: true, outcome: {} });
  });

  it("renders Verify Trace CTA button", () => {
    render(
      <VerifyTraceButton
        caseId="case-001"
        walletId="exchange"
        walletLabel="Exchange Deposit Hot Wallet"
        isFinalDestination={true}
        evidenceCount={0}
      />,
    );

    expect(screen.getByRole("button", { name: /verify trace/i })).toBeInTheDocument();
  });

  it("opens TraceLossModal with Retry button when clicked on an incorrect / intermediate trace", async () => {
    const user = userEvent.setup();
    render(
      <VerifyTraceButton
        caseId="case-001"
        walletId="wallet-b"
        walletLabel="Wallet B"
        isFinalDestination={false}
        evidenceCount={2}
      />,
    );

    const button = screen.getByRole("button", { name: /verify trace/i });
    await user.click(button);

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/investigation trail lost/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry trace/i, hidden: true })).toBeInTheDocument();
  });

  it("redirects to evidence screen when on correct destination but 0 evidence", async () => {
    const user = userEvent.setup();
    mockGetCaseEvidenceAction.mockResolvedValue([]);

    render(
      <VerifyTraceButton
        caseId="case-001"
        walletId="exchange"
        walletLabel="Exchange Deposit Hot Wallet"
        isFinalDestination={true}
        evidenceCount={0}
      />,
    );

    const button = screen.getByRole("button", { name: /verify trace/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/evidence/case-001?fromWallet=exchange&verified=1"),
    );
  });

  it("solves case and navigates to outcome when on correct destination with evidence", async () => {
    const user = userEvent.setup();
    mockGetCaseEvidenceAction.mockResolvedValue([
      { id: "ev-1", kind: "wallet", targetId: "exchange" },
    ]);

    render(
      <VerifyTraceButton
        caseId="case-001"
        walletId="exchange"
        walletLabel="Exchange Deposit Hot Wallet"
        isFinalDestination={true}
        evidenceCount={1}
      />,
    );

    const button = screen.getByRole("button", { name: /verify trace/i });
    await user.click(button);

    expect(mockVerifyAndSolveCaseAction).toHaveBeenCalledWith("case-001", "exchange");
    expect(mockPush).toHaveBeenCalledWith("/investigation/case-001/outcome");
  });

  it("TraceLossModal closes on retry click", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleRetry = vi.fn();

    render(
      <TraceLossModal
        isOpen={true}
        onClose={handleClose}
        onRetry={handleRetry}
        title="Custom Lost Title"
        message="Custom Lost Message"
      />,
    );

    expect(screen.getByText("Custom Lost Title")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /retry trace/i, hidden: true });
    await user.click(retryBtn);

    expect(handleRetry).toHaveBeenCalled();
  });
});
