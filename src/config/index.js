"use strict";

const path = require("path");

/**
 * Central application configuration.
 *
 * Values are sourced from environment variables where available and otherwise
 * fall back to sensible defaults so the take-home can be run quickly.
 *
 * @type {{port: number, jwtSecret: string, dbFile: string}}
 */
module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  dbFile: process.env.DB_FILE || path.join(__dirname, "..", "..", "data", "eagle-bank.sqlite"),
};
