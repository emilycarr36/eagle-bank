"use strict";

const { penceToAmount } = require("./money");

/**
 * Converts a raw user database row into the public API response shape.
 *
 * @param {Object} row - Raw SQLite user row.
 * @returns {{id: string, email: string, fullName: string, createdAt: string, updatedAt: string}}
 */
function serializeUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts a raw account database row into the public API response shape.
 *
 * @param {Object} row - Raw SQLite account row.
 * @returns {{id: string, userId: string, name: string, accountType: string, balance: string, createdAt: string, updatedAt: string}}
 */
function serializeAccount(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    accountType: row.account_type,
    balance: penceToAmount(row.balance_pence),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts a raw transaction database row into the public API response shape.
 *
 * @param {Object} row - Raw SQLite transaction row.
 * @returns {{id: string, accountId: string, type: string, amount: string, description: (string|null), createdAt: string}}
 */
function serializeTransaction(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type,
    amount: penceToAmount(row.amount_pence),
    description: row.description,
    createdAt: row.created_at,
  };
}

module.exports = { serializeUser, serializeAccount, serializeTransaction };
