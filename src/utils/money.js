"use strict";

const { AppError } = require("./errors");

/**
 * Converts a decimal money input into integer pence.
 *
 * The API accepts either a string like `"12.34"` or a number like `12.34`,
 * then stores the value as integer pence to avoid floating-point rounding issues.
 *
 * @param {(string|number)} value - Input amount to parse.
 * @returns {number}
 */
function parseAmountToPence(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError(400, "Amount must be supplied as a string or number");
  }

  const stringValue = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(stringValue)) {
    throw new AppError(400, "Amount must be a positive decimal with up to 2 dp");
  }

  const parts = stringValue.split(".");
  const whole = parts[0];
  const fractional = parts[1] || "";
  const pence = Number(whole) * 100 + Number((fractional + "00").slice(0, 2));

  if (pence <= 0) {
    throw new AppError(400, "Amount must be greater than zero");
  }

  return pence;
}

/**
 * Converts integer pence into a fixed 2 decimal place string.
 *
 * @param {number} pence - Integer pence stored in the database.
 * @returns {string}
 */
function penceToAmount(pence) {
  return (Number(pence) / 100).toFixed(2);
}

module.exports = { parseAmountToPence, penceToAmount };
