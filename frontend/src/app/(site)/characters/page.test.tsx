import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import CharactersPage from "./page";
import { getOptionalCurrentUser } from "@/features/auth/session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  getOptionalCurrentUser: vi.fn(),
}));

describe("CharactersPage (/characters redirect)", () => {
  it("redirects to /login when user is not logged in", async () => {
    vi.mocked(getOptionalCurrentUser).mockResolvedValue(null);

    await CharactersPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /dashboard when user is logged in", async () => {
    vi.mocked(getOptionalCurrentUser).mockResolvedValue({
      id: "agent-1",
      displayName: "Detective John",
      avatar: { src: "/avatar.svg" },
    });

    await CharactersPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
