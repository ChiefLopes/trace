import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { investigators } from "../data";
import { InvestigatorPicker } from "./investigator-picker";

describe("InvestigatorPicker", () => {
  it("shows loading investigator placeholder while images have not loaded yet", () => {
    const action = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue();
    render(<InvestigatorPicker investigators={investigators} action={action} />);

    expect(screen.getAllByText(/loading investigator…/i).length).toBeGreaterThan(0);
  });

  it("submits the chosen investigator and the case to the action after confirming preview", async () => {
    const user = userEvent.setup();
    const action = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue();
    render(<InvestigatorPicker investigators={investigators} action={action} caseId="case-001" />);

    const buttons = screen.getAllByRole("button", { name: /^select /i });
    expect(buttons).toHaveLength(4);

    // Clicking character / card opens the preview spotlight dossier
    await user.click(buttons[1]!);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Operative Dossier")).toBeInTheDocument();

    // Confirm choice via the spotlight action button
    const chooseBtn = screen.getByRole("button", { name: /choose investigator/i });
    await user.click(chooseBtn);

    expect(action).toHaveBeenCalledOnce();
    const formData = action.mock.calls[0]![0];
    expect(formData.get("investigatorId")).toBe("officer-2");
    expect(formData.get("caseId")).toBe("case-001");
  });

  it("allows user to preview an investigator and cancel to choose another one", async () => {
    const user = userEvent.setup();
    const action = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue();
    render(<InvestigatorPicker investigators={investigators} action={action} caseId="case-001" />);

    // Click on the character card itself
    const characterCards = screen.getAllByRole("listitem");
    await user.click(characterCards[0]!);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click cancel
    const cancelBtn = screen.getByRole("button", { name: /cancel & choose another/i });
    await user.click(cancelBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
});
