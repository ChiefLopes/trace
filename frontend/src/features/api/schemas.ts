import { z } from "zod";

export interface AvatarObject {
  src: string;
}

export interface UserResponse {
  id: string;
  email: string | null;
  username: string;
  walletAddress: string | null;
  selectedInvestigatorId: string;
  createdAt: string;
}

const avatarObjectSchema = z.object({
  src: z.string(),
});

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  username: z.string(),
  walletAddress: z.string().nullable(),
  selectedInvestigatorId: z.string().default("tracy"),
  createdAt: z.string(),
});

export interface AuthResponse {
  user: UserResponse;
  token: string;
  tokenType: string;
  expiresIn: number;
}

const authResponseSchema = z.object({
  user: userResponseSchema,
  token: z.string(),
  tokenType: z.string().default("Bearer"),
  expiresIn: z.number().int(),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const signupRequestSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: z.string().min(8),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const walletChallengeRequestSchema = z.object({
  wallet: z.string(),
});

export type WalletChallengeRequest = z.infer<typeof walletChallengeRequestSchema>;

export const walletChallengeResponseSchema = z.object({
  wallet: z.string(),
  message: z.string(),
  nonce: z.string(),
});

export type WalletChallengeResponse = z.infer<typeof walletChallengeResponseSchema>;

export const walletVerifyRequestSchema = z.object({
  wallet: z.string(),
  signature: z.string(),
  message: z.string(),
});

export type WalletVerifyRequest = z.infer<typeof walletVerifyRequestSchema>;

export interface GoogleAuthRequest {
  idToken?: string | null;
  credential?: string | null;
  code?: string | null;
}

const googleAuthRequestSchema = z.object({
  idToken: z.string().nullable().optional(),
  credential: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
});

export const googleAuthUrlResponseSchema = z.object({
  url: z.string(),
});

export type GoogleAuthUrlResponse = z.infer<typeof googleAuthUrlResponseSchema>;

export interface SessionResponse {
  user: UserResponse | null;
  authenticated: boolean;
}

const sessionResponseSchema = z.object({
  user: userResponseSchema.nullable(),
  authenticated: z.boolean().default(false),
});

export const investigatorStatusSchema = z.object({
  rank: z.string(),
  state: z.string(),
});

export type InvestigatorStatus = z.infer<typeof investigatorStatusSchema>;

export const investigatorArtworkSchema = z.object({
  src: z.string(),
  width: z.number(),
  height: z.number(),
});

export const investigatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: investigatorArtworkSchema,
  fullBody: investigatorArtworkSchema.optional(),
  pickerHeight: z.number(),
});

export type Investigator = z.infer<typeof investigatorSchema>;

export const investigatorsResponseSchema = z.object({
  investigators: z.array(investigatorSchema),
  featured: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    image: investigatorArtworkSchema,
    fullBody: investigatorArtworkSchema,
  }),
});

export type InvestigatorsResponse = z.infer<typeof investigatorsResponseSchema>;

export const caseCatalogItemSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  codename: z.string(),
  difficulty: z.string(),
  status: z.enum(["open", "solved", "closed"]),
});

export type CaseCatalogItem = z.infer<typeof caseCatalogItemSchema>;

export const caseBriefSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  brief: z.array(z.string()),
  objectives: z.array(z.string()),
});

export type CaseBrief = z.infer<typeof caseBriefSchema>;

export interface KnownInformation {
  initialWallet: string;
  missingAmount: string;
  approximateTime: string;
}

const knownInformationSchema = z.object({
  initialWallet: z.string(),
  missingAmount: z.string(),
  approximateTime: z.string(),
});

export interface CaseFile {
  id: string;
  number: string;
  codename: string;
  difficulty: string;
  status: "open" | "solved" | "closed";
  briefing: string[];
  knownInformation: KnownInformation;
  objectives: string[];
}

const caseFileSchema = z.object({
  id: z.string(),
  number: z.string(),
  codename: z.string(),
  difficulty: z.string(),
  status: z.enum(["open", "solved", "closed"]),
  briefing: z.array(z.string()),
  knownInformation: knownInformationSchema,
  objectives: z.array(z.string()),
});

