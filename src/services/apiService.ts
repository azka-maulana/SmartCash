/**
 * apiService.ts
 *
 * Centralised frontend service for calling the Smart Cash backend API.
 * All backend communication goes through this file.
 * No Supabase credentials, Langflow URLs, or API keys belong here.
 * The browser only knows about /api/* — all secrets stay on the server.
 */

// In development, VITE_API_BASE_URL is empty — the Vite proxy forwards /api/* to :3001.
// In production, set VITE_API_BASE_URL to the deployed backend URL.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string) ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiMember {
  id: string;
  user_id: string;
  name: string;
  nim?: string;
  email: string;
  role: string;
  joined_at: string | null;
}

export interface ApiTransaction {
  id: string;
  group_id: string;
  type: "income" | "expense";
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "posted" | "voided";
  created_by: string;
  note: string | null;
  hasReceipt: boolean;
  person: string | null;
}

export interface ApiContribution {
  id: string;
  group_id: string;
  user_id: string;
  period: string;
  expected_amount: number;
  paid_amount: number;
  status: "paid" | "partial" | "unpaid";
  recorded_by: string | null;
  paidAt: string | null;
}

export interface ApiGroupSummary {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  contributionStatus: {
    paid: number;
    partial: number;
    unpaid: number;
    total: number;
  };
  memberCount: number;
  period: string;
}

export interface ApiGroup {
  id: string;
  name: string;
  description: string | null;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "user";
  groupId: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the backend. Is it running?");
  }

  let body: { data?: T; error?: string };
  try {
    body = await response.json();
  } catch {
    throw new Error(`Backend returned a non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(body?.error ?? `Backend error (HTTP ${response.status})`);
  }

  return body.data as T;
}

// ── Group ID ──────────────────────────────────────────────────────────────────

const DEMO_GROUP_ID = "G001";

// ── API calls ─────────────────────────────────────────────────────────────────

/** GET /api/groups/:groupId/summary?period=YYYY-MM */
export async function fetchGroupSummary(period: string): Promise<ApiGroupSummary> {
  return apiFetch<ApiGroupSummary>(
    `/api/groups/${DEMO_GROUP_ID}/summary?period=${encodeURIComponent(period)}`
  );
}

/** POST /api/auth/login */
export async function login(email: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** GET /api/groups/:groupId */
export async function fetchGroup(): Promise<ApiGroup> {
  return apiFetch<ApiGroup>(`/api/groups/${DEMO_GROUP_ID}`);
}

/** GET /api/groups/:groupId/members */
export async function fetchMembers(): Promise<ApiMember[]> {
  return apiFetch<ApiMember[]>(`/api/groups/${DEMO_GROUP_ID}/members`);
}

/** POST /api/groups/:groupId/members */
export async function postMember(body: { name: string; email: string }): Promise<ApiMember> {
  return apiFetch<ApiMember>(`/api/groups/${DEMO_GROUP_ID}/members`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/groups/:groupId/transactions */
export async function fetchTransactions(): Promise<ApiTransaction[]> {
  return apiFetch<ApiTransaction[]>(`/api/groups/${DEMO_GROUP_ID}/transactions`);
}

/** POST /api/groups/:groupId/transactions */
export async function postTransaction(body: {
  type: "income" | "expense";
  description: string;
  category: string;
  amount: number;
  date: string;
}): Promise<ApiTransaction> {
  return apiFetch<ApiTransaction>(`/api/groups/${DEMO_GROUP_ID}/transactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** PATCH /api/groups/:groupId/transactions/:id/void */
export async function patchVoidTransaction(transactionId: string): Promise<ApiTransaction> {
  return apiFetch<ApiTransaction>(
    `/api/groups/${DEMO_GROUP_ID}/transactions/${transactionId}/void`,
    { method: "PATCH" }
  );
}

/** GET /api/groups/:groupId/contributions?period=YYYY-MM */
export async function fetchContributions(period: string): Promise<ApiContribution[]> {
  return apiFetch<ApiContribution[]>(
    `/api/groups/${DEMO_GROUP_ID}/contributions?period=${encodeURIComponent(period)}`
  );
}

/** GET /api/groups/:groupId/contributions */
export async function fetchContributionHistory(): Promise<ApiContribution[]> {
  return apiFetch<ApiContribution[]>(`/api/groups/${DEMO_GROUP_ID}/contributions`);
}

/** POST /api/groups/:groupId/contributions/payment */
export async function postPayment(body: {
  userId: string;
  period: string;
  amount: number;
}): Promise<ApiContribution> {
  return apiFetch<ApiContribution>(`/api/groups/${DEMO_GROUP_ID}/contributions/payment`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
