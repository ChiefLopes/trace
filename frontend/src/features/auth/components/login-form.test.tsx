import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const { loginAction, getGoogleAuthUrlAction, replace } = vi.hoisted(() => ({
  loginAction: vi.fn(),
  getGoogleAuthUrlAction: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("../actions", () => ({ loginAction, getGoogleAuthUrlAction }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("LoginForm", () => {
  beforeEach(() => {
    loginAction.mockReset();
    replace.mockReset();
    window.history.replaceState(null, "", "/login");
  });

  it("shows field errors and marks inputs invalid on an empty submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    const email = screen.getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter a valid email address");
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("sends the credentials and goes where the server says", async () => {
    window.history.replaceState(null, "", "/login?next=%2Finvestigation%2Fcase-001");
    loginAction.mockResolvedValue({
      redirectTo: "/investigation/case-001",
      displayName: "Diva Montess",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), " Agent@Trace.demo ");
    await user.type(screen.getByLabelText("Password"), "secret-pass");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(loginAction).toHaveBeenCalledWith(
      { email: "agent@trace.demo", password: "secret-pass", remember: false },
      "/investigation/case-001",
    );
    expect(replace).toHaveBeenCalledWith("/investigation/case-001");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the server's error, e.g. wrong credentials", async () => {
    loginAction.mockResolvedValue({ error: "Incorrect email or password." });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });
});