export const objectiveSchema = z.object({
  text: z.string(),
  done: z.boolean().default(false),
});

export type Objective = z.infer<typeof objectiveSchema>;

export const targetSchema = z.object({
  kind: z.enum(["transaction", "wallet"]),
  id: z.string(),
});

export type Target = z.infer<typeof targetSchema>;

export const leadSchema = z.object({
  id: z.string(),
  badge: z.string(),
  trigger: z.enum(["arrival", "idle"]),
  title: z.string(),
  message: z.string(),
  actionLabel: z.string(),
  target: targetSchema,
});

export type Lead = z.infer<typeof leadSchema>;

export const walletSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
});

export type WalletSummary = z.infer<typeof walletSummarySchema>;

export const timelineEntrySchema = z.object({
  id: z.string(),
  time: z.string(),
  direction: z.enum(["in", "out"]),
  amountLamports: z.number().int(),
  counterparty: z.string().nullable(),
  flagged: z.boolean().default(false),
});

export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

export interface ActivityItem {
  id: string;
  time: string;
  direction: "in" | "out";
  amountLamports: number;
  counterparty: string | null;
  fromWallet: string | null;
  toWallet: string | null;
  key: boolean;
  flagged: boolean;
  link: Target | null;
}

const activityItemSchema = z.object({
  id: z.string(),
  time: z.string(),
  direction: z.enum(["in", "out"]),
  amountLamports: z.number().int(),
  counterparty: z.string().nullable(),
  fromWallet: z.string().nullable(),
  toWallet: z.string().nullable(),
  key: z.boolean().default(false),
  flagged: z.boolean().default(false),
  link: targetSchema.nullable(),
});

export interface Workspace {
  caseId: string;
  caseNumber: string;
  codename: string;
  objectives: Objective[];
  investigator: InvestigatorStatus;
  hint: string;
  investigating: WalletSummary & {
    balanceLamports: number;
    transactionCount: number;
    tokenCount: number;
  };
  timeline: TimelineEntry[];
  trail: WalletSummary[];
  otherWallets: WalletSummary[];
  evidenceCount: number;
  lead: Lead | null;
}

const workspaceSchema = z.object({
  caseId: z.string(),
  caseNumber: z.string(),
  codename: z.string(),
  objectives: z.array(objectiveSchema),
  investigator: investigatorStatusSchema,
  hint: z.string(),
  investigating: walletSummarySchema.extend({
    balanceLamports: z.number().int(),
    transactionCount: z.number().int(),
    tokenCount: z.number().int(),
  }),
  timeline: z.array(timelineEntrySchema),
  trail: z.array(walletSummarySchema),
  otherWallets: z.array(walletSummarySchema),
  evidenceCount: z.number().int().default(0),
  lead: leadSchema.nullable(),
});

export interface WalletDetail {
  id: string;
  label: string;
  address: string;
  description: string;
  balanceLamports: number;
  transactionCount: number;
  tokenCount: number;
  firstActivity: string;
  lastActivity: string;
  receivedFromWalletId: string | null;
  sentToWalletId: string | null;
  activity: ActivityItem[];
}

const walletDetailSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  description: z.string(),
  balanceLamports: z.number().int(),
  transactionCount: z.number().int(),
  tokenCount: z.number().int(),
  firstActivity: z.string(),
  lastActivity: z.string(),
  receivedFromWalletId: z.string().nullable(),
  sentToWalletId: z.string().nullable(),
  activity: z.array(activityItemSchema),
});

export const transactionProgressSchema = z.object({
  completed: z.number().int().default(1),
  total: z.number().int().default(5),
});

export type TransactionProgress = z.infer<typeof transactionProgressSchema>;

export interface TransactionDetail {
  id: string;
  signature: string;
  status: "confirmed" | "finalized" | "failed";
  time: string;
  amountLamports: number;
  fromWalletId: string;
  toWalletId: string;
  fromWallet: string | null;
  toWallet: string | null;
  progress: TransactionProgress;
  lead: Lead | null;
  counterparty: string | null;
  direction: "in" | "out";
  key: boolean;
  flagged: boolean;
  link: Target | null;
}

