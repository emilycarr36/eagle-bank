"use strict";

const { parseAmountToPence, penceToAmount } = require("../../src/utils/money");
const { AppError } = require("../../src/utils/errors");

describe("money utils", function() {
  test("parseAmountToPence converts valid decimal strings", function() {
    expect(parseAmountToPence("12.34")).toBe(1234);
    expect(parseAmountToPence("12")).toBe(1200);
    expect(parseAmountToPence(0.5)).toBe(50);
  });

  test("parseAmountToPence rejects invalid values", function() {
    expect(function() { parseAmountToPence(); }).toThrow(AppError);
    expect(function() { parseAmountToPence("-1"); }).toThrow("positive decimal");
    expect(function() { parseAmountToPence("12.345"); }).toThrow("up to 2 dp");
    expect(function() { parseAmountToPence("0.00"); }).toThrow("greater than zero");
  });

  test("penceToAmount formats pence", function() {
    expect(penceToAmount(1234)).toBe("12.34");
    expect(penceToAmount(0)).toBe("0.00");
  });
});
