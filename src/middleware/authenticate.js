"use strict";

const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Validates the bearer token on an incoming request and attaches the
 * authenticated user identity to `req.user`.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {void}
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid bearer token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Missing or invalid bearer token" });
  }
}

module.exports = { authenticate };
