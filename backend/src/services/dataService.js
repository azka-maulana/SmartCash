"use strict";
const { supabase } = require("./supabaseService");
const { hashPassword, DEMO_DEFAULT_PASSWORD } = require("./authService");

/**
 * Safe numeric conversion for Supabase numeric/string values.
 */
function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

/**
 * Returns true when Supabase is available (credentials configured).
 */
function isAvailable() {
  return supabase !== null;
}

async function getNextTransactionId() {
  const { data, error } = await supabase
    .from("transactions")
    .select("id")
    .like("id", "T%");

  if (error) throw new Error("Failed to generate transaction ID: " + error.message);
  let highestNumber = 0;
  for (const row of data ?? []) {
    if (typeof row.id !== "string" || !/^T\d+$/.test(row.id)) {
      throw new Error("Invalid transaction ID format in database");
    }
    highestNumber = Math.max(highestNumber, Number.parseInt(row.id.slice(1), 10));
  }

  const nextId = `T${String(highestNumber + 1).padStart(3, "0")}`;
  if (typeof nextId !== "string" || !/^T\d+$/.test(nextId)) {
    throw new Error("Failed to generate a valid transaction ID");
  }
  return nextId;
}

async function getGroup(groupId) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, created_by, created_at")
    .eq("id", groupId)
    .single();

  if (error) throw new Error("Failed to fetch group: " + error.message);
  return data;
}

async function getNextId(table, prefix) {
  const { data, error } = await supabase.from(table).select("id").like("id", `${prefix}%`);
  if (error) throw new Error(`Failed to generate ${table} ID: ${error.message}`);

  let highestNumber = 0;
  for (const row of data ?? []) {
    if (typeof row.id !== "string" || !new RegExp(`^${prefix}\\d+$`).test(row.id)) {
      throw new Error(`Invalid ${table} ID format in database`);
    }
    highestNumber = Math.max(highestNumber, Number.parseInt(row.id.slice(prefix.length), 10));
  }

  const nextId = `${prefix}${String(highestNumber + 1).padStart(3, "0")}`;
  if (!/^\w+\d+$/.test(nextId)) throw new Error(`Failed to generate a valid ${table} ID`);
  return nextId;
}

async function createMember(groupId, { name, email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingError) throw new Error("Failed to check member email: " + existingError.message);
  if (existingUser) throw new Error("A member with this email already exists");

  const userId   = await getNextId("users", "U");
  const memberId = await getNextId("group_members", "GM");

  // Hash the default password so the new member can log in immediately
  const defaultHash = await hashPassword(DEMO_DEFAULT_PASSWORD);

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: defaultHash,
      status: "active",
    })
    .select("id, name, email, status, created_at")
    .single();

  if (userError) throw new Error("Failed to create user: " + userError.message);

  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .insert({
      id: memberId,
      group_id: groupId,
      user_id: userId,
      role: "member",
      status: "active",
      joined_at: new Date().toISOString(),
    })
    .select("id, group_id, user_id, role, status, joined_at")
    .single();

  if (memberError) {
    await supabase.from("users").delete().eq("id", userId);
    throw new Error("Failed to add group member: " + memberError.message);
  }

  // Auto-create a contribution row for the current period so the new member
  // immediately appears in the payment list and can accept a payment.
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const expectedAmount = await getGroupExpectedAmount(groupId);
  const contribId = await getNextId("contributions", "C");

  const { error: contribError } = await supabase
    .from("contributions")
    .insert({
      id: contribId,
      group_id: groupId,
      user_id: userId,
      period: currentPeriod,
      expected_amount: expectedAmount,
      paid_amount: 0,
      status: "unpaid",
    });

  if (contribError) {
    // Non-fatal: member is created; contribution row will be created on first payment
    console.warn("[createMember] Failed to auto-create contribution row:", contribError.message);
  }

  return {
    id: membership.id,
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: membership.role,
    joined_at: membership.joined_at,
  };
}

/**
 * Returns the standard expected_amount for a group by looking at existing
 * contribution rows. Falls back to 0 if none exist yet.
 *
 * @param {string} groupId
 * @returns {Promise<number>}
 */
