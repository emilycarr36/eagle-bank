"use strict";

const { AppError } = require("../utils/errors");

/**
 * Handles requests that do not match any route in the application.
 *
 * @param {import("express").Request} _req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @returns {void}
 */
function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found" });
}

/**
 * Converts known application errors into JSON responses and falls back to a
 * generic 500 for unexpected exceptions.
 *
 * @param {Error} error - Error thrown by a route, service or repository.
 * @param {import("express").Request} _req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} _next - Express next middleware function.
 * @returns {void}
 */
function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
