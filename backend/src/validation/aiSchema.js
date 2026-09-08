"use strict";
const { z } = require("zod");

const chatRequestSchema = z.object({
  message: z
    .string({ required_error: "message is required" })
    .trim()
    .min(1, "message must not be empty")
    .max(2000, "message must not exceed 2000 characters"),
  sessionId: z.string().trim().max(128).optional(),
});

module.exports = { chatRequestSchema };