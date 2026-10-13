import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { serverApiPost, createSession, setFlash } = vi.hoisted(() => ({
  serverApiPost: vi.fn(),
  createSession: vi.fn(),
  setFlash: vi.fn(),
}));

vi.mock("@/lib/api/server", () => ({
  serverApi: {
    post: serverApiPost,
  },
}));
vi.mock("@/features/auth/session", () => ({ createSession }));
vi.mock("@/features/flash/server", () => ({ setFlash }));

describe("X OAuth Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with error when code is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/callback/x");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(setFlash).toHaveBeenCalledWith("x-auth-failed");
    expect(serverApiPost).not.toHaveBeenCalled();
  });

  it("redirects to login when X returns an error parameter", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/auth/callback/x?error=access_denied&state=test-state-123",
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(setFlash).toHaveBeenCalledWith("x-auth-failed");
    expect(serverApiPost).not.toHaveBeenCalled();
  });

  it("exchanges code with backend callback endpoint and creates session", async () => {
    serverApiPost.mockResolvedValue({
      user: { id: "user-456", username: "AgentX" },
      token: "jwt-token-x",
      expiresIn: 86400,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/auth/callback/x?code=valid-code&state=test-state-123",
    );
    const res = await GET(req);

    expect(serverApiPost).toHaveBeenCalledWith(
      "/api/auth/callback/x",
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          code: "valid-code",
          state: "test-state-123",
        }),
      }),
    );
    expect(createSession).toHaveBeenCalledWith("user-456", "jwt-token-x", 86400, true);
    expect(setFlash).toHaveBeenCalledWith("signed-in");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});
