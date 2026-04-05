"use strict";

const accountService = require("./accountService");
const transactionRepository = require("../repositories/transactionRepository");
const { AppError } = require("../utils/errors");
const { parseAmountToPence } = require("../utils/money");
const { serializeAccount, serializeTransaction } = require("../utils/serializers");

/**
 * Creates a deposit or withdrawal on an owned account.
 *
 * @param {string} accountId - Account receiving the transaction.
 * @param {string} userId - Authenticated user ID.
 * @param {{type?: string, amount?: (string|number), description?: string}} payload - Incoming transaction payload.
 * @returns {Promise<{account: Object, transaction: Object}>}
 */
async function createTransaction(accountId, userId, payload) {
  await accountService.getOwnedAccount(accountId, userId);

  const type = String(payload.type || "").trim();
  if (["deposit", "withdrawal"].indexOf(type) === -1) {
    throw new AppError(400, "type must be deposit or withdrawal");
  }

  const amountPence = parseAmountToPence(payload.amount);

  try {
    const result = await transactionRepository.createTransactionAndUpdateBalance({
      accountId: accountId,
      transactionType: type,
      amountPence: amountPence,
      description: payload.description,
    });

    return {
      account: serializeAccount(result.account),
      transaction: serializeTransaction(result.transaction),
    };
  } catch (error) {
    if (error.message === "INSUFFICIENT_FUNDS") {
      throw new AppError(422, "Insufficient funds");
    }
    if (error.message === "ACCOUNT_NOT_FOUND") {
      throw new AppError(404, "Account not found");
    }
    throw error;
  }
}

/**
 * Lists all transactions for an owned account.
 *
 * @param {string} accountId - Account ID.
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<Array<Object>>}
 */
async function listTransactions(accountId, userId) {
  await accountService.getOwnedAccount(accountId, userId);
  const rows = await transactionRepository.listTransactionsForAccount(accountId);
  return rows.map(serializeTransaction);
}

/**
 * Fetches a single transaction from an owned account.
 *
 * @param {string} accountId - Account ID.
 * @param {string} transactionId - Transaction ID.
 * @param {string} userId - Authenticated user ID.
 * @returns {Promise<Object>}
 */
async function getTransaction(accountId, transactionId, userId) {
  await accountService.getOwnedAccount(accountId, userId);

  const transaction = await transactionRepository.findTransactionById(transactionId);
  if (!transaction || transaction.account_id !== accountId) {
    throw new AppError(404, "Transaction not found");
  }

  return serializeTransaction(transaction);
}

module.exports = { createTransaction, listTransactions, getTransaction };
