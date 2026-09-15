"use strict";
const { Router } = require("express");
const { z } = require("zod");
const { authenticate, changePassword } = require("../services/authService");
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

const changePasswordSchema = z.object({
  userId:          z.string().min(1).max(32),
  currentPassword: z.string().min(1).max(128),
  newPassword:     z.string().min(8, "New password must be at least 8 characters").max(128),
});

router.post("/auth/change-password", authRateLimiter, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Invalid request";
    return res.status(400).json({ error: msg });
  }
  if (!isAvailable()) return res.status(503).json({ error: "Service not configured." });

  const { userId, currentPassword, newPassword } = parsed.data;

  try {
    const result = await changePassword(userId, currentPassword, newPassword);
    if (result === "not_found")     return res.status(404).json({ error: "User not found." });
    if (result === "wrong_password") return res.status(401).json({ error: "Current password is incorrect." });
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("[Auth] change-password error", { name: error.name });
    return res.status(500).json({ error: "Unable to change password right now." });
  }
});

module.exports = router;
