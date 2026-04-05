"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const userRepository = require("../repositories/userRepository");
const { AppError } = require("../utils/errors");

/**
 * Authenticates a user with email and password and returns a signed access token.
 *
 * @param {string} email - Login email address.
 * @param {string} password - Plain text password submitted by the client.
 * @returns {Promise<{accessToken: string}>}
 */
async function login(email, password) {
  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const user = await userRepository.findUserByEmail(String(email).toLowerCase());
  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new AppError(401, "Invalid credentials");
  }

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "1h",
  });

  return { accessToken: accessToken };
}

module.exports = { login };
