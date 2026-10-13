import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("SiteHeader navigation", () => {
  it("directs Pick Character to /login when user is not logged in", () => {
    render(<SiteHeader user={null} />);

    const pickCharLinks = screen.getAllByRole("link", { name: "Pick Character" });
    expect(pickCharLinks.length).toBeGreaterThan(0);
    for (const link of pickCharLinks) {
      expect(link).toHaveAttribute("href", "/login");
    }
  });

  it("directs Pick Character to /dashboard when user is logged in", () => {
    const user = {
      id: "agent-007",
      displayName: "Agent Alex",
      avatar: { src: "/avatar.svg" },
    };
    render(<SiteHeader user={user} />);

    const pickCharLinks = screen.getAllByRole("link", { name: "Pick Character" });
    expect(pickCharLinks.length).toBeGreaterThan(0);
    for (const link of pickCharLinks) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
  });
});
