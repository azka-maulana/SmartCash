"use strict";
const { Router } = require("express");
const { chatRequestSchema } = require("../validation/aiSchema");
const { callLangflow, LangflowTimeoutError, LangflowUpstreamError } = require("../services/langflowService");
const { aiRateLimiter } = require("../middleware/rateLimiter");
const { generateRequestId } = require("../utils/requestId");
const { config } = require("../config/env");

const router = Router();

router.post("/ai/chat", aiRateLimiter, async (req, res) => {
  const requestId = generateRequestId();

  const parseResult = chatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.errors[0] && parseResult.error.errors[0].message || "Invalid request";
    return res.status(400).json({ error: firstIssue, requestId });
  }

  // Only message and sessionId come from the client.
  // role, userId, groupId are ALWAYS sourced server-side from demo config.
  // Client-supplied role/userId fields are silently ignored (schema strips them).
  const { message, sessionId } = parseResult.data;

  // Trusted server-side demo context — never overridable by the browser.
  const demoGroupId = config.demo.groupId;
  const demoUserId  = config.demo.userId;

  console.log("[AI Chat]", {
    requestId,
    messageLength: message.length,
    hasSession: !!sessionId,
    groupId: demoGroupId,
    userId: demoUserId,
  });

  try {
    const start = Date.now();
    const result = await callLangflow(message, sessionId);
    const latencyMs = Date.now() - start;
    console.log("[AI Chat] success", { requestId, latencyMs });

    const responseBody = { message: result.message, requestId };
    if (result.sessionId) responseBody.sessionId = result.sessionId;
    return res.status(200).json(responseBody);
  } catch (err) {
    if (err instanceof LangflowTimeoutError) {
      console.warn("[AI Chat] timeout", { requestId });
      return res.status(504).json({ error: "The AI service took too long to respond. Please try again.", requestId });
    }
    if (err instanceof LangflowUpstreamError) {
      console.warn("[AI Chat] upstream error", { requestId, upstreamStatus: err.upstreamStatus });
      return res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again.", requestId });
    }
    console.error("[AI Chat] unexpected error", { requestId, name: err && err.name });
    return res.status(500).json({ error: "An unexpected error occurred. Please try again.", requestId });
  }
});

module.exports = router;
