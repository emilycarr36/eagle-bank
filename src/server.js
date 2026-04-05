"use strict";

const config = require("./config");
const { ensureSchema } = require("./db/schema");
const { app } = require("./app");

/**
 * Bootstraps the database schema and starts the HTTP server.
 *
 * @returns {Promise<void>}
 */
async function start() {
  await ensureSchema();

  app.listen(config.port, function handleListen() {
    console.log("Eagle Bank Node API listening on http://localhost:" + config.port);
    console.log("Swagger UI available at http://localhost:" + config.port + "/docs");
  });
}

start().catch(function handleStartError(error) {
  console.error("Failed to start server", error);
  process.exit(1);
});
