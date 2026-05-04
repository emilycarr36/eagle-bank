"use strict";

jest.mock("bcryptjs", function() {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  };
});

jest.mock("jsonwebtoken", function() {
  return {
    sign: jest.fn(),
  };
});

jest.mock("uuid", function() {
  return {
    v4: jest.fn(),
  };
});

jest.mock("../../src/repositories/userRepository", function() {
  return {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    countAccountsForUser: jest.fn(),
  };
});

jest.mock("../../src/repositories/accountRepository", function() {
  return {
    createAccount: jest.fn(),
    listAccountsForUser: jest.fn(),
    findAccountById: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  };
});

jest.mock("../../src/repositories/transactionRepository", function() {
  return {
    createTransactionAndUpdateBalance: jest.fn(),
    listTransactionsForAccount: jest.fn(),
    findTransactionById: jest.fn(),
  };
});

jest.mock("../../src/repositories/transferRepository", function() {
  return {
    createTransfer: jest.fn(),
  };
});

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const userRepository = require("../../src/repositories/userRepository");
const accountRepository = require("../../src/repositories/accountRepository");
const transactionRepository = require("../../src/repositories/transactionRepository");
const transferRepository = require("../../src/repositories/transferRepository");
const userService = require("../../src/services/userService");
const authService = require("../../src/services/authService");
const accountService = require("../../src/services/accountService");
const transactionService = require("../../src/services/transactionService");
const transferService = require("../../src/services/transferService")
const { AppError } = require("../../src/utils/errors");

describe("userService", function() {
  beforeEach(function() {
    jest.clearAllMocks();
  });

  test("createUser validates input", async function() {
    await expect(userService.createUser({})).rejects.toThrow("email, password and fullName are required");
  });

  test("createUser rejects duplicate email", async function() {
    userRepository.findUserByEmail.mockResolvedValue({ id: "existing" });
    await expect(userService.createUser({ email: "a@example.com", password: "pw", fullName: "Alex" })).rejects.toThrow("already exists");
  });

  test("createUser hashes password and serializes response", async function() {
    uuid.v4.mockReturnValue("user-1");
    bcrypt.hash.mockResolvedValue("hash");
    userRepository.findUserByEmail.mockResolvedValue(undefined);
    userRepository.createUser.mockResolvedValue({
      id: "user-1",
      email: "a@example.com",
      full_name: "Alex",
      created_at: "c",
      updated_at: "u",
    });

    const user = await userService.createUser({ email: "A@EXAMPLE.COM", password: "pw", fullName: "Alex" });

    expect(bcrypt.hash).toHaveBeenCalledWith("pw", 10);
    expect(userRepository.createUser).toHaveBeenCalled();
    expect(user).toMatchObject({ id: "user-1", email: "a@example.com", fullName: "Alex" });
  });

  test("getUserById forbids cross-user access", async function() {
    await expect(userService.getUserById("u1", "u2")).rejects.toThrow("own user record");
  });

  test("getUserById returns serialized user", async function() {
    userRepository.findUserById.mockResolvedValue({ id: "u1", email: "a@example.com", full_name: "Alex", created_at: "c", updated_at: "u" });
    const result = await userService.getUserById("u1", "u1");
    expect(result.fullName).toBe("Alex");
  });

  test("updateUser validates and updates", async function() {
    userRepository.findUserById.mockResolvedValue({ id: "u1" });
    userRepository.updateUser.mockResolvedValue({ id: "u1", email: "a@example.com", full_name: "New Name", created_at: "c", updated_at: "u" });
    const result = await userService.updateUser("u1", "u1", { fullName: "New Name" });
    expect(result.fullName).toBe("New Name");
  });

  test("deleteUser blocks deletion when accounts exist", async function() {
    userRepository.findUserById.mockResolvedValue({ id: "u1" });
    userRepository.countAccountsForUser.mockResolvedValue(1);
    await expect(userService.deleteUser("u1", "u1")).rejects.toThrow("bank accounts still exist");
  });

  test("deleteUser deletes when safe", async function() {
    userRepository.findUserById.mockResolvedValue({ id: "u1" });
    userRepository.countAccountsForUser.mockResolvedValue(0);
    await userService.deleteUser("u1", "u1");
    expect(userRepository.deleteUser).toHaveBeenCalledWith("u1");
  });
});

