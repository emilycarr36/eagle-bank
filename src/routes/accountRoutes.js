"use strict";

const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const accountService = require("../services/accountService");
const transactionService = require("../services/transactionService");

const router = express.Router();

/**
 * Creates a new bank account for the authenticated user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.post("/v1/accounts", authenticate, async function createAccountRoute(req, res, next) {
  try {
    const account = await accountService.createAccount(req.user.id, req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

/**
 * Lists all bank accounts owned by the authenticated user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.get("/v1/accounts", authenticate, async function listAccountsRoute(req, res, next) {
  try {
    const accounts = await accountService.listAccounts(req.user.id);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

/**
 * Fetches a single bank account if it belongs to the authenticated user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.get("/v1/accounts/:accountId", authenticate, async function getAccountRoute(req, res, next) {
  try {
    const account = await accountService.getAccount(req.params.accountId, req.user.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
});

/**
 * Updates a bank account owned by the authenticated user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.patch("/v1/accounts/:accountId", authenticate, async function updateAccountRoute(req, res, next) {
  try {
    const account = await accountService.updateAccount(req.params.accountId, req.user.id, req.body);
    res.json(account);
  } catch (error) {
    next(error);
  }
});

/**
 * Deletes a bank account owned by the authenticated user.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.delete("/v1/accounts/:accountId", authenticate, async function deleteAccountRoute(req, res, next) {
  try {
    await accountService.deleteAccount(req.params.accountId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * Creates a deposit or withdrawal on an owned bank account.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.post("/v1/accounts/:accountId/transactions", authenticate, async function createTransactionRoute(req, res, next) {
  try {
    const result = await transactionService.createTransaction(req.params.accountId, req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Lists all transactions on an owned bank account.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.get("/v1/accounts/:accountId/transactions", authenticate, async function listTransactionsRoute(req, res, next) {
  try {
    const transactions = await transactionService.listTransactions(req.params.accountId, req.user.id);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

/**
 * Fetches a single transaction if it belongs to the given owned account.
 *
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
router.get("/v1/accounts/:accountId/transactions/:transactionId", authenticate, async function getTransactionRoute(req, res, next) {
  try {
    const transaction = await transactionService.getTransaction(req.params.accountId, req.params.transactionId, req.user.id);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
