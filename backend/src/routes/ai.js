"use strict";

const { Router } = require("express");
const {
  chatRequestSchema,
} = require("../validation/aiSchema");
const {
  callLangflow,
  LangflowTimeoutError,
  LangflowUpstreamError,
} = require("../services/langflowService");
const { aiRateLimiter } = require("../middleware/rateLimiter");
const { generateRequestId } = require("../utils/requestId");
const { config } = require("../config/env");
const {
  isAvailable,
  getGroupSummary,
  getContributions,
  getTransactions,
  getMembers,
} = require("../services/dataService");

const router = Router();

/**
 * Fetches live app data (balance, contributions, transactions, members) from
 * the app database and returns it as a formatted text block.
 *
 * This block is prepended to the user message so the LLM always has accurate,
 * current data when answering — regardless of what's in the knowledge database.
 *
 * @param {string} groupId
 * @param {string} requestId
 * @returns {Promise<string>}
 */
async function buildLiveDataContext(groupId, requestId) {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  try {
    const [summary, contributions, transactions, members] =
      await Promise.all([
        getGroupSummary(groupId, period),
        getContributions(groupId, period),
        getTransactions(groupId, { limit: 20 }),
        getMembers(groupId),
      ]);

    const fmt = (n) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(n);

    // ── Financial summary ──────────────────────────────────────────────────
    const summaryLines = [
      `### Ringkasan Keuangan (${period})`,
      `- Saldo saat ini: ${fmt(summary.balance)}`,
      `- Pemasukan bulan ini: ${fmt(summary.monthlyIncome)}`,
      `- Pengeluaran bulan ini: ${fmt(summary.monthlyExpense)}`,
      `- Net bulan ini: ${fmt(summary.monthlyNet)}`,
      `- Jumlah anggota: ${summary.memberCount}`,
      `- Status iuran: ${summary.contributionStatus.paid} lunas, ` +
        `${summary.contributionStatus.partial} sebagian, ` +
        `${summary.contributionStatus.unpaid} belum bayar`,
    ];

    // ── Per-member contribution status ────────────────────────────────────
    const nameById = {};

    for (const m of members) {
      nameById[m.user_id] = m.name;
    }

    const contribLines = contributions.map((c) => {
      const name = nameById[c.user_id] ?? c.user_id;

      const statusLabel =
        c.status === "paid"
          ? "lunas"
          : c.status === "partial"
            ? "sebagian"
            : "belum bayar";

      return `  - ${name}: ${statusLabel} (${fmt(
        c.paid_amount
      )} dari ${fmt(c.expected_amount)})`;
    });

    const contribBlock =
      contribLines.length > 0
        ? [`### Status Iuran Anggota (${period})`, ...contribLines]
        : [
            `### Status Iuran Anggota (${period})`,
            "  Tidak ada data iuran untuk periode ini.",
          ];

    // ── Members not fully paid ─────────────────────────────────────────────
    const notPaid = contributions
      .filter((c) => c.status !== "paid")
      .map((c) => {
        const name = nameById[c.user_id] ?? c.user_id;

        const label =
          c.status === "partial" ? "sebagian" : "belum bayar";

        return `  - ${name} (${label})`;
      });

    const unpaidBlock =
      notPaid.length > 0
        ? [
            "### Anggota Belum/Belum Lunas Bayar",
            ...notPaid,
          ]
        : [
            "### Anggota Belum/Belum Lunas Bayar",
            `  Semua anggota sudah lunas untuk ${period}.`,
          ];

    // ── Recent transactions ───────────────────────────────────────────────
    const txLines = transactions.slice(0, 15).map((t) => {
      const sign = t.type === "income" ? "+" : "-";

      return `  - [${t.date}] ${sign}${fmt(t.amount)} | ${
        t.description
      } (${t.category})`;
    });

    const txBlock =
      txLines.length > 0
        ? ["### Transaksi Terbaru", ...txLines]
        : ["### Transaksi Terbaru", "  Tidak ada transaksi."];

    // ── Member list ───────────────────────────────────────────────────────
    const memberLines = members.map(
      (m) => `  - ${m.name} (${m.role})`
    );

    const memberBlock = ["### Daftar Anggota", ...memberLines];

    return [
      "## DATA APLIKASI LIVE (akurat, dari database)",
      summaryLines.join("\n"),
      contribBlock.join("\n"),
      unpaidBlock.join("\n"),
      txBlock.join("\n"),
      memberBlock.join("\n"),
    ].join("\n\n");
  } catch (err) {
    console.warn("[AI Chat] live data error", {
      requestId,
      upstreamStatus: err?.upstreamStatus ?? null,
      message: err?.message ?? null,
      name: err?.name ?? null,
    });

    return "";
  }
}

router.post("/ai/chat", aiRateLimiter, async (req, res) => {
  const requestId = generateRequestId();

  const parseResult = chatRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    const firstIssue =
      (parseResult.error.errors[0] &&
        parseResult.error.errors[0].message) ||
      "Invalid request";

    return res.status(400).json({
      error: firstIssue,
      requestId,
    });
  }

  // Only message and sessionId come from the client.
  // groupId/userId are always sourced server-side — never overridable by the browser.
  const { message, sessionId } = parseResult.data;
  const demoGroupId = config.demo.groupId;

  console.log("[AI Chat]", {
    requestId,
    messageLength: message.length,
    hasSession: !!sessionId,
    groupId: demoGroupId,
  });

  // Fetch live data from app database and build context block
  const liveContext = isAvailable()
    ? await buildLiveDataContext(demoGroupId, requestId)
    : "";

  // Build the enriched input: live data block + user question in one message.
  // Langflow Prompt Template receives this as {input} and sends it to the LLM.
  const enrichedMessage = liveContext
    ? `${liveContext}\n\n## Pertanyaan Pengguna\n${message}`
    : message;

  try {
    const start = Date.now();

    const result = await callLangflow(
      enrichedMessage,
      sessionId
    );

    const latencyMs = Date.now() - start;

    console.log("[AI Chat] success", {
      requestId,
      latencyMs,
    });

    const responseBody = {
      message: result.message,
      requestId,
    };

    if (result.sessionId) {
      responseBody.sessionId = result.sessionId;
    }

    return res.status(200).json(responseBody);
  } catch (err) {
    if (err instanceof LangflowTimeoutError) {
      console.warn("[AI Chat] timeout", {
        requestId,
      });

      return res.status(504).json({
        error:
          "The AI service took too long to respond. Please try again.",
        requestId,
      });
    }

    if (err instanceof LangflowUpstreamError) {
      console.warn("[AI Chat] upstream error", {
        requestId,
        upstreamStatus: err.upstreamStatus ?? null,
        message: err.message ?? null,
      });

      return res.status(502).json({
        error:
          "The AI service is temporarily unavailable. Please try again.",
        requestId,
      });
    }

    console.error("[AI Chat] unexpected error", {
      requestId,
      name: err?.name ?? null,
      message: err?.message ?? null,
    });

    return res.status(500).json({
      error:
        "An unexpected error occurred. Please try again.",
      requestId,
    });
  }
});

module.exports = router;