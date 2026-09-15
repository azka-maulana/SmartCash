"use strict";
/**
 * AI Data Tool Endpoints — /api/ai/tools/*
 *
 * Four narrow, read-only, group-scoped endpoints that Langflow calls as tools.
 * Authorization is enforced server-side: only config.demo.groupId is accepted.
 * This is MVP/demo-scope protection — the backend is the security boundary.
 *
 * Returned fields are explicitly projected to prevent leaking email addresses,
 * passwords, API keys, tokens, or any other sensitive data to the LLM.
 */

const { Router } = require("express");
const { generateRequestId } = require("../utils/requestId");
const { aiRateLimiter } = require("../middleware/rateLimiter");
const {
  isAvailable,
  getGroupSummary,
  getContributions,
  getTransactions,
  getMembers,
} = require("../services/dataService");
const { config } = require("../config/env");

const router = Router();

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Attach a requestId to every request on this router. */
router.use((req, _res, next) => {
  req.requestId = generateRequestId();
  next();
});

/** 503 when Supabase is not configured. */
function requireSupabase(req, res, next) {
  if (!isAvailable()) {
    return res.status(503).json({
      error: "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env",
      requestId: req.requestId,
    });
  }
  next();
}

/**
 * Validates a YYYY-MM period string.
 * Returns true when valid; false otherwise.
 */
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
function isValidPeriod(value) {
  return typeof value === "string" && PERIOD_RE.test(value);
}

/** Returns the current month as YYYY-MM (runtime, never hardcoded). */
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// ── GET /api/ai/tools/financial-summary ───────────────────────────────────────
/**
 * Returns current balance, monthly income/expense, contribution counts
 * (paid/partial/unpaid), and member count for the group.
 *
 * Query params:
 *   groupId  — required
 *   period   — YYYY-MM, optional (defaults to current month)
 */
router.get("/ai/tools/financial-summary", aiRateLimiter, requireSupabase, async (req, res) => {
  const { groupId, period: rawPeriod } = req.query;

  // Authorization: MVP/demo-scope server-side check
  if (!groupId || groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  // Period validation
  const period = rawPeriod ?? currentMonth();
  if (!isValidPeriod(period)) {
    return res.status(400).json({ error: "period must be YYYY-MM (e.g. 2025-06)", requestId: req.requestId });
  }

  try {
    const summary = await getGroupSummary(groupId, period);

    // Explicit field projection — only expose what the AI needs
    return res.status(200).json({
      data: {
        balance: summary.balance,
        monthlyIncome: summary.monthlyIncome,
        monthlyExpense: summary.monthlyExpense,
        contributionCounts: {
          paid:    summary.contributionStatus.paid,
          partial: summary.contributionStatus.partial,
          unpaid:  summary.contributionStatus.unpaid,
          total:   summary.contributionStatus.total,
        },
        memberCount: summary.memberCount,
        period: summary.period,
      },
      requestId: req.requestId,
    });
  } catch (err) {
    console.error("[AI Tools] financial-summary error", { groupId, period, error: err.message });
    return res.status(500).json({ error: "Failed to fetch financial summary", requestId: req.requestId });
  }
});

// ── GET /api/ai/tools/contributions ───────────────────────────────────────────
/**
 * Returns each member's contribution status (paid/partial/unpaid),
 * paid amount, and expected amount for a given period.
 *
 * Query params:
 *   groupId  — required
 *   period   — YYYY-MM, optional (defaults to current month)
 */
router.get("/ai/tools/contributions", aiRateLimiter, requireSupabase, async (req, res) => {
  const { groupId, period: rawPeriod } = req.query;

  if (!groupId || groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  const period = rawPeriod ?? currentMonth();
  if (!isValidPeriod(period)) {
    return res.status(400).json({ error: "period must be YYYY-MM (e.g. 2025-06)", requestId: req.requestId });
  }

  try {
    // Fetch contributions and members in parallel for name resolution
    const [contributions, members] = await Promise.all([
      getContributions(groupId, period),
      getMembers(groupId),
    ]);

    // Build a userId → name lookup; never expose email
    const nameById = {};
    for (const m of members) {
      nameById[m.user_id] = m.name;
    }

    // Explicit field projection — no email, no internal IDs beyond what is needed
    const data = contributions.map((c) => ({
      memberName:     nameById[c.user_id] ?? c.user_id,
      status:         c.status,
      paidAmount:     c.paid_amount,
      expectedAmount: c.expected_amount,
      period:         c.period,
    }));

    return res.status(200).json({ data, requestId: req.requestId });
  } catch (err) {
    console.error("[AI Tools] contributions error", { groupId, period, error: err.message });
    return res.status(500).json({ error: "Failed to fetch contributions", requestId: req.requestId });
  }
});

// ── GET /api/ai/tools/transactions ────────────────────────────────────────────
/**
 * Returns recent transactions for the group (type, description, category,
 * amount, date). Filtering and limiting are applied at the DB level.
 *
 * Query params:
 *   groupId  — required
 *   period   — YYYY-MM, optional
 *   limit    — positive integer, optional (default 20, max 50)
 */
router.get("/ai/tools/transactions", aiRateLimiter, requireSupabase, async (req, res) => {
  const { groupId, period: rawPeriod, limit: rawLimit } = req.query;

  if (!groupId || groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  // Period validation (optional)
  if (rawPeriod !== undefined && !isValidPeriod(rawPeriod)) {
    return res.status(400).json({ error: "period must be YYYY-MM (e.g. 2025-06)", requestId: req.requestId });
  }

  // Limit validation and clamping
  let limit = 20;
  if (rawLimit !== undefined) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return res.status(400).json({ error: "limit must be a positive integer", requestId: req.requestId });
    }
    limit = Math.min(parsed, 50);
  }

  try {
    const transactions = await getTransactions(groupId, {
      period: rawPeriod,
      limit,
    });

    // Explicit field projection — strip internal fields (group_id, status, created_by)
    const data = transactions.map((t) => ({
      id:          t.id,
      type:        t.type,
      description: t.description,
      category:    t.category,
      amount:      t.amount,
      date:        t.date,
    }));

    return res.status(200).json({ data, requestId: req.requestId });
  } catch (err) {
    console.error("[AI Tools] transactions error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch transactions", requestId: req.requestId });
  }
});

// ── GET /api/ai/tools/members ─────────────────────────────────────────────────
/**
 * Returns the list of active group members (name and role only).
 * Email is intentionally excluded.
 *
 * Query params:
 *   groupId  — required
 */
router.get("/ai/tools/members", aiRateLimiter, requireSupabase, async (req, res) => {
  const { groupId } = req.query;

  if (!groupId || groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const members = await getMembers(groupId);

    // Explicit field projection — name and role ONLY; no email, no IDs
    const data = members.map((m) => ({
      name: m.name,
      role: m.role,
    }));

    return res.status(200).json({ data, requestId: req.requestId });
  } catch (err) {
    console.error("[AI Tools] members error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch members", requestId: req.requestId });
  }
});

module.exports = router;
