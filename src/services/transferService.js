const { v4: uuidv4 } = require("uuid");
const accountRepository = require("../repositories/accountRepository");
const transferRepository = require("../repositories/transferRepository");
const { AppError } = require("../utils/errors");
const { parseAmountToPence, penceToAmount } = require("../utils/money");

/**
 * Transfer money between two bank accounts.
 *
 * Business layer responsibility:
 * - validate input
 * - check accounts exist
 * - enforce ownership of the source account
 * - check sufficient funds
 * - orchestrate balance updates and transaction creation
 *
 * In production, this operation must be atomic because money is moving.
 * The repository wraps the database writes in a transaction so either
 * all changes succeed, or none are committed.
 *
 * @param {Object} params
 * @param {string} params.authenticatedUserId - User ID from the JWT.
 * @param {string} params.fromAccountId - Account sending money.
 * @param {string} params.toAccountId - Account receiving money.
 * @param {string|number} params.amount - Amount in pounds, e.g. "25.50".
 * @returns {Promise<Object>} Transfer response.
 */
async function transferMoney(params) {
  if (!params.fromAccountId) {
    throw new AppError("fromAccountId is required", 400);
  }

  if (!params.toAccountId) {
    throw new AppError("toAccountId is required", 400);
  }

  if (params.fromAccountId === params.toAccountId) {
    throw new AppError("Cannot transfer money to the same account", 400);
  }

  const amountPence = parseAmountToPence(params.amount);

  if (amountPence <= 0) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  const fromAccount = await accountRepository.findAccountById(params.fromAccountId);

  if (!fromAccount) {
    throw new AppError("Source account not found", 404);
  }

  if (fromAccount.user_id !== params.authenticatedUserId) {
    throw new AppError("You do not have access to the source account", 403);
  }

  const toAccount = await accountRepository.findAccountById(params.toAccountId);

  if (!toAccount) {
    throw new AppError("Target account not found", 404);
  }

  if (fromAccount.balance_pence < amountPence) {
    throw new AppError("Insufficient funds", 422);
  }

  const transferId = uuidv4();
  const withdrawalTransactionId = uuidv4();
  const depositTransactionId = uuidv4();

  const result = await transferRepository.createTransfer({
    transferId,
    withdrawalTransactionId,
    depositTransactionId,
    fromAccount,
    toAccount,
    amountPence
  });

  return {
    transferId: result.transferId,
    fromAccountId: params.fromAccountId,
    toAccountId: params.toAccountId,
    amount: penceToAmount(amountPence),
    amountPence,
    transactions: {
      withdrawalTransactionId,
      depositTransactionId
    }
  };
}

module.exports = {
  transferMoney
};