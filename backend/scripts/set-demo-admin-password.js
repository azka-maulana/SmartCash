"use strict";
require("dotenv").config();
const { supabase } = require("../src/services/supabaseService");
const { hashPassword } = require("../src/services/authService");

(async () => {
  const passwordHash = await hashPassword("demo1234");
  const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", "U001").eq("email", "azka@student.ac.id");
  if (error) throw error;
  console.log("Demo admin password hash updated for U001.");
})().catch((error) => {
  console.error("Failed to update demo admin password:", error.message);
  process.exitCode = 1;
});