describe("authService", function() {
  beforeEach(function() {
    jest.clearAllMocks();
  });

  test("requires email and password", async function() {
    await expect(authService.login("", "")).rejects.toThrow(AppError);
  });

  test("rejects invalid email", async function() {
    userRepository.findUserByEmail.mockResolvedValue(undefined);
    await expect(authService.login("a@example.com", "pw")).rejects.toThrow("Invalid credentials");
  });

  test("rejects invalid password", async function() {
    userRepository.findUserByEmail.mockResolvedValue({ password_hash: "hash" });
    bcrypt.compare.mockResolvedValue(false);
    await expect(authService.login("a@example.com", "pw")).rejects.toThrow("Invalid credentials");
  });

  test("returns signed token for valid credentials", async function() {
    userRepository.findUserByEmail.mockResolvedValue({ id: "u1", email: "a@example.com", password_hash: "hash" });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-token");
    const result = await authService.login("a@example.com", "pw");
    expect(result).toEqual({ accessToken: "jwt-token" });
  });
});

describe("accountService", function() {
  beforeEach(function() {
    jest.clearAllMocks();
  });

  test("createAccount validates required fields", async function() {
    await expect(accountService.createAccount("u1", {})).rejects.toThrow("name and accountType are required");
  });

  test("createAccount persists and serializes account", async function() {
    uuid.v4.mockReturnValue("acc-1");
    accountRepository.createAccount.mockResolvedValue({
      id: "acc-1",
      user_id: "u1",
      name: "Main",
      account_type: "current",
      balance_pence: 0,
      created_at: "c",
      updated_at: "u",
    });
    const result = await accountService.createAccount("u1", { name: "Main", accountType: "current" });
    expect(result.id).toBe("acc-1");
  });

  test("listAccounts serializes rows", async function() {
    accountRepository.listAccountsForUser.mockResolvedValue([{ id: "acc-1", user_id: "u1", name: "Main", account_type: "current", balance_pence: 0, created_at: "c", updated_at: "u" }]);
    const result = await accountService.listAccounts("u1");
    expect(result[0].userId).toBe("u1");
  });

  test("getOwnedAccount enforces ownership", async function() {
    accountRepository.findAccountById.mockResolvedValue({ id: "acc-1", user_id: "u2" });
    await expect(accountService.getOwnedAccount("acc-1", "u1")).rejects.toThrow("own accounts");
  });

  test("getAccount returns serialized account", async function() {
    accountRepository.findAccountById.mockResolvedValue({ id: "acc-1", user_id: "u1", name: "Main", account_type: "current", balance_pence: 0, created_at: "c", updated_at: "u" });
    const result = await accountService.getAccount("acc-1", "u1");
    expect(result.id).toBe("acc-1");
  });

  test("updateAccount persists changes", async function() {
    accountRepository.findAccountById.mockResolvedValue({ id: "acc-1", user_id: "u1", name: "Old", account_type: "current", balance_pence: 0, created_at: "c", updated_at: "u" });
    accountRepository.updateAccount.mockResolvedValue({ id: "acc-1", user_id: "u1", name: "New", account_type: "savings", balance_pence: 0, created_at: "c", updated_at: "u" });
    const result = await accountService.updateAccount("acc-1", "u1", { name: "New", accountType: "savings" });
    expect(result.name).toBe("New");
    expect(result.accountType).toBe("savings");
  });

  test("deleteAccount deletes owned account", async function() {
    accountRepository.findAccountById.mockResolvedValue({ id: "acc-1", user_id: "u1" });
    await accountService.deleteAccount("acc-1", "u1");
    expect(accountRepository.deleteAccount).toHaveBeenCalledWith("acc-1");
  });
});

