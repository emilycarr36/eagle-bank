"use strict";

const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/connection");

/**
 * Creates a deposit or withdrawal and updates the account balance inside a
 * single SQLite transaction so the account and transaction stay in sync.
 *
 * @param {{accountId: string, transactionType: string, amountPence: number, description: (string|undefined)}} input - Transaction input values.
 * @returns {Promise<{account: Object, transaction: Object}>}
 */
async function createTransactionAndUpdateBalance(input) {
  const db = await getDb();

  await db.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    const account = await db.get(`SELECT * FROM accounts WHERE id = ?`, [input.accountId]);
    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    const nextBalance =
      input.transactionType === "deposit"
        ? account.balance_pence + input.amountPence
        : account.balance_pence - input.amountPence;

    if (nextBalance < 0) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const now = new Date().toISOString();
    const transactionId = uuidv4();

    await db.run(
      `INSERT INTO transactions (id, account_id, type, amount_pence, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [transactionId, input.accountId, input.transactionType, input.amountPence, input.description || null, now]
    );

    await db.run(`UPDATE accounts SET balance_pence = ?, updated_at = ? WHERE id = ?`, [nextBalance, now, input.accountId]);

    await db.exec("COMMIT");

    const updatedAccount = await db.get(`SELECT * FROM accounts WHERE id = ?`, [input.accountId]);
    const transaction = await db.get(`SELECT * FROM transactions WHERE id = ?`, [transactionId]);
    return { account: updatedAccount, transaction: transaction };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

/**
 * Returns all transactions for a given account, newest first.
 *
 * @param {string} accountId - Account ID.
 * @returns {Promise<Array<Object>>}
 */
async function listTransactionsForAccount(accountId) {
  const db = await getDb();
  return db.all(`SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC`, [accountId]);
}

/**
 * Fetches a transaction by its primary key.
 *
 * @param {string} transactionId - Transaction ID.
 * @returns {Promise<Object|undefined>}
 */
async function findTransactionById(transactionId) {
  const db = await getDb();
  return db.get(`SELECT * FROM transactions WHERE id = ?`, [transactionId]);
}

module.exports = {
  createTransactionAndUpdateBalance,
  listTransactionsForAccount,
  findTransactionById,
};
