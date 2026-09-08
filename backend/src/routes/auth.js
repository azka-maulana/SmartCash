"use strict";
const { Router } = require("express");
const { z } = require("zod");
const { authenticate } = require("../services/authService");
const { authRateLimiter } = require("../middleware/rateLimiter");
const { isAvailable } = require("../services/dataService");
const { config } = require("../config/env");

const router = Router();
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

router.post("/auth/login", authRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email and password are required." });
  if (!isAvailable()) return res.status(503).json({ error: "Authentication service is not configured." });

  try {
    const user = await authenticate(parsed.data.email, parsed.data.password, config.demo.groupId);
    if (!user) return res.status(401).json({ error: "Invalid email or password." });
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("[Auth] login error", { name: error.name });
    return res.status(500).json({ error: "Unable to sign in right now." });
  }
});

module.exports = router;
