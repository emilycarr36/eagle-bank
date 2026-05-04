const { getDb } = require("../db/connection");

/**
 * Create a transfer between two accounts.
 *
 * Data layer responsibility:
 * - perform SQL writes
 * - keep the operation atomic using a database transaction
 *
 * This function:
 * - debits the source account
 * - credits the target account
 * - creates a withdrawal transaction
 * - creates a deposit transaction
 *
 * @param {Object} params
 * @param {string} params.transferId - UUID for the transfer operation.
 * @param {string} params.withdrawalTransactionId - UUID for withdrawal transaction.
 * @param {string} params.depositTransactionId - UUID for deposit transaction.
 * @param {Object} params.fromAccount - Source account row.
 * @param {Object} params.toAccount - Target account row.
 * @param {number} params.amountPence - Amount in pence.
 * @returns {Promise<Object>} Created transfer summary.
 */
async function createTransfer(params) {
  const db = await getDb();
  const now = new Date().toISOString();

  const fromBalanceAfter = params.fromAccount.balance_pence - params.amountPence;
  const toBalanceAfter = params.toAccount.balance_pence + params.amountPence;

  await db.run("BEGIN TRANSACTION");

  try {
    await db.run(
      `
      UPDATE accounts
      SET balance_pence = ?, updated_at = ?
      WHERE id = ?
      `,
      [fromBalanceAfter, now, params.fromAccount.id]
    );

    await db.run(
      `
      UPDATE accounts
      SET balance_pence = ?, updated_at = ?
      WHERE id = ?
      `,
      [toBalanceAfter, now, params.toAccount.id]
    );

    await db.run(
      `
      INSERT INTO transactions (
        id,
        account_id,
        type,
        amount_pence,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        params.withdrawalTransactionId,
        params.fromAccount.id,
        "withdrawal",
        params.amountPence,
        now
      ]
    );

    await db.run(
      `
      INSERT INTO transactions (
        id,
        account_id,
        type,
        amount_pence,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        params.depositTransactionId,
        params.toAccount.id,
        "deposit",
        params.amountPence,
        now
      ]
    );

    await db.run("COMMIT");

    return {
      transferId: params.transferId,
      fromAccountId: params.fromAccount.id,
      toAccountId: params.toAccount.id,
      amountPence: params.amountPence,
      fromBalanceAfter,
      toBalanceAfter
    };
  } catch (err) {
    await db.run("ROLLBACK");
    throw err;
  }
}

module.exports = {
  createTransfer
};