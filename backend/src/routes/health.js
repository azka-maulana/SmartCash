"use strict";
const { Router } = require("express");
const { config } = require("../config/env");
const router = Router();

router.get("/health", (req, res) => {
  const supabaseConfigured = !!(config.supabase.url && config.supabase.serviceRoleKey);

  res.status(200).json({
    status: "ok",
    service: "smart-cash-backend",
    timestamp: new Date().toISOString(),
    supabase: {
      url: supabaseConfigured ? "configured" : "not configured",
    },
    langflow: {
      baseUrl: config.langflow.baseUrl ? "configured" : "not configured",
      flowId: config.langflow.flowId ? "configured" : "not configured",
    },
    demo: {
      groupId: config.demo.groupId,
      userId: config.demo.userId,
    },
  });
});

module.exports = router;