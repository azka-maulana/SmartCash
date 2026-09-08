"use strict";
const { createClient } = require("@supabase/supabase-js");
const { config } = require("../config/env");

/**
 * Server-side Supabase client using the service-role key.
 * This module must NEVER be imported from frontend code.
 * The service-role key is never sent to the browser.
 *
 * Returns null when Supabase is not configured (demo/test mode without real credentials).
 */
function createSupabaseClient() {
  const { url, serviceRoleKey } = config.supabase;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

const supabase = createSupabaseClient();

module.exports = { supabase };
