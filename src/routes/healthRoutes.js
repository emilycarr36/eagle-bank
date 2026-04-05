"use strict";

const express = require("express");

const router = express.Router();

/**
 * Exposes a lightweight health endpoint for quick runtime checks.
 *
 * @param {import("express").Request} _req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @returns {void}
 */
router.get("/health", function healthRoute(_req, res) {
  res.json({ status: "ok" });
});

module.exports = router;
