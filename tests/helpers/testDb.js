"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Creates a unique temporary SQLite file path for a test run.
 *
 * @returns {string}
 */
function createTempDbFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "eagle-bank-test-"));
  return path.join(dir, "test.sqlite");
}

/**
 * Prepares fresh module instances wired to a temporary database.
 *
 * @returns {Promise<{dbFile: string, modules: Object, cleanup: Function}>}
 */
async function setupFreshDatabaseModules() {
  const dbFile = createTempDbFile();
  process.env.DB_FILE = dbFile;
  jest.resetModules();

  const connection = require("../../src/db/connection");
  const schema = require("../../src/db/schema");

  await schema.ensureSchema();

  return {
    dbFile: dbFile,
    modules: {
      connection: connection,
      schema: schema,
      userRepository: require("../../src/repositories/userRepository"),
      accountRepository: require("../../src/repositories/accountRepository"),
      transactionRepository: require("../../src/repositories/transactionRepository"),
      userService: require("../../src/services/userService"),
      authService: require("../../src/services/authService"),
      accountService: require("../../src/services/accountService"),
      transactionService: require("../../src/services/transactionService"),
      appModule: require("../../src/app"),
    },
    cleanup: async function cleanup() {
      const db = await connection.getDb();
      await db.close();
      delete process.env.DB_FILE;
    },
  };
}

module.exports = { setupFreshDatabaseModules };
