"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const userRepository = require("../repositories/userRepository");
const { AppError } = require("../utils/errors");
const { serializeUser } = require("../utils/serializers");

/**
 * Creates a new user after validating the required fields and hashing the password.
 *
 * @param {{email?: string, password?: string, fullName?: string}} payload - Incoming user payload.
 * @returns {Promise<Object>}
 */
async function createUser(payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const fullName = String(payload.fullName || "").trim();

  if (!email || !password || !fullName) {
    throw new AppError(400, "email, password and fullName are required");
  }

  const existing = await userRepository.findUserByEmail(email);
  if (existing) {
    throw new AppError(409, "A user with that email already exists");
  }

  const now = new Date().toISOString();
  const user = await userRepository.createUser({
    id: uuidv4(),
    email: email,
    passwordHash: await bcrypt.hash(password, 10),
    fullName: fullName,
    createdAt: now,
    updatedAt: now,
  });

  return serializeUser(user);
}

/**
 * Returns the user's own profile and forbids access to any other user record.
 *
 * @param {string} requestedUserId - User ID supplied in the URL.
 * @param {string} authenticatedUserId - User ID from the bearer token.
 * @returns {Promise<Object>}
 */
async function getUserById(requestedUserId, authenticatedUserId) {
  if (requestedUserId !== authenticatedUserId) {
    throw new AppError(403, "You may only access your own user record");
  }

  const user = await userRepository.findUserById(requestedUserId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return serializeUser(user);
}

/**
 * Updates the authenticated user's own profile.
 *
 * @param {string} requestedUserId - User ID supplied in the URL.
 * @param {string} authenticatedUserId - User ID from the bearer token.
 * @param {{fullName?: string}} payload - Incoming profile patch payload.
 * @returns {Promise<Object>}
 */
async function updateUser(requestedUserId, authenticatedUserId, payload) {
  if (requestedUserId !== authenticatedUserId) {
    throw new AppError(403, "You may only update your own user record");
  }

  const user = await userRepository.findUserById(requestedUserId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const fullName = String(payload.fullName || "").trim();
  if (!fullName) {
    throw new AppError(400, "fullName is required");
  }

  const updated = await userRepository.updateUser(requestedUserId, {
    fullName: fullName,
    updatedAt: new Date().toISOString(),
  });

  return serializeUser(updated);
}

/**
 * Deletes the authenticated user's own profile if they do not still own bank accounts.
 *
 * @param {string} requestedUserId - User ID supplied in the URL.
 * @param {string} authenticatedUserId - User ID from the bearer token.
 * @returns {Promise<void>}
 */
async function deleteUser(requestedUserId, authenticatedUserId) {
  if (requestedUserId !== authenticatedUserId) {
    throw new AppError(403, "You may only delete your own user record");
  }

  const user = await userRepository.findUserById(requestedUserId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const accountCount = await userRepository.countAccountsForUser(requestedUserId);
  if (accountCount > 0) {
    throw new AppError(409, "User cannot be deleted while bank accounts still exist");
  }

  await userRepository.deleteUser(requestedUserId);
}

module.exports = { createUser, getUserById, updateUser, deleteUser };
