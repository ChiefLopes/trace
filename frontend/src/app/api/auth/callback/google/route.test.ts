import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { googleAuth, createSession, setFlash } = vi.hoisted(() => ({
  googleAuth: vi.fn(),
  createSession: vi.fn(),
  setFlash: vi.fn(),
}));

vi.mock("@/features/auth/server-api", () => ({ googleAuth }));
vi.mock("@/features/auth/session", () => ({ createSession }));
vi.mock("@/features/flash/server", () => ({ setFlash }));

describe("Google OAuth Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with error when code is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/callback/google");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(setFlash).toHaveBeenCalledWith("google-auth-failed");
    expect(googleAuth).not.toHaveBeenCalled();
  });

  it("redirects to login when Google returns an error parameter", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/auth/callback/google?error=access_denied",
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(setFlash).toHaveBeenCalledWith("google-auth-failed");
    expect(googleAuth).not.toHaveBeenCalled();
  });

  it("exchanges code for session and redirects to dashboard on success", async () => {
    googleAuth.mockResolvedValue({
      user: { id: "user-123", username: "Agent Smith" },
      token: "jwt-token-xyz",
      expiresIn: 86400,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/auth/callback/google?code=valid-auth-code",
    );
    const res = await GET(req);

    expect(googleAuth).toHaveBeenCalledWith({ code: "valid-auth-code" });
    expect(createSession).toHaveBeenCalledWith("user-123", "jwt-token-xyz", 86400, true);
    expect(setFlash).toHaveBeenCalledWith("signed-in");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("handles backend exchange error gracefully by redirecting to login", async () => {
    googleAuth.mockRejectedValue(new Error("Exchange failed"));

    const req = new NextRequest("http://localhost:3000/api/auth/callback/google?code=invalid-code");
    const res = await GET(req);

    expect(googleAuth).toHaveBeenCalledWith({ code: "invalid-code" });
    expect(setFlash).toHaveBeenCalledWith("google-auth-failed");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
