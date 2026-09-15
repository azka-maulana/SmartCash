"use strict";
const crypto = require("crypto");
const { promisify } = require("util");
const { supabase } = require("./supabaseService");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

// Default password assigned to every new member added by an admin.
// Members can log in immediately with this password.
const DEMO_DEFAULT_PASSWORD = "demo1234";

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;

  // Legacy placeholder — accounts seeded or created with "DEMO_HASH" use the
  // default demo password so existing members can log in immediately.
  if (storedHash === "DEMO_HASH") {
    return password === DEMO_DEFAULT_PASSWORD;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]+$/.test(parts[2])) return false;

  const derivedKey = await scrypt(password, parts[1], parts[2].length / 2, SCRYPT_OPTIONS);
  const expected = Buffer.from(parts[2], "hex");
  const actual = Buffer.from(derivedKey);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function authenticate(email, password, groupId) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email, password_hash, status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) throw new Error("Failed to authenticate user: " + userError.message);
  if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash))) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new Error("Failed to load user membership: " + membershipError.message);
  if (!membership) return null;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: membership.role === "admin" ? "admin" : "user",
    groupId: membership.group_id,
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, password_hash, status")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error("Failed to fetch user: " + error.message);
  if (!user || user.status !== "active") return "not_found";

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) return "wrong_password";

  const newHash = await hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", userId);

  if (updateError) throw new Error("Failed to update password: " + updateError.message);
  return "ok";
}

module.exports = { hashPassword, verifyPassword, authenticate, changePassword, DEMO_DEFAULT_PASSWORD };
