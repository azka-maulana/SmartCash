"use strict";
const { Router } = require("express");
const { generateRequestId } = require("../utils/requestId");
const {
  isAvailable,
  getGroup,
  createMember,
  getMembers,
  getTransactions,
  createTransaction,
  voidTransaction,
  getContributions,
  recordPayment,
  getGroupSummary,
} = require("../services/dataService");
const { config } = require("../config/env");

const router = Router();

// ── Middleware: require Supabase to be configured ────────────────────────────

function requireSupabase(req, res, next) {
  if (!isAvailable()) {
    return res.status(503).json({
      error: "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env",
      requestId: req.requestId,
    });
  }
  next();
}

// Attach requestId to every request
router.use((req, _res, next) => {
  req.requestId = generateRequestId();
  next();
});

router.get("/groups/:groupId", requireSupabase, async (req, res) => {
  const { groupId } = req.params;
  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const group = await getGroup(groupId);
    return res.status(200).json({ data: group, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] group error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch group", requestId: req.requestId });
  }
});

// ── GET /api/groups/:groupId/summary ─────────────────────────────────────────

router.get("/groups/:groupId/summary", requireSupabase, async (req, res) => {
  const { groupId } = req.params;
  const period = req.query.period ?? new Date().toISOString().slice(0, 7); // default: current month

  // Only allow the trusted demo group
  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const summary = await getGroupSummary(groupId, period);
    return res.status(200).json({ data: summary, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] summary error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch group summary", requestId: req.requestId });
  }
});

// ── GET /api/groups/:groupId/members ─────────────────────────────────────────

router.get("/groups/:groupId/members", requireSupabase, async (req, res) => {
  const { groupId } = req.params;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const members = await getMembers(groupId);
    return res.status(200).json({ data: members, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] members error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch members", requestId: req.requestId });
  }
});

router.post("/groups/:groupId/members", requireSupabase, async (req, res) => {
  const { groupId } = req.params;
  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  const { name, email } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "name must contain at least 2 characters", requestId: req.requestId });
  }
  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: "email must be valid", requestId: req.requestId });
  }

  try {
    const member = await createMember(groupId, { name, email });
    console.log("[Groups] member created", { groupId, memberId: member.id });
    return res.status(201).json({ data: member, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] create member error", { groupId, error: err.message });
    if (err.message.includes("duplicate key") || err.message.includes("already exists")) {
      return res.status(409).json({ error: "A member with this email already exists", requestId: req.requestId });
    }
    return res.status(500).json({ error: "Failed to create member", requestId: req.requestId });
  }
});

// ── GET /api/groups/:groupId/transactions ─────────────────────────────────────

router.get("/groups/:groupId/transactions", requireSupabase, async (req, res) => {
  const { groupId } = req.params;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const transactions = await getTransactions(groupId);
    return res.status(200).json({ data: transactions, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] transactions error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch transactions", requestId: req.requestId });
  }
});

// ── POST /api/groups/:groupId/transactions ────────────────────────────────────

router.post("/groups/:groupId/transactions", requireSupabase, async (req, res) => {
  const { groupId } = req.params;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  const { type, description, category, amount, date } = req.body;

  // Validate required fields
  if (!type || !["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'", requestId: req.requestId });
  }
  const numAmount = Number(amount);
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number", requestId: req.requestId });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "description is required", requestId: req.requestId });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD", requestId: req.requestId });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "category is required", requestId: req.requestId });
  }

  // Trusted server-side user ID — client cannot override
  const userId = config.demo.userId;

  try {
    const tx = await createTransaction(groupId, userId, {
      type,
      description: description.trim(),
      category,
      amount: numAmount,
      date,
    });
    console.log("[Groups] transaction created", { groupId, id: tx.id });
    return res.status(201).json({ data: tx, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] create transaction error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to create transaction", requestId: req.requestId });
  }
});

// ── PATCH /api/groups/:groupId/transactions/:transactionId/void ───────────────

router.patch("/groups/:groupId/transactions/:transactionId/void", requireSupabase, async (req, res) => {
  const { groupId, transactionId } = req.params;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const tx = await voidTransaction(groupId, transactionId);
    console.log("[Groups] transaction voided", { groupId, transactionId });
    return res.status(200).json({ data: tx, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] void transaction error", { groupId, transactionId, error: err.message });
    return res.status(500).json({ error: "Failed to void transaction", requestId: req.requestId });
  }
});

// ── GET /api/groups/:groupId/contributions ────────────────────────────────────

router.get("/groups/:groupId/contributions", requireSupabase, async (req, res) => {
  const { groupId } = req.params;
  const period = req.query.period;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  try {
    const contributions = await getContributions(groupId, period);
    return res.status(200).json({ data: contributions, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] contributions error", { groupId, error: err.message });
    return res.status(500).json({ error: "Failed to fetch contributions", requestId: req.requestId });
  }
});

// ── POST /api/groups/:groupId/contributions/payment ───────────────────────────

router.post("/groups/:groupId/contributions/payment", requireSupabase, async (req, res) => {
  const { groupId } = req.params;

  if (groupId !== config.demo.groupId) {
    return res.status(403).json({ error: "Access denied", requestId: req.requestId });
  }

  const { userId, period, amount } = req.body;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required", requestId: req.requestId });
  }
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ error: "period must be YYYY-MM", requestId: req.requestId });
  }
  const numAmount = Number(amount);
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number", requestId: req.requestId });
  }

  // Trusted server-side admin user ID
  const recordedBy = config.demo.userId;

  try {
    const contribution = await recordPayment(groupId, userId, period, numAmount, recordedBy);
    console.log("[Groups] payment recorded", { groupId, userId, period, amount: numAmount });
    return res.status(200).json({ data: contribution, requestId: req.requestId });
  } catch (err) {
    console.error("[Groups] record payment error", { groupId, error: err.message });
    const missingContribution = err.message.startsWith("No contribution exists");
    const status = missingContribution ? 409 : 500;
    const error = missingContribution ? err.message : "Failed to record payment";
    return res.status(status).json({ error, requestId: req.requestId });
  }
});

module.exports = router;
