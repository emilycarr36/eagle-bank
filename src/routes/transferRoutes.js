const express = require("express");
const transferService = require("../services/transferService");

const router = express.Router();

/**
 * Transfer money from one account to another.
 *
 * HTTP layer responsibility:
 * - read route/body/user data
 * - call the service layer
 * - return the correct HTTP response
 *
 * Business rules are intentionally kept out of this file.
 */
router.post("/v1/transfers", async function createTransfer(req, res, next) {
  try {
    const transfer = await transferService.transferMoney({
      authenticatedUserId: req.user.userId,
      fromAccountId: req.body.fromAccountId,
      toAccountId: req.body.toAccountId,
      amount: req.body.amount
    });

    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;