"use strict";

const { ensureSchema } = require("./schema");

/**
 * Initialises the SQLite schema for local development or first-time setup.
 *
 * @returns {Promise<void>}
 */
ensureSchema()
  .then(function handleSchemaReady() {
    console.log("Database schema is ready.");
  })
  .catch(function handleSchemaError(error) {
    console.error("Failed to initialize database.", error);
    process.exitCode = 1;
  });