describe("transactionService", function() {
  beforeEach(function() {
    jest.clearAllMocks();
    accountRepository.findAccountById.mockResolvedValue({ id: "acc-1", user_id: "u1", name: "Main", account_type: "current", balance_pence: 1000, created_at: "c", updated_at: "u" });
  });

  test("createTransaction validates type", async function() {
    await expect(transactionService.createTransaction("acc-1", "u1", { type: "bad", amount: "1.00" })).rejects.toThrow("type must be deposit or withdrawal");
  });

  test("createTransaction maps insufficient funds to 422", async function() {
    transactionRepository.createTransactionAndUpdateBalance.mockRejectedValue(new Error("INSUFFICIENT_FUNDS"));
    await expect(transactionService.createTransaction("acc-1", "u1", { type: "withdrawal", amount: "50.00" })).rejects.toThrow("Insufficient funds");
  });

  test("createTransaction returns serialized results", async function() {
    transactionRepository.createTransactionAndUpdateBalance.mockResolvedValue({
      account: { id: "acc-1", user_id: "u1", name: "Main", account_type: "current", balance_pence: 2000, created_at: "c", updated_at: "u" },
      transaction: { id: "tx-1", account_id: "acc-1", type: "deposit", amount_pence: 1000, description: "seed", created_at: "c" },
    });
    const result = await transactionService.createTransaction("acc-1", "u1", { type: "deposit", amount: "10.00", description: "seed" });
    expect(result.account.balance).toBe("20.00");
    expect(result.transaction.amount).toBe("10.00");
  });

  test("listTransactions serializes rows", async function() {
    transactionRepository.listTransactionsForAccount.mockResolvedValue([{ id: "tx-1", account_id: "acc-1", type: "deposit", amount_pence: 1000, description: null, created_at: "c" }]);
    const result = await transactionService.listTransactions("acc-1", "u1");
    expect(result[0].id).toBe("tx-1");
  });

  test("getTransaction rejects mismatched account", async function() {
    transactionRepository.findTransactionById.mockResolvedValue({ id: "tx-1", account_id: "acc-2" });
    await expect(transactionService.getTransaction("acc-1", "tx-1", "u1")).rejects.toThrow("Transaction not found");
  });

  test("getTransaction returns serialized transaction", async function() {
    transactionRepository.findTransactionById.mockResolvedValue({ id: "tx-1", account_id: "acc-1", type: "deposit", amount_pence: 1000, description: null, created_at: "c" });
    const result = await transactionService.getTransaction("acc-1", "tx-1", "u1");
    expect(result.id).toBe("tx-1");
  });
});
describe("transferService", function () {
  beforeEach(function () {
    jest.clearAllMocks();
  });

  it("transfers money when source account belongs to the user and has sufficient funds", async function () {
    accountRepository.findAccountById
      .mockResolvedValueOnce({
        id: "source-account-id",
        user_id: "user-id",
        balance_pence: 5000
      })
      .mockResolvedValueOnce({
        id: "target-account-id",
        user_id: "other-user-id",
        balance_pence: 1000
      });

    transferRepository.createTransfer.mockResolvedValue({
      transferId: "transfer-id",
      fromAccountId: "source-account-id",
      toAccountId: "target-account-id",
      amountPence: 2500,
      fromBalanceAfter: 2500,
      toBalanceAfter: 3500
    });

    const result = await transferService.transferMoney({
      authenticatedUserId: "user-id",
      fromAccountId: "source-account-id",
      toAccountId: "target-account-id",
      amount: "25.00"
    });

    expect(result.fromAccountId).toBe("source-account-id");
    expect(result.toAccountId).toBe("target-account-id");
    expect(result.amountPence).toBe(2500);
    expect(transferRepository.createTransfer).toHaveBeenCalledTimes(1);
  });

  it("rejects the transfer when the source account does not belong to the authenticated user", async function () {
    accountRepository.findAccountById.mockResolvedValueOnce({
      id: "source-account-id",
      user_id: "another-user-id",
      balance_pence: 5000
    });

    await expect(
      transferService.transferMoney({
        authenticatedUserId: "user-id",
        fromAccountId: "source-account-id",
        toAccountId: "target-account-id",
        amount: "10.00"
      })
    ).rejects.toThrow("403");
  });

  it("rejects the transfer when the source account has insufficient funds", async function () {
    accountRepository.findAccountById
      .mockResolvedValueOnce({
        id: "source-account-id",
        user_id: "user-id",
        balance_pence: 1000
      })
      .mockResolvedValueOnce({
        id: "target-account-id",
        user_id: "other-user-id",
        balance_pence: 1000
      });

    await expect(
      transferService.transferMoney({
        authenticatedUserId: "user-id",
        fromAccountId: "source-account-id",
        toAccountId: "target-account-id",
        amount: "25.00"
      })
    ).rejects.toThrow("422");
  });

  it("rejects transfers to the same account", async function () {
    await expect(
      transferService.transferMoney({
        authenticatedUserId: "user-id",
        fromAccountId: "same-account-id",
        toAccountId: "same-account-id",
        amount: "10.00"
      })
    ).rejects.toThrow("400");
  });
});
