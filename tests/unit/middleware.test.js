"use strict";

jest.mock("jsonwebtoken", function() {
  return {
    verify: jest.fn(),
  };
});

const jwt = require("jsonwebtoken");
const { authenticate } = require("../../src/middleware/authenticate");
const { notFoundHandler, errorHandler } = require("../../src/middleware/errorHandler");
const { AppError } = require("../../src/utils/errors");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("authenticate middleware", function() {
  beforeEach(function() {
    jwt.verify.mockReset();
  });

  test("rejects missing bearer token", function() {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("attaches user and calls next for a valid token", function() {
    jwt.verify.mockReturnValue({ sub: "u1", email: "a@example.com" });
    const req = { headers: { authorization: "Bearer token123" } };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual({ id: "u1", email: "a@example.com" });
    expect(next).toHaveBeenCalled();
  });

  test("rejects invalid token", function() {
    jwt.verify.mockImplementation(function() { throw new Error("bad token"); });
    const req = { headers: { authorization: "Bearer bad" } };
    const res = createResponse();

    authenticate(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("error middleware", function() {
  test("notFoundHandler returns 404 json", function() {
    const res = createResponse();
    notFoundHandler({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
  });

  test("errorHandler returns AppError status and message", function() {
    const res = createResponse();
    errorHandler(new AppError(400, "bad request"), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "bad request" });
  });

  test("errorHandler falls back to 500", function() {
    const spy = jest.spyOn(console, "error").mockImplementation(function() {});
    const res = createResponse();
    errorHandler(new Error("boom"), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    spy.mockRestore();
  });
});