async function getGroupExpectedAmount(groupId) {
  const { data, error } = await supabase
    .from("contributions")
    .select("expected_amount")
    .eq("group_id", groupId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return 0;
  return toNumber(data.expected_amount);
}

// ── Members ──────────────────────────────────────────────────────────────────

/**
 * getMembers(groupId)
 *
 * Returns all active group members joined with user data.
 *
 * @param {string} groupId
 * @returns {Promise<Array>}
 */
async function getMembers(groupId) {
  // First get group_members for this group
  const { data: gmData, error: gmError } = await supabase
    .from("group_members")
    .select("id, user_id, role, joined_at, status")
    .eq("group_id", groupId)
    .eq("status", "active");

  if (gmError) throw new Error("Failed to fetch group members: " + gmError.message);
  if (!gmData || gmData.length === 0) return [];

  // Get user details for all member user_ids
  const userIds = gmData.map((gm) => gm.user_id);
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  if (usersError) throw new Error("Failed to fetch users: " + usersError.message);

  // Merge user data into group_member records
  const usersById = {};
  for (const u of usersData ?? []) {
    usersById[u.id] = u;
  }

  return gmData.map((gm) => {
    const user = usersById[gm.user_id] ?? {};
    return {
      id: gm.id,
      user_id: gm.user_id,
      name: user.name ?? gm.user_id,
      email: user.email ?? "",
      role: gm.role,
      joined_at: gm.joined_at,
    };
  });
}

// ── Transactions ─────────────────────────────────────────────────────────────

/**
 * getTransactions(groupId, options)
 *
 * Returns non-voided transactions for the group, newest first.
 * Filtering and limiting are applied at the database query level.
 *
 * @param {string} groupId
 * @param {{ period?: string, limit?: number }} [options]  period = YYYY-MM; limit = max rows
 * @returns {Promise<Array>}
 */
async function getTransactions(groupId, options = {}) {
  let query = supabase
    .from("transactions")
    .select("id, group_id, type, description, category, amount, transaction_date, status, created_by")
    .eq("group_id", groupId)
    .neq("status", "voided")
    .order("transaction_date", { ascending: false });

  if (options.period) {
    const from = options.period + "-01";
    const to   = options.period + "-31";
    query = query.gte("transaction_date", from).lte("transaction_date", to);
  }

  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch transactions: " + error.message);
  return (data ?? []).map((row) => ({
    ...row,
    date: row.transaction_date,
    note: null,
    amount: toNumber(row.amount),
    hasReceipt: false,
    person: null,
  }));
}

/**
 * createTransaction(groupId, userId, body)
 *
 * Inserts a new transaction row.
 *
 * @param {string} groupId
 * @param {string} userId
 * @param {{ type, description, category, amount, date, note? }} body
 * @returns {Promise<object>}
 */
async function createTransaction(groupId, userId, body) {
  const id = await getNextTransactionId();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      id,
      group_id: groupId,
      type: body.type,
      description: body.description,
      category: body.category,
      amount: body.amount,
      transaction_date: body.date,
      status: "posted",
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create transaction: " + error.message);
  return { ...data, date: data.transaction_date, note: null, amount: toNumber(data.amount), hasReceipt: false, person: null };
}

/**
 * voidTransaction(groupId, transactionId)
 *
 * Marks a transaction as voided.
 *
 * @param {string} groupId
 * @param {string} transactionId
 * @returns {Promise<object>}
 */
async function voidTransaction(groupId, transactionId) {
  const { data, error } = await supabase
    .from("transactions")
    .update({ status: "voided" })
    .eq("id", transactionId)
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) throw new Error("Failed to void transaction: " + error.message);
  return { ...data, date: data.transaction_date, note: null, amount: toNumber(data.amount) };
}

// ── Contributions ─────────────────────────────────────────────────────────────

/**
 * getContributions(groupId, period)
 *
 * Returns all contributions for a group in a given period (YYYY-MM).
 *
 * @param {string} groupId
 * @param {string} period  YYYY-MM
 * @returns {Promise<Array>}
 */
async function getContributions(groupId, period) {
  let query = supabase
    .from("contributions")
    .select("id, group_id, user_id, period, expected_amount, paid_amount, status, paid_at, recorded_by")
    .eq("group_id", groupId);
  if (period) query = query.eq("period", period);
  const { data, error } = await query;

  if (error) throw new Error("Failed to fetch contributions: " + error.message);
  return (data ?? []).map((row) => ({
    ...row,
    expected_amount: toNumber(row.expected_amount),
    paid_amount: toNumber(row.paid_amount),
    paidAt: row.paid_at ? row.paid_at.slice(0, 10) : null,
  }));
}

/**
 * recordPayment(groupId, userId, period, additionalAmount, recordedBy)
 *
 * Adds to paid_amount for a contribution and updates status.
 * Requires an existing contribution row so expected_amount always comes from the database.
 *
 * @param {string} groupId
 * @param {string} userId       member whose contribution is being updated
 * @param {string} period       YYYY-MM
 * @param {number} additionalAmount
 * @param {string} recordedBy   admin user id
 * @returns {Promise<object>}
 */
