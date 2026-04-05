"use strict";

const { setupFreshDatabaseModules } = require("../helpers/testDb");

describe("repository integration", function() {
  let ctx;

  afterEach(async function() {
    if (ctx) {
      await ctx.cleanup();
      ctx = null;
    }
  });

  test("userRepository creates, finds, updates, counts and deletes users", async function() {
    ctx = await setupFreshDatabaseModules();
    const userRepository = ctx.modules.userRepository;

    await userRepository.createUser({
      id: "u1",
      email: "a@example.com",
      passwordHash: "hash",
      fullName: "Alex",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });

    expect((await userRepository.findUserByEmail("a@example.com")).id).toBe("u1");
    expect((await userRepository.findUserById("u1")).email).toBe("a@example.com");

    await userRepository.updateUser("u1", { fullName: "Alex Updated", updatedAt: "2024-01-02T00:00:00.000Z" });
    expect((await userRepository.findUserById("u1")).full_name).toBe("Alex Updated");
    expect(await userRepository.countAccountsForUser("u1")).toBe(0);

    await userRepository.deleteUser("u1");
    expect(await userRepository.findUserById("u1")).toBeUndefined();
  });

  test("accountRepository creates, lists, finds, updates and deletes accounts", async function() {
    ctx = await setupFreshDatabaseModules();
    const userRepository = ctx.modules.userRepository;
    const accountRepository = ctx.modules.accountRepository;

    await userRepository.createUser({ id: "u1", email: "a@example.com", passwordHash: "hash", fullName: "Alex", createdAt: "c", updatedAt: "u" });

    await accountRepository.createAccount({
      id: "a1",
      userId: "u1",
      name: "Main",
      accountType: "current",
      balancePence: 0,
      createdAt: "c",
      updatedAt: "u",
    });

    expect((await accountRepository.listAccountsForUser("u1")).length).toBe(1);
    expect((await accountRepository.findAccountById("a1")).name).toBe("Main");

    await accountRepository.updateAccount("a1", { name: "Saver", accountType: "savings", updatedAt: "u2" });
    expect((await accountRepository.findAccountById("a1")).account_type).toBe("savings");

    await accountRepository.deleteAccount("a1");
    expect(await accountRepository.findAccountById("a1")).toBeUndefined();
  });

  test("transactionRepository creates transaction, updates balance and can list/find transactions", async function() {
    ctx = await setupFreshDatabaseModules();
    const userRepository = ctx.modules.userRepository;
    const accountRepository = ctx.modules.accountRepository;
    const transactionRepository = ctx.modules.transactionRepository;

    await userRepository.createUser({ id: "u1", email: "a@example.com", passwordHash: "hash", fullName: "Alex", createdAt: "c", updatedAt: "u" });
    await accountRepository.createAccount({ id: "a1", userId: "u1", name: "Main", accountType: "current", balancePence: 1000, createdAt: "c", updatedAt: "u" });

    const result = await transactionRepository.createTransactionAndUpdateBalance({
      accountId: "a1",
      transactionType: "deposit",
      amountPence: 500,
      description: "seed",
    });

    expect(result.account.balance_pence).toBe(1500);
    expect(result.transaction.type).toBe("deposit");
    expect((await transactionRepository.listTransactionsForAccount("a1")).length).toBe(1);
    expect((await transactionRepository.findTransactionById(result.transaction.id)).id).toBe(result.transaction.id);
  });

  test("transactionRepository rejects overdraft", async function() {
    ctx = await setupFreshDatabaseModules();
    const userRepository = ctx.modules.userRepository;
    const accountRepository = ctx.modules.accountRepository;
    const transactionRepository = ctx.modules.transactionRepository;

    await userRepository.createUser({ id: "u1", email: "a@example.com", passwordHash: "hash", fullName: "Alex", createdAt: "c", updatedAt: "u" });
    await accountRepository.createAccount({ id: "a1", userId: "u1", name: "Main", accountType: "current", balancePence: 100, createdAt: "c", updatedAt: "u" });

    await expect(transactionRepository.createTransactionAndUpdateBalance({
      accountId: "a1",
      transactionType: "withdrawal",
      amountPence: 500,
      description: "too much",
    })).rejects.toThrow("INSUFFICIENT_FUNDS");
  });
});
