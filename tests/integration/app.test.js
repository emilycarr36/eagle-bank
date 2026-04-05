"use strict";

const request = require("supertest");
const { setupFreshDatabaseModules } = require("../helpers/testDb");

describe("app integration", function() {
  let ctx;
  let app;

  beforeEach(async function() {
    process.env.JWT_SECRET = "test-secret";
    ctx = await setupFreshDatabaseModules();
    app = ctx.modules.appModule.app;
  });

  afterEach(async function() {
    delete process.env.JWT_SECRET;
    if (ctx) {
      await ctx.cleanup();
      ctx = null;
    }
  });

  test("serves health, openapi and 404", async function() {
    await request(app).get("/health").expect(200, { status: "ok" });
    const openapi = await request(app).get("/openapi.yaml").expect(200);
    expect(openapi.text).toMatch(/openapi:/);
    await request(app).get("/does-not-exist").expect(404);
  });

  test("supports core authenticated banking flow", async function() {
    const createUser = await request(app)
      .post("/v1/users")
      .send({ email: "alex@example.com", password: "Password123!", fullName: "Alex Example" })
      .expect(201);

    const userId = createUser.body.id;

    const login = await request(app)
      .post("/v1/auth/login")
      .send({ email: "alex@example.com", password: "Password123!" })
      .expect(200);

    const token = login.body.accessToken;
    const authHeader = { Authorization: "Bearer " + token };

    await request(app).get("/v1/users/" + userId).set(authHeader).expect(200);
    await request(app).patch("/v1/users/" + userId).set(authHeader).send({ fullName: "Alex Updated" }).expect(200);

    const accountResponse = await request(app)
      .post("/v1/accounts")
      .set(authHeader)
      .send({ name: "Daily", accountType: "current" })
      .expect(201);

    const accountId = accountResponse.body.id;

    await request(app).get("/v1/accounts").set(authHeader).expect(200);
    await request(app).get("/v1/accounts/" + accountId).set(authHeader).expect(200);
    await request(app).patch("/v1/accounts/" + accountId).set(authHeader).send({ name: "Daily Updated", accountType: "savings" }).expect(200);

    const deposit = await request(app)
      .post("/v1/accounts/" + accountId + "/transactions")
      .set(authHeader)
      .send({ type: "deposit", amount: "25.00", description: "initial deposit" })
      .expect(201);

    expect(deposit.body.account.balance).toBe("25.00");
    const transactionId = deposit.body.transaction.id;

    await request(app).get("/v1/accounts/" + accountId + "/transactions").set(authHeader).expect(200);
    await request(app).get("/v1/accounts/" + accountId + "/transactions/" + transactionId).set(authHeader).expect(200);
    await request(app)
      .post("/v1/accounts/" + accountId + "/transactions")
      .set(authHeader)
      .send({ type: "withdrawal", amount: "100.00", description: "too much" })
      .expect(422);

    await request(app).delete("/v1/accounts/" + accountId).set(authHeader).expect(204);
    await request(app).delete("/v1/users/" + userId).set(authHeader).expect(204);
  });
});