async function recordPayment(groupId, userId, period, additionalAmount, recordedBy) {
  // Fetch existing contribution row and member name in parallel
  const [
    { data: existing, error: fetchError },
    { data: userData, error: userError },
  ] = await Promise.all([
    supabase
      .from("contributions")
      .select("id, expected_amount, paid_amount")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .eq("period", period)
      .maybeSingle(),
    supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (fetchError) throw new Error("Failed to fetch contribution: " + fetchError.message);
  if (userError) throw new Error("Failed to fetch user: " + userError.message);

  // If no contribution row exists yet (e.g. member added before auto-create was
  // in place), create one on-the-fly using the group's standard expected amount.
  if (!existing) {
    const expectedAmount = await getGroupExpectedAmount(groupId);
    if (expectedAmount <= 0) {
      throw new Error("No contribution exists for this member and period; expected amount is not configured.");
    }
    const contribId = await getNextId("contributions", "C");
    const { data: newContrib, error: insertError } = await supabase
      .from("contributions")
      .insert({
        id: contribId,
        group_id: groupId,
        user_id: userId,
        period,
        expected_amount: expectedAmount,
        paid_amount: 0,
        status: "unpaid",
      })
      .select("id, expected_amount, paid_amount")
      .single();
    if (insertError) throw new Error("Failed to create contribution row: " + insertError.message);
    // Re-assign existing so the rest of the function proceeds normally
    Object.assign(existing === null ? {} : existing, newContrib);
    // Use newContrib directly as existing
    return recordPayment(groupId, userId, period, additionalAmount, recordedBy);
  }

  const newPaid = toNumber(existing.paid_amount) + additionalAmount;
  const expectedAmount = toNumber(existing.expected_amount);
  let newStatus = "unpaid";
  if (newPaid >= expectedAmount) newStatus = "paid";
  else if (newPaid > 0) newStatus = "partial";

  const memberName = userData?.name ?? userId;
  const today = new Date().toISOString();
  const todayDate = today.slice(0, 10); // YYYY-MM-DD

  // Generate a transaction ID for the income entry
  const txId = await getNextTransactionId();

  // Update contribution + insert income transaction in parallel
  const [contribResult, txResult] = await Promise.all([
    supabase
      .from("contributions")
      .update({
        paid_amount: newPaid,
        status: newStatus,
        recorded_by: recordedBy,
        paid_at: today,
      })
      .eq("id", existing.id)
      .select()
      .single(),
    supabase
      .from("transactions")
      .insert({
        id: txId,
        group_id: groupId,
        type: "income",
        description: `Iuran ${memberName} – ${period}`,
        category: "Contribution",
        amount: additionalAmount,
        transaction_date: todayDate,
        status: "posted",
        created_by: recordedBy,
      })
      .select()
      .single(),
  ]);

  if (contribResult.error) throw new Error("Failed to update contribution: " + contribResult.error.message);
  if (txResult.error) throw new Error("Failed to record income transaction: " + txResult.error.message);

  const data = contribResult.data;
  return {
    ...data,
    expected_amount: toNumber(data.expected_amount),
    paid_amount: toNumber(data.paid_amount),
    paidAt: data.paid_at ? data.paid_at.slice(0, 10) : null,
  };
}

// ── Summary / Dashboard ───────────────────────────────────────────────────────

/**
 * getGroupSummary(groupId, period)
 *
 * Returns dashboard summary: balance, monthly income/expense, contribution status.
 *
 * @param {string} groupId
 * @param {string} period  YYYY-MM
 * @returns {Promise<object>}
 */
async function getGroupSummary(groupId, period) {
  const from = period + "-01";
  const to   = period + "-31";

  // All posted transactions (for balance)
  const { data: allTx, error: allTxErr } = await supabase
    .from("transactions")
    .select("amount, type, transaction_date")
    .eq("group_id", groupId)
    .neq("status", "voided");

  if (allTxErr) throw new Error("Failed to fetch transactions for summary: " + allTxErr.message);

  const balance = (allTx ?? []).reduce((sum, r) => {
    const a = toNumber(r.amount);
    return r.type === "income" ? sum + a : sum - a;
  }, 0);

  // Period-specific for monthly summary
  const periodTx = (allTx ?? []).filter((r) => r.transaction_date >= from && r.transaction_date <= to);
  const monthlyIncome  = periodTx.filter((r) => r.type === "income").reduce((s, r) => s + toNumber(r.amount), 0);
  const monthlyExpense = periodTx.filter((r) => r.type === "expense").reduce((s, r) => s + toNumber(r.amount), 0);

  // Contribution status for period
  const { data: contribs, error: contribErr } = await supabase
    .from("contributions")
    .select("status")
    .eq("group_id", groupId)
    .eq("period", period);

  if (contribErr) throw new Error("Failed to fetch contributions for summary: " + contribErr.message);

  const rows = contribs ?? [];
  const paid    = rows.filter((r) => r.status === "paid").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const unpaid  = rows.filter((r) => r.status === "unpaid").length;

  // Member count
  const { count: memberCount, error: memberErr } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "active");

  if (memberErr) throw new Error("Failed to fetch member count: " + memberErr.message);

  return {
    balance,
    monthlyIncome,
    monthlyExpense,
    monthlyNet: monthlyIncome - monthlyExpense,
    contributionStatus: { paid, partial, unpaid, total: rows.length },
    memberCount: memberCount ?? 0,
    period,
  };
}

module.exports = {
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
};
