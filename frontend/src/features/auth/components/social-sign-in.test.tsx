import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SocialSignIn } from "./social-sign-in";

// jsdom has no PointerEvent; without it fireEvent drops clientX.
beforeAll(() => {
  if (!("PointerEvent" in window)) {
    class PointerEventPolyfill extends MouseEvent {}
    Object.assign(window, { PointerEvent: PointerEventPolyfill });
  }
});

function setup() {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(<SocialSignIn label="Sign up with" onContinue={onContinue} />);
  const action = () => screen.getByRole("button", { name: /^Sign up with/ });
  return { onContinue, user, action };
}

describe("SocialSignIn", () => {
  it("defaults to Google and continues with it", async () => {
    const { onContinue, user, action } = setup();

    expect(screen.getByRole("radio", { name: "Google" })).toBeChecked();
    expect(action()).toHaveTextContent("Sign up with Google");

    await user.click(action());
    expect(onContinue).toHaveBeenCalledWith("google");
  });

  it("switches to X from the logo switch", async () => {
    const { onContinue, user, action } = setup();

    await user.click(screen.getByRole("radio", { name: "X" }));

    expect(screen.getByRole("radio", { name: "X" })).toBeChecked();
    expect(action()).toHaveTextContent("Sign up with X");
    await user.click(action());
    expect(onContinue).toHaveBeenCalledWith("x");
  });

  it("moves between providers with the arrow keys", async () => {
    const { user, action } = setup();

    screen.getByRole("radio", { name: "Google" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "X" })).toHaveFocus();
    expect(action()).toHaveTextContent("Sign up with X");
  });

  it("swipes between providers without triggering the action", () => {
    const { onContinue, action } = setup();
    const button = action();

    // Swipe left: next provider. The click that follows the swipe is ignored.
    fireEvent.pointerDown(button, { clientX: 200 });
    fireEvent.pointerUp(button, { clientX: 120 });
    fireEvent.click(button);

    expect(action()).toHaveTextContent("Sign up with X");
    expect(onContinue).not.toHaveBeenCalled();

    // Swipe right: back to Google.
    fireEvent.pointerDown(button, { clientX: 120 });
    fireEvent.pointerUp(button, { clientX: 200 });
    expect(action()).toHaveTextContent("Sign up with Google");
  });

  it("renders only Google when showX is false", async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(<SocialSignIn label="Continue with" onContinue={onContinue} showX={false} />);

    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "X" })).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Continue with Google" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onContinue).toHaveBeenCalledWith("google");
  });
});
