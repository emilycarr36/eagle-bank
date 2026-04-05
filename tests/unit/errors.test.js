"use strict";

const { AppError } = require("../../src/utils/errors");

describe("AppError", function() {
  test("stores status and message", function() {
    const error = new AppError(418, "teapot");
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(418);
    expect(error.message).toBe("teapot");
  });
});
