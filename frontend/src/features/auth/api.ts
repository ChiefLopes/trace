"use client";

import { z } from "zod";

import { api } from "@/lib/api/browser";

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
  return api.post("/api/auth/signup", authResponseSchema, { body: parsed });
}

export async function login(values: LoginRequest): Promise<AuthResponse> {
  const parsed = loginRequestSchema.parse(values);
  return api.post("/api/auth/login", authResponseSchema, { body: parsed });
}

export async function walletChallenge(
  values: WalletChallengeRequest,
): Promise<WalletChallengeResponse> {
  const parsed = walletChallengeRequestSchema.parse(values);
  return api.post("/api/auth/wallet/challenge", walletChallengeResponseSchema, {
    body: parsed,
  });
}

export async function walletVerify(values: WalletVerifyRequest): Promise<AuthResponse> {
  const parsed = walletVerifyRequestSchema.parse(values);
  return api.post("/api/auth/wallet/verify", authResponseSchema, { body: parsed });
}

export async function getSession(): Promise<SessionResponse> {
  return api.get("/api/auth/session", sessionResponseSchema);
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout", z.void(), {});
}

export async function getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  return api.get("/api/auth/google/url", googleAuthUrlResponseSchema);
}

export async function googleAuth(values: GoogleAuthRequest): Promise<AuthResponse> {
  const parsed = googleAuthRequestSchema.parse(values);
  return api.post("/api/auth/google", authResponseSchema, { body: parsed });
}
