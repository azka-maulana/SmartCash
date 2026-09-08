"use strict";
const { v4: uuidv4 } = require("uuid");

function generateRequestId() {
  return "req_" + uuidv4().replace(/-/g, "").slice(0, 12);
}

module.exports = { generateRequestId };