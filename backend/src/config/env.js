"use strict";
require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

function guardPlaceholder(name, value) {
  const placeholders = ["your-flow-id-here", "your-langflow-api-key-here", "changeme", "placeholder"];
  if (placeholders.includes(value.toLowerCase())) {
    throw new Error(
      "Environment variable " + name + " still contains a placeholder value.\n" +
      "Edit backend/.env and set the real value before starting the server."
    );
  }
  return value;
}

const rawFlowId   = requireEnv("LANGFLOW_FLOW_ID");
const rawApiKey   = requireEnv("LANGFLOW_API_KEY");

const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  langflow: {
    baseUrl:    requireEnv("LANGFLOW_BASE_URL"),
    flowId:     guardPlaceholder("LANGFLOW_FLOW_ID", rawFlowId),
    apiKey:     guardPlaceholder("LANGFLOW_API_KEY", rawApiKey),
    timeoutMs:  parseInt(process.env.LANGFLOW_TIMEOUT_MS ?? "30000", 10),
  },
  supabase: {
    url:            process.env.SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
  demo: {
    groupId: process.env.DEMO_GROUP_ID ?? "G001",
    userId:  process.env.DEMO_USER_ID  ?? "U002",
  },
};

module.exports = { config };
