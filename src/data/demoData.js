/**
 * demoData.js
 *
 * Pure contribution status utility used by the frontend.
 * Business data comes from the backend and Supabase.
 */

// ─── Pure utility ──────────────────────────────────────────────────────────

/**
 * Derives contribution status deterministically from paid vs expected amount.
 * Matches the backend/database model — do not invent status from names or assumptions.
 *
 * @param {{ paid_amount: number, expected_amount: number }} contribution
 * @returns {"paid" | "partial" | "unpaid"}
 */
export function deriveStatus(contribution) {
  if (contribution.paid_amount >= contribution.expected_amount) return "paid";
  if (contribution.paid_amount > 0) return "partial";
  return "unpaid";
}
