"use strict";

const { serializeUser, serializeAccount, serializeTransaction } = require("../../src/utils/serializers");

describe("serializers", function() {
  test("serializeUser maps database fields", function() {
    expect(serializeUser({
      id: "u1",
      email: "a@example.com",
      full_name: "Alex Example",
      created_at: "c",
      updated_at: "u",
    })).toEqual({
      id: "u1",
      email: "a@example.com",
      fullName: "Alex Example",
      createdAt: "c",
      updatedAt: "u",
    });
  });

  test("serializeAccount maps database fields and converts money", function() {
    expect(serializeAccount({
      id: "a1",
      user_id: "u1",
      name: "Main",
      account_type: "current",
      balance_pence: 1234,
      created_at: "c",
      updated_at: "u",
    })).toEqual({
      id: "a1",
      userId: "u1",
      name: "Main",
      accountType: "current",
      balance: "12.34",
      createdAt: "c",
      updatedAt: "u",
    });
  });

  test("serializeTransaction maps database fields and converts money", function() {
    expect(serializeTransaction({
      id: "t1",
      account_id: "a1",
      type: "deposit",
      amount_pence: 2500,
      description: "seed",
      created_at: "c",
    })).toEqual({
      id: "t1",
      accountId: "a1",
      type: "deposit",
      amount: "25.00",
      description: "seed",
      createdAt: "c",
    });
  });
});
