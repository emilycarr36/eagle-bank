"use strict";

const express = require("express");
const authService = require("../services/authService");

const router = express.Router();

/**
 * Authenticates a user and returns a signed JWT bearer token.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.post("/v1/auth/login", async function loginRoute(req, res, next) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
