"use strict";
const crypto = require("crypto");
const { promisify } = require("util");
const { supabase } = require("./supabaseService");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;
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

module.exports = { hashPassword, verifyPassword, authenticate };
