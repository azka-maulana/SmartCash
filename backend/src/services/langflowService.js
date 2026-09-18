"use strict";
const { config } = require("../config/env");

/**
 * Calls the Langflow "smart cash" flow via the Run-Flow REST API.
 *
 * Endpoint: POST {LANGFLOW_BASE_URL}/api/v1/run/{LANGFLOW_FLOW_ID}?stream=false
 *
 * The enrichedMessage already contains live app data prepended by the route
 * handler — so Langflow receives a single self-contained input value.
 *
 * @param {string} enrichedMessage  User question + live data context, pre-built by caller
 * @param {string|undefined} sessionId
 * @returns {Promise<{ message: string, sessionId?: string }>}
 */
async function callLangflow(enrichedMessage, sessionId) {
  const { baseUrl, flowId, apiKey, timeoutMs } = config.langflow;
  const url = `${baseUrl}/api/v1/run/${flowId}?stream=false`;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let response;

try {
  response = await fetch(url, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      input_value: enrichedMessage,
      input_type: "chat",
      output_type: "chat",
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });
} catch (err) {
  if (err?.name === "AbortError") {
    throw new LangflowTimeoutError("Langflow request timed out");
  }

  console.error("[Langflow] fetch failed", {
    name: err?.name,
    message: err?.message,
    cause: err?.cause?.message ?? err?.cause,
    code: err?.cause?.code,
  });

  throw new LangflowUpstreamError(
    "Could not connect to the AI service"
  );
} finally {
  clearTimeout(timeoutHandle);
}

if (!response.ok) {
  throw new LangflowUpstreamError(
    "Langflow returned HTTP " + response.status,
    response.status
  );
}

const contentType = response.headers.get("content-type") || "";
const rawBody = await response.text();

console.log("[Langflow] response", {
  status: response.status,
  contentType,
  bodyLength: rawBody.length,
});

let data;

try {
  data = JSON.parse(rawBody);
} catch (err) {
  console.error("[Langflow] invalid JSON response", {
    status: response.status,
    contentType,
    bodyPreview: rawBody.slice(0, 500),
  });

  throw new LangflowUpstreamError(
    "Langflow returned a non-JSON response",
    response.status
  );
}

const message = extractMessage(data);

if (!message) {
  console.error("[Langflow] unreadable response", {
    status: response.status,
    keys: Object.keys(data || {}),
    bodyPreview: JSON.stringify(data).slice(0, 1000),
  });

  throw new LangflowUpstreamError(
    "Langflow response did not contain a readable message",
    response.status
  );
}

/**
 * Extracts the final assistant text from the Langflow response.
 * Tries all known response shapes in priority order.
 */
function extractMessage(data) {
  const outputs = data && data.outputs;
  if (Array.isArray(outputs) && outputs.length > 0) {
    const first = outputs[0];
    const inner = first && first.outputs;

    if (Array.isArray(inner) && inner.length > 0) {
      const i = inner[0];
      const msgObj = i && i.results && i.results.message;

      const t1 = msgObj && msgObj.data && msgObj.data.text;
      if (typeof t1 === "string" && t1.trim()) return t1.trim();

      const t2 = msgObj && msgObj.text;
      if (typeof t2 === "string" && t2.trim()) return t2.trim();

      const msgs = i && i.messages;
      if (Array.isArray(msgs) && msgs.length > 0) {
        const t3 = msgs[0].message || msgs[0].text;
        if (typeof t3 === "string" && t3.trim()) return t3.trim();
      }

      const t4 = i && i.artifacts && i.artifacts.message;
      if (typeof t4 === "string" && t4.trim()) return t4.trim();
    }

    const msgObj5 = first && first.results && first.results.message;
    const t5 = (msgObj5 && msgObj5.data && msgObj5.data.text) || (msgObj5 && msgObj5.text);
    if (typeof t5 === "string" && t5.trim()) return t5.trim();
  }

  if (typeof data.result === "string" && data.result.trim()) return data.result.trim();
  if (typeof data.output === "string" && data.output.trim()) return data.output.trim();

  return undefined;
}

/**
 * Extracts session_id from the Langflow response.
 */
function extractSessionId(data) {
  if (typeof data.session_id === "string" && data.session_id.trim()) return data.session_id.trim();

  const outputs = data && data.outputs;
  if (Array.isArray(outputs) && outputs.length > 0) {
    const inner = outputs[0] && outputs[0].outputs;
    if (Array.isArray(inner) && inner.length > 0) {
      const sid = inner[0].session_id ||
        (inner[0].results && inner[0].results.message && inner[0].results.message.data && inner[0].results.message.data.session_id);
      if (typeof sid === "string") return sid;
    }
    if (typeof outputs[0].session_id === "string") return outputs[0].session_id;
  }
  return undefined;
}

class LangflowTimeoutError extends Error {
  constructor(message) { super(message); this.name = "LangflowTimeoutError"; }
}

class LangflowUpstreamError extends Error {
  constructor(message, upstreamStatus) {
    super(message);
    this.name = "LangflowUpstreamError";
    this.upstreamStatus = upstreamStatus;
  }
}

module.exports = { callLangflow, LangflowTimeoutError, LangflowUpstreamError };
