"use strict";

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const config = require("../config");

let dbPromise;

/**
 * Creates a SQLite connection and wraps the callback-based driver in a small
 * promise-based API used by the rest of the codebase.
 *
 * @param {string} filename - Absolute or relative path to the SQLite database file.
 * @returns {Promise<{exec: Function, get: Function, all: Function, run: Function, close: Function}>}
 */
function createDatabase(filename) {
  return new Promise(function(resolve, reject) {
    const rawDb = new sqlite3.Database(filename, function(error) {
      if (error) {
        return reject(error);
      }

      return rawDb.run("PRAGMA foreign_keys = ON;", function(pragmaError) {
        if (pragmaError) {
          return reject(pragmaError);
        }

        return resolve({
          /**
           * Executes one or more SQL statements that do not need bound parameters.
           *
           * @param {string} sql - SQL statement(s) to execute.
           * @returns {Promise<void>}
           */
          exec: function exec(sql) {
            return new Promise(function(execResolve, execReject) {
              rawDb.exec(sql, function(error) {
                if (error) {
                  return execReject(error);
                }
                return execResolve();
              });
            });
          },

          /**
           * Fetches a single row from the database.
           *
           * @param {string} sql - SQL query to execute.
           * @param {Array<*>} params - Positional parameters for the query.
           * @returns {Promise<Object|undefined>}
           */
          get: function get(sql, params) {
            return new Promise(function(getResolve, getReject) {
              rawDb.get(sql, params || [], function(error, row) {
                if (error) {
                  return getReject(error);
                }
                return getResolve(row);
              });
            });
          },

          /**
           * Fetches all rows returned by a query.
           *
           * @param {string} sql - SQL query to execute.
           * @param {Array<*>} params - Positional parameters for the query.
           * @returns {Promise<Array<Object>>}
           */
          all: function all(sql, params) {
            return new Promise(function(allResolve, allReject) {
              rawDb.all(sql, params || [], function(error, rows) {
                if (error) {
                  return allReject(error);
                }
                return allResolve(rows);
              });
            });
          },

          /**
           * Runs a parameterised write statement and exposes SQLite metadata.
           *
           * @param {string} sql - SQL statement to execute.
           * @param {Array<*>} params - Positional parameters for the statement.
           * @returns {Promise<{lastID: number, changes: number}>}
           */
          run: function run(sql, params) {
            return new Promise(function(runResolve, runReject) {
              rawDb.run(sql, params || [], function(error) {
                if (error) {
                  return runReject(error);
                }
                return runResolve({ lastID: this.lastID, changes: this.changes });
              });
            });
          },

          /**
           * Closes the underlying SQLite connection.
           *
           * @returns {Promise<void>}
           */
          close: function close() {
            return new Promise(function(closeResolve, closeReject) {
              rawDb.close(function(error) {
                if (error) {
                  return closeReject(error);
                }
                return closeResolve();
              });
            });
          },
        });
      });
    });
  });
}

/**
 * Returns a shared database connection for the process, creating the database
 * file and parent directory on first access.
 *
 * @returns {Promise<{exec: Function, get: Function, all: Function, run: Function, close: Function}>}
 */
async function getDb() {
  if (!dbPromise) {
    fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
    dbPromise = createDatabase(config.dbFile);
  }

  return dbPromise;
}

module.exports = { getDb };
