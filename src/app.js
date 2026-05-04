"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const accountRoutes = require("./routes/accountRoutes");
const transferRoutes = require("./routes/transferRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Express handles JSON parsing, while route modules stay focused on HTTP intent.
app.use(express.json());

const openApiPath = path.join(__dirname, "..", "openapi.yaml");
const openApiDocument = yaml.load(fs.readFileSync(openApiPath, "utf8"));

/**
 * Serves the raw OpenAPI document so it can be downloaded or inspected directly.
 *
 * @param {import("express").Request} _req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @returns {void}
 */
app.get("/openapi.yaml", function serveOpenApiDocument(_req, res) {
  res.type("application/yaml").send(fs.readFileSync(openApiPath, "utf8"));
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  swaggerOptions: { persistAuthorization: true },
}));

app.use(healthRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(accountRoutes);
app.use(transferRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