const transactionDetailSchema = z.object({
  id: z.string(),
  signature: z.string().default("5fJ8...2K9L"),
  status: z.enum(["confirmed", "finalized", "failed"]).default("confirmed"),
  time: z.string(),
  amountLamports: z.number().int(),
  fromWalletId: z.string(),
  toWalletId: z.string(),
  fromWallet: z.string().nullable(),
  toWallet: z.string().nullable(),
  progress: transactionProgressSchema,
  lead: leadSchema.nullable(),
  counterparty: z.string().nullable(),
  direction: z.enum(["in", "out"]).default("out"),
  key: z.boolean().default(false),
  flagged: z.boolean().default(false),
  link: targetSchema.nullable(),
});

export const evidenceItemRequestSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().optional(),
  kind: z.enum(["wallet", "transaction"]),
  targetId: z.string(),
  label: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type EvidenceItemRequest = z.infer<typeof evidenceItemRequestSchema>;

export const evidencePromptSchema = z.object({
  caseId: z.string(),
  destinationWalletIds: z.array(z.string()),
  scenarios: z.array(z.object({ id: z.string(), label: z.string() })),
  theoryPlaceholder: z.string(),
});

export type EvidencePrompt = z.infer<typeof evidencePromptSchema>;

export const THEORY_MIN_LENGTH = 20;
export const THEORY_MAX_LENGTH = 2000;

export const evidenceSubmissionRequestSchema = z.object({
  destination: z.string(),
  scenario: z.string(),
  theory: z.string().min(THEORY_MIN_LENGTH).max(THEORY_MAX_LENGTH),
});

export type EvidenceSubmissionRequest = z.infer<typeof evidenceSubmissionRequestSchema>;

export const clueScoreSchema = z.object({
  found: z.number().int(),
  total: z.number().int(),
});

export type ClueScore = z.infer<typeof clueScoreSchema>;

export const traceScoreSchema = z.object({
  correct: z.number().int(),
  total: z.number().int(),
});

export type TraceScore = z.infer<typeof traceScoreSchema>;

export interface CaseOutcome {
  caseId: string;
  title: string;
  summary: string;
  score: number;
  maxScore: number;
  clues: ClueScore;
  evidenceCollected: number;
  traces: TraceScore;
  hintsUsed: number;
}

const caseOutcomeSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  summary: z.string(),
  score: z.number().int(),
  maxScore: z.number().int(),
  clues: clueScoreSchema,
  evidenceCollected: z.number().int(),
  traces: traceScoreSchema,
  hintsUsed: z.number().int(),
});

export const currentUserResponseSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatar: avatarObjectSchema,
});

export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;

export const dashboardProgressSchema = z.object({
  completed: z.number().int(),
  total: z.number().int(),
});

export type DashboardProgress = z.infer<typeof dashboardProgressSchema>;

export const activeCaseSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type ActiveCaseSummary = z.infer<typeof activeCaseSummarySchema>;

export interface DashboardSummaryResponse {
  activeCase: ActiveCaseSummary | null;
  objectives: DashboardProgress;
  evidenceCount: number;
  academy: DashboardProgress;
}

const dashboardSummaryResponseSchema = z.object({
  activeCase: activeCaseSummarySchema.nullable(),
  objectives: dashboardProgressSchema,
  evidenceCount: z.number().int().default(0),
  academy: dashboardProgressSchema,
});

export const updateInvestigatorRequestSchema = z.object({
  investigatorId: z.string(),
});

export type UpdateInvestigatorRequest = z.infer<typeof updateInvestigatorRequestSchema>;

export const httpValidationErrorSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
      input: z.unknown(),
      ctx: z.object({}).optional(),
    }),
  ),
});

export type HTTPValidationError = z.infer<typeof httpValidationErrorSchema>;

// Export schemas for runtime validation
export {
  avatarObjectSchema,
  userResponseSchema,
  authResponseSchema,
  googleAuthRequestSchema,
  sessionResponseSchema,
  knownInformationSchema,
  caseFileSchema,
  activityItemSchema,
  workspaceSchema,
  walletDetailSchema,
  transactionDetailSchema,
  caseOutcomeSchema,
  dashboardSummaryResponseSchema,
};
