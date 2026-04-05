"use strict";

const { getDb } = require("../db/connection");

/**
 * Inserts a new account row into the database.
 *
 * @param {{id: string, userId: string, name: string, accountType: string, balancePence: number, createdAt: string, updatedAt: string}} account - Account values to persist.
 * @returns {Promise<Object|undefined>}
 */
async function createAccount(account) {
  const db = await getDb();
  await db.run(
    `INSERT INTO accounts (id, user_id, name, account_type, balance_pence, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [account.id, account.userId, account.name, account.accountType, account.balancePence, account.createdAt, account.updatedAt]
  );
  return findAccountById(account.id);
}

/**
 * Returns all accounts owned by a given user.
 *
 * @param {string} userId - Owning user ID.
 * @returns {Promise<Array<Object>>}
 */
async function listAccountsForUser(userId) {
  const db = await getDb();
  return db.all(`SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC`, [userId]);
}

/**
 * Fetches a single account by its primary key.
 *
 * @param {string} accountId - Account ID.
 * @returns {Promise<Object|undefined>}
 */
async function findAccountById(accountId) {
  const db = await getDb();
  return db.get(`SELECT * FROM accounts WHERE id = ?`, [accountId]);
}

/**
 * Updates mutable account fields.
 *
 * @param {string} accountId - Account ID to update.
 * @param {{name: string, accountType: string, updatedAt: string}} fields - New persisted values.
 * @returns {Promise<Object|undefined>}
 */
async function updateAccount(accountId, fields) {
  const db = await getDb();
  await db.run(
    `UPDATE accounts SET name = ?, account_type = ?, updated_at = ? WHERE id = ?`,
    [fields.name, fields.accountType, fields.updatedAt, accountId]
  );
  return findAccountById(accountId);
}

/**
 * Deletes an account row by ID.
 *
 * @param {string} accountId - Account ID to delete.
 * @returns {Promise<void>}
 */
async function deleteAccount(accountId) {
  const db = await getDb();
  await db.run(`DELETE FROM accounts WHERE id = ?`, [accountId]);
}

module.exports = {
  createAccount,
  listAccountsForUser,
  findAccountById,
  updateAccount,
  deleteAccount,
};
