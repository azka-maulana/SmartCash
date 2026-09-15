"use strict";
/**
 * Tests for /api/ai/tools/* endpoints
 *
 * Covers (per plan Sub-Task 4):
 *  - Real data response for each endpoint (mocked service layer)
 *  - Invalid groupId → 403
 *  - Invalid period format → 400
 *  - Empty contributions result → 200 with empty array
 *  - limit clamped to 50
 *  - Supabase not configured → 503
 *  - DB failure → 500
 *  - Existing /api/ai/chat endpoint not broken
 */

const request = require("supertest");

// ── Environment stubs (must come before app is required) ─────────────────────
process.env.LANGFLOW_BASE_URL = "http://langflow-test";
process.env.LANGFLOW_FLOW_ID  = "test-flow-id";
process.env.LANGFLOW_API_KEY  = "test-api-key";
process.env.SUPABASE_URL      = "http://supabase-test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Disable all rate limiters so tests never hit 429
jest.mock("../src/middleware/rateLimiter", () => {
  const noop = (_req, _res, next) => next();
  return { aiRateLimiter: noop, authRateLimiter: noop, globalRateLimiter: noop };
});

// Mock dataService so no real Supabase calls are made
jest.mock("../src/services/dataService", () => ({
  isAvailable:     jest.fn(() => true),
  getGroupSummary: jest.fn(),
  getContributions:jest.fn(),
  getTransactions: jest.fn(),
  getMembers:      jest.fn(),
}));

// Mock langflowService to prevent real HTTP calls
jest.mock("../src/services/langflowService", () => ({
  callLangflow: jest.fn(async () => ({ message: "mocked response" })),
  LangflowTimeoutError: class LangflowTimeoutError extends Error {},
  LangflowUpstreamError: class LangflowUpstreamError extends Error {},
}));

const dataService = require("../src/services/dataService");
const { createApp } = require("../src/app");

