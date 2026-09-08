"use strict";
const cors = require("cors");
const { config } = require("../config/env");

const allowedOrigins = config.frontendOrigin
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      if (process.env.NODE_ENV === "production") {
        return callback(new Error("CORS: no origin not permitted in production"));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS: origin \"" + origin + "\" is not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
});

module.exports = { corsMiddleware };