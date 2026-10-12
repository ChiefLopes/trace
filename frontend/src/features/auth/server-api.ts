import "server-only";

import { z } from "zod";

import { serverApi } from "@/lib/api/server";

import {
  authResponseSchema,
  loginRequestSchema,
  signupRequestSchema,
  walletChallengeRequestSchema,
  walletChallengeResponseSchema,
  walletVerifyRequestSchema,
  googleAuthRequestSchema,
  googleAuthUrlResponseSchema,
  sessionResponseSchema,
} from "@/features/api/schemas";

import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  WalletChallengeRequest,
  WalletChallengeResponse,
  WalletVerifyRequest,
  GoogleAuthRequest,
  GoogleAuthUrlResponse,
  SessionResponse,
} from "@/features/api/schemas";

export async function signup(values: SignupRequest): Promise<AuthResponse> {
  const parsed = signupRequestSchema.parse(values);
  return serverApi.post("/api/auth/signup", authResponseSchema, { body: parsed });
}

export async function login(values: LoginRequest): Promise<AuthResponse> {
  const parsed = loginRequestSchema.parse(values);
  return serverApi.post("/api/auth/login", authResponseSchema, { body: parsed });
}

export async function walletChallenge(
  values: WalletChallengeRequest,
): Promise<WalletChallengeResponse> {
  const parsed = walletChallengeRequestSchema.parse(values);
  return serverApi.post("/api/auth/wallet/challenge", walletChallengeResponseSchema, {
    body: parsed,
  });
}

export async function walletVerify(values: WalletVerifyRequest): Promise<AuthResponse> {
  const parsed = walletVerifyRequestSchema.parse(values);
  return serverApi.post("/api/auth/wallet/verify", authResponseSchema, { body: parsed });
}

export async function getSession(): Promise<SessionResponse> {
  return serverApi.get("/api/auth/session", sessionResponseSchema);
}

export async function logout(): Promise<void> {
  await serverApi.post("/api/auth/logout", z.void(), {});
}

export async function getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  return serverApi.get("/api/auth/google/url", googleAuthUrlResponseSchema);
}

export async function googleAuth(values: GoogleAuthRequest): Promise<AuthResponse> {
  const parsed = googleAuthRequestSchema.parse(values);
  return serverApi.post("/api/auth/google", authResponseSchema, { body: parsed });
}
