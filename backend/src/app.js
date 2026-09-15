"use strict";

const express = require("express");
const helmet = require("helmet");

const { corsMiddleware } = require("./middleware/cors");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");

const healthRouter = require("./routes/health");
const aiRouter = require("./routes/ai");
const aiToolsRouter = require("./routes/aiTools");
const authRouter = require("./routes/auth");
const groupsRouter = require("./routes/groups");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));
  app.use(globalRateLimiter);

  app.use("/api", healthRouter);
  app.use("/api", aiRouter);
  app.use("/api", aiToolsRouter);
  app.use("/api", authRouter);
  app.use("/api", groupsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;