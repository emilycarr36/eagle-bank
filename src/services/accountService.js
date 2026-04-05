"use strict";

const { v4: uuidv4 } = require("uuid");
const accountRepository = require("../repositories/accountRepository");
const { AppError } = require("../utils/errors");
const { serializeAccount } = require("../utils/serializers");

/**
 * Creates a new bank account for a user.
 *
 * @param {string} userId - Authenticated user ID.
 * @param {{name?: string, accountType?: string}} payload - Incoming account payload.
 * @returns {Promise<Object>}
 */
async function createAccount(userId, payload) {
  const name = String(payload.name || "").trim();
  const accountType = String(payload.accountType || "").trim();

  if (!name || !accountType) {
    throw new AppError(400, "name and accountType are required");
  }

  const now = new Date().toISOString();
  const account = await accountRepository.createAccount({
    id: uuidv4(),
    userId: userId,
    name: name,
    accountType: accountType,
    balancePence: 0,
    createdAt: now,
    updatedAt: now,
  });

  return serializeAccount(account);
}

/**
 * Lists all accounts owned by a user.
 *
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<Array<Object>>}
 */
async function listAccounts(userId) {
  const rows = await accountRepository.listAccountsForUser(userId);
  return rows.map(serializeAccount);
}

/**
 * Fetches an account and verifies that it belongs to the authenticated user.
 *
 * @param {string} accountId - Account ID being accessed.
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<Object>}
 */
async function getOwnedAccount(accountId, userId) {
  const account = await accountRepository.findAccountById(accountId);
  if (!account) {
    throw new AppError(404, "Account not found");
  }
  if (account.user_id !== userId) {
    throw new AppError(403, "You may only access your own accounts");
  }
  return account;
}

/**
 * Returns a serialised account DTO for an owned account.
 *
 * @param {string} accountId - Account ID being accessed.
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<Object>}
 */
async function getAccount(accountId, userId) {
  return serializeAccount(await getOwnedAccount(accountId, userId));
}

/**
 * Updates mutable account fields for an owned account.
 *
 * @param {string} accountId - Account ID being updated.
 * @param {string} userId - Authenticated user ID.
 * @param {{name?: string, accountType?: string}} payload - Incoming account patch payload.
 * @returns {Promise<Object>}
 */
async function updateAccount(accountId, userId, payload) {
  const account = await getOwnedAccount(accountId, userId);
  const name = String(payload.name || "").trim() || account.name;
  const accountType = String(payload.accountType || "").trim() || account.account_type;

  const updated = await accountRepository.updateAccount(accountId, {
    name: name,
    accountType: accountType,
    updatedAt: new Date().toISOString(),
  });

  return serializeAccount(updated);
}

/**
 * Deletes an owned bank account.
 *
 * @param {string} accountId - Account ID being deleted.
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<void>}
 */
async function deleteAccount(accountId, userId) {
  await getOwnedAccount(accountId, userId);
  await accountRepository.deleteAccount(accountId);
}

module.exports = { createAccount, listAccounts, getAccount, getOwnedAccount, updateAccount, deleteAccount };
