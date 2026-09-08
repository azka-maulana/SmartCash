"use strict";

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ error: "Forbidden: cross-origin request not allowed." });
  }
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON in request body." });
  }
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({ error: "Request body too large." });
  }
  console.error("[ErrorHandler]", { name: err.name, status: err.status, path: req.path });
  return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
}

module.exports = { errorHandler };