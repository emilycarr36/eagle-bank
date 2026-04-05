"use strict";

const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const userService = require("../services/userService");

const router = express.Router();

/**
 * Creates a new Eagle Bank user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.post("/v1/users", async function createUserRoute(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * Fetches the authenticated user's profile by ID.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.get("/v1/users/:userId", authenticate, async function getUserRoute(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.userId, req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * Updates the authenticated user's profile.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.patch("/v1/users/:userId", authenticate, async function updateUserRoute(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.userId, req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * Deletes the authenticated user's profile when they have no bank accounts.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.delete("/v1/users/:userId", authenticate, async function deleteUserRoute(req, res, next) {
  try {
    await userService.deleteUser(req.params.userId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
