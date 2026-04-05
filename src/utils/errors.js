"use strict";

/**
 * Error type used for expected API failures where an explicit HTTP status code
 * should be returned to the client.
 */
class AppError extends Error {
  /**
   * Creates an application error.
   *
   * @param {number} status - HTTP status code to return.
   * @param {string} message - Human-readable error message.
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { AppError };
