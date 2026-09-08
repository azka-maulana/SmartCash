/**
 * aiService.js
 *
 * Frontend-only service for calling the Smart Cash AI Gateway.
 * This file ONLY calls the Smart Cash backend — never Langflow directly.
 * No Langflow URL, flow ID, or API key belongs here.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Sends a user message to the Smart Cash AI Gateway.
 *
 * @param {string} message
 * @param {string|undefined} sessionId  Optional Langflow session ID for conversation threading
 * @returns {Promise<{ message: string, requestId: string, sessionId?: string }>}
 * @throws {Error} with a user-safe message on failure
 */
export async function sendChatMessage(message, sessionId) {
  const body = { message };
  if (sessionId) body.sessionId = sessionId;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Sorry, I couldn't reach the AI service. Please try again.");
  }

  if (!response.ok) {
    // Parse the backend's safe error message when available
    let errorMessage = "Sorry, I couldn't reach the AI service. Please try again.";
    try {
      const data = await response.json();
      if (data?.error && typeof data.error === "string") {
        errorMessage = data.error;
      }
    } catch {
      // ignore parse failure — use default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}
