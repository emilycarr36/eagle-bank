"use strict";

const { getDb } = require("../db/connection");

/**
 * Inserts a new user into the database.
 *
 * @param {{id: string, email: string, passwordHash: string, fullName: string, createdAt: string, updatedAt: string}} user - User values to persist.
 * @returns {Promise<Object|undefined>}
 */
async function createUser(user) {
  const db = await getDb();
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, user.passwordHash, user.fullName, user.createdAt, user.updatedAt]
  );
  return findUserById(user.id);
}

/**
 * Looks up a user by email address.
 *
 * @param {string} email - Email address.
 * @returns {Promise<Object|undefined>}
 */
async function findUserByEmail(email) {
  const db = await getDb();
  return db.get(`SELECT * FROM users WHERE email = ?`, [email]);
}

/**
 * Fetches a user by primary key.
 *
 * @param {string} id - User ID.
 * @returns {Promise<Object|undefined>}
 */
async function findUserById(id) {
  const db = await getDb();
  return db.get(`SELECT * FROM users WHERE id = ?`, [id]);
}

/**
 * Updates mutable user fields.
 *
 * @param {string} id - User ID to update.
 * @param {{fullName: string, updatedAt: string}} fields - Updated field values.
 * @returns {Promise<Object|undefined>}
 */
async function updateUser(id, fields) {
  const db = await getDb();
  await db.run(`UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?`, [fields.fullName, fields.updatedAt, id]);
  return findUserById(id);
}

/**
 * Deletes a user row by ID.
 *
 * @param {string} id - User ID.
 * @returns {Promise<void>}
 */
async function deleteUser(id) {
  const db = await getDb();
  await db.run(`DELETE FROM users WHERE id = ?`, [id]);
}

/**
 * Counts how many bank accounts belong to a user.
 *
 * @param {string} userId - User ID.
 * @returns {Promise<number>}
 */
async function countAccountsForUser(userId) {
  const db = await getDb();
  const row = await db.get(`SELECT COUNT(*) AS count FROM accounts WHERE user_id = ?`, [userId]);
  return row.count;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
  countAccountsForUser,
};
