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
    throw new AppError(400, "fromAccountId is required");
  }

  if (!params.toAccountId) {
    throw new AppError(400, "toAccountId is required");
  }

  if (params.fromAccountId === params.toAccountId) {
    throw new AppError(400, "Cannot transfer money to the same account");
  }

  const amountPence = parseAmountToPence(params.amount);

  if (amountPence <= 0) {
    throw new AppError(400, "Amount must be greater than zero");
  }

  const fromAccount = await accountRepository.findAccountById(params.fromAccountId);

  if (!fromAccount) {
    throw new AppError(404, "Source account not found");
  }

  if (fromAccount.user_id !== params.authenticatedUserId) {
    throw new AppError(403,"You do not have access to the source account");
  }

  const toAccount = await accountRepository.findAccountById(params.toAccountId);

  if (!toAccount) {
    throw new AppError(404, "Target account not found");
  }

  if (fromAccount.balance_pence < amountPence) {
    throw new AppError(422, "Insufficient funds");
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