const DEMO_GROUP_ID = "G001";

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/ai/tools/financial-summary", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    dataService.isAvailable.mockReturnValue(true);
    dataService.getGroupSummary.mockResolvedValue({
      balance: 5000,
      monthlyIncome: 3000,
      monthlyExpense: 1000,
      monthlyNet: 2000,
      contributionStatus: { paid: 3, partial: 1, unpaid: 1, total: 5 },
      memberCount: 5,
      period: "2025-06",
    });
  });

  afterEach(() => jest.clearAllMocks());

  test("returns financial summary for valid groupId and period", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      balance: 5000,
      monthlyIncome: 3000,
      monthlyExpense: 1000,
      contributionCounts: { paid: 3, partial: 1, unpaid: 1, total: 5 },
      memberCount: 5,
      period: "2025-06",
    });
    // Must NOT expose internal fields
    expect(res.body.data.monthlyNet).toBeUndefined();
    expect(res.body.data.contributionStatus).toBeUndefined();
  });

  test("defaults period to current month when omitted", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(200);
    expect(dataService.getGroupSummary).toHaveBeenCalledWith(
      DEMO_GROUP_ID,
      expect.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/)
    );
  });

  test("returns 403 for wrong groupId", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: "G999", period: "2025-06" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied/i);
  });

  test("returns 403 when groupId is missing", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ period: "2025-06" });

    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid period format", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-13" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/YYYY-MM/);
  });

  test("returns 400 for period with wrong format", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "06-2025" });

    expect(res.status).toBe(400);
  });

  test("returns 503 when Supabase is not configured", async () => {
    dataService.isAvailable.mockReturnValue(false);
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(503);
  });

  test("returns 500 on database failure", async () => {
    dataService.getGroupSummary.mockRejectedValue(new Error("DB connection failed"));
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch financial summary");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/ai/tools/contributions", () => {
  let app;

  const mockMembers = [
    { user_id: "U001", name: "Alice",   role: "admin",  email: "alice@test.com" },
    { user_id: "U002", name: "Bob",     role: "member", email: "bob@test.com"   },
    { user_id: "U003", name: "Charlie", role: "member", email: "charlie@test.com" },
  ];

  const mockContribs = [
    { user_id: "U001", status: "paid",    paid_amount: 100000, expected_amount: 100000, period: "2025-06" },
    { user_id: "U002", status: "partial", paid_amount:  50000, expected_amount: 100000, period: "2025-06" },
    { user_id: "U003", status: "unpaid",  paid_amount:      0, expected_amount: 100000, period: "2025-06" },
  ];

  beforeEach(() => {
    app = createApp();
    dataService.isAvailable.mockReturnValue(true);
    dataService.getContributions.mockResolvedValue(mockContribs);
    dataService.getMembers.mockResolvedValue(mockMembers);
  });

  afterEach(() => jest.clearAllMocks());

  test("returns contributions with memberName resolved", async () => {
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);

    const alice = res.body.data.find((c) => c.memberName === "Alice");
    expect(alice).toMatchObject({
      memberName:     "Alice",
      status:         "paid",
      paidAmount:     100000,
      expectedAmount: 100000,
      period:         "2025-06",
    });

    const bob = res.body.data.find((c) => c.memberName === "Bob");
    expect(bob.status).toBe("partial");

    const charlie = res.body.data.find((c) => c.memberName === "Charlie");
    expect(charlie.status).toBe("unpaid");
  });

  test("does NOT expose email in contributions response", async () => {
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(200);
    for (const item of res.body.data) {
      expect(item.email).toBeUndefined();
      expect(item.user_id).toBeUndefined();
    }
  });

  test("returns 200 with empty array for period with no contributions", async () => {
    dataService.getContributions.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2020-01" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("returns 403 for wrong groupId", async () => {
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: "EVIL", period: "2025-06" });

    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid period", async () => {
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "bad-period" });

    expect(res.status).toBe(400);
  });

  test("returns 503 when Supabase not configured", async () => {
    dataService.isAvailable.mockReturnValue(false);
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(503);
  });

  test("returns 500 on database failure", async () => {
    dataService.getContributions.mockRejectedValue(new Error("DB error"));
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/ai/tools/transactions", () => {
  let app;

  const mockTx = [
    { id: "T001", type: "income",  description: "Monthly dues", category: "contribution", amount: 100000, date: "2025-06-01", group_id: "G001", status: "posted", created_by: "U002" },
    { id: "T002", type: "expense", description: "Venue rental",  category: "event",        amount:  50000, date: "2025-06-05", group_id: "G001", status: "posted", created_by: "U002" },
  ];

  beforeEach(() => {
    app = createApp();
    dataService.isAvailable.mockReturnValue(true);
    dataService.getTransactions.mockResolvedValue(mockTx);
  });

  afterEach(() => jest.clearAllMocks());

  test("returns transactions with only projected fields", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);

    const tx = res.body.data[0];
    expect(tx).toHaveProperty("id");
    expect(tx).toHaveProperty("type");
    expect(tx).toHaveProperty("description");
    expect(tx).toHaveProperty("category");
    expect(tx).toHaveProperty("amount");
    expect(tx).toHaveProperty("date");

    // Internal fields must NOT be exposed
    expect(tx.group_id).toBeUndefined();
    expect(tx.status).toBeUndefined();
    expect(tx.created_by).toBeUndefined();
  });

  test("passes period filter to dataService", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.status).toBe(200);
    expect(dataService.getTransactions).toHaveBeenCalledWith(
      DEMO_GROUP_ID,
      expect.objectContaining({ period: "2025-06" })
    );
  });

  test("clamps limit to 50 maximum", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID, limit: "200" });

    expect(res.status).toBe(200);
    expect(dataService.getTransactions).toHaveBeenCalledWith(
      DEMO_GROUP_ID,
      expect.objectContaining({ limit: 50 })
    );
  });

  test("uses default limit of 20 when not specified", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(200);
    expect(dataService.getTransactions).toHaveBeenCalledWith(
      DEMO_GROUP_ID,
      expect.objectContaining({ limit: 20 })
    );
  });

  test("returns 400 for invalid period", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-00" });

    expect(res.status).toBe(400);
  });

  test("returns 400 for non-integer limit", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID, limit: "abc" });

    expect(res.status).toBe(400);
  });

  test("returns 403 for wrong groupId", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: "HACKER" });

    expect(res.status).toBe(403);
  });

  test("returns 503 when Supabase not configured", async () => {
    dataService.isAvailable.mockReturnValue(false);
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(503);
  });

  test("returns 500 on database failure", async () => {
    dataService.getTransactions.mockRejectedValue(new Error("Connection refused"));
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(500);
  });

  test("returns 200 with empty array when no transactions", async () => {
    dataService.getTransactions.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID, period: "2020-01" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/ai/tools/members", () => {
  let app;

  const mockMembers = [
    { user_id: "U001", name: "Alice",   role: "admin",  email: "alice@test.com",   joined_at: "2024-01-01" },
    { user_id: "U002", name: "Bob",     role: "member", email: "bob@test.com",     joined_at: "2024-02-01" },
    { user_id: "U003", name: "Charlie", role: "member", email: "charlie@test.com", joined_at: "2024-03-01" },
  ];

  beforeEach(() => {
    app = createApp();
    dataService.isAvailable.mockReturnValue(true);
    dataService.getMembers.mockResolvedValue(mockMembers);
  });

  afterEach(() => jest.clearAllMocks());

  test("returns name and role only — no email, no IDs", async () => {
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);

    for (const m of res.body.data) {
      expect(m).toHaveProperty("name");
      expect(m).toHaveProperty("role");
      // Sensitive and internal fields must NOT be present
      expect(m.email).toBeUndefined();
      expect(m.user_id).toBeUndefined();
      expect(m.id).toBeUndefined();
      expect(m.joined_at).toBeUndefined();
    }
  });

  test("returns 403 for wrong groupId", async () => {
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: "X999" });

    expect(res.status).toBe(403);
  });

  test("returns 403 when groupId is missing", async () => {
    const res = await request(app).get("/api/ai/tools/members");
    expect(res.status).toBe(403);
  });

  test("returns 503 when Supabase not configured", async () => {
    dataService.isAvailable.mockReturnValue(false);
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(503);
  });

  test("returns 500 on database failure", async () => {
    dataService.getMembers.mockRejectedValue(new Error("DB error"));
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(500);
  });

  test("returns 200 with empty array when group has no members", async () => {
    dataService.getMembers.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: DEMO_GROUP_ID });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Regression: existing /api/ai/chat still works", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => jest.clearAllMocks());

  test("POST /api/ai/chat returns 200 with mocked langflow response", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "Apa itu Smart Cash?" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("mocked response");
    expect(res.body.requestId).toBeDefined();
  });

  test("POST /api/ai/chat returns 400 for empty message", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({ message: "" });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Security: sensitive field leakage checks", () => {
  let app;

  beforeEach(() => {
    app = createApp();
    dataService.isAvailable.mockReturnValue(true);

    dataService.getGroupSummary.mockResolvedValue({
      balance: 1000, monthlyIncome: 500, monthlyExpense: 200, monthlyNet: 300,
      contributionStatus: { paid: 1, partial: 0, unpaid: 0, total: 1 },
      memberCount: 1, period: "2025-06",
    });

    dataService.getContributions.mockResolvedValue([
      { user_id: "U001", status: "paid", paid_amount: 100, expected_amount: 100, period: "2025-06" },
    ]);
    dataService.getMembers.mockResolvedValue([
      { user_id: "U001", name: "Alice", role: "admin", email: "alice@secret.com", id: "GM001", joined_at: "2024-01-01" },
    ]);
    dataService.getTransactions.mockResolvedValue([
      { id: "T001", type: "income", description: "dues", category: "contribution", amount: 100, date: "2025-06-01",
        group_id: "G001", status: "posted", created_by: "U002" },
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  test("financial-summary does not expose internal service fields", async () => {
    const res = await request(app)
      .get("/api/ai/tools/financial-summary")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    expect(res.body.data.monthlyNet).toBeUndefined();
    expect(res.body.data.contributionStatus).toBeUndefined();
  });

  test("members endpoint never returns email", async () => {
    const res = await request(app)
      .get("/api/ai/tools/members")
      .query({ groupId: DEMO_GROUP_ID });

    const json = JSON.stringify(res.body);
    expect(json).not.toContain("alice@secret.com");
    expect(json).not.toContain("email");
  });

  test("contributions endpoint never returns email or user_id", async () => {
    const res = await request(app)
      .get("/api/ai/tools/contributions")
      .query({ groupId: DEMO_GROUP_ID, period: "2025-06" });

    const json = JSON.stringify(res.body);
    expect(json).not.toContain("email");
    // user_id as standalone key should not appear in response items
    for (const item of res.body.data) {
      expect(item.user_id).toBeUndefined();
    }
  });

  test("transactions endpoint never returns group_id, status, or created_by", async () => {
    const res = await request(app)
      .get("/api/ai/tools/transactions")
      .query({ groupId: DEMO_GROUP_ID });

    for (const item of res.body.data) {
      expect(item.group_id).toBeUndefined();
      expect(item.status).toBeUndefined();
      expect(item.created_by).toBeUndefined();
    }
  });
});
