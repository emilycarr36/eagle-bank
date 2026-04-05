# Eagle Bank API (Node 24, Express, SQLite, Swagger)

This repo is the **Node.js implementation** of the Eagle Bank take-home API, uplifted to a modern stack and intended to run on **Node 24**.

It uses:
- **Express** for routing and middleware
- **SQLite** for a lightweight SQL database
- **uuid v4** for resource identifiers
- **JWT bearer authentication**
- **Swagger UI** for manual API testing

## Why I chose this stack

### Express
I used **Express** because it is the most familiar and readable choice for a REST API take-home. It keeps routing, middleware, request handling, and Swagger integration straightforward, which makes the code easy for a reviewer to follow quickly.

### SQLite
You asked for an **SQL database**, and I chose **SQLite** because it gives a real relational database with almost no setup overhead. For a take-home, that is a good trade-off:
- no Docker required
- no separate database server required
- still demonstrates tables, foreign keys, indexes, transactions, and SQL queries

If this were being productionised, I would move to **PostgreSQL** for stronger concurrency guarantees, richer operational tooling, better scaling characteristics, and a more formal migration workflow.

### uuid v4
I used **UUID v4** for users, accounts, and transactions so IDs are explicit, standard, and not dependent on incremental numeric sequences.

### JWT authentication
The brief asks for an authentication endpoint that returns a JWT bearer token, so I added:
- `POST /v1/auth/login`

That token can then be supplied as:
- `Authorization: Bearer <token>`

### Service and repository split
I separated the application into:
- **routes** for HTTP concerns
- **services** for business rules
- **repositories** for SQL access

I chose that structure so the code is easier to reason about and so banking rules are not mixed directly into route handlers.

### Integer pence for money
I store money in the database as **integer pence** rather than floating-point values. I chose that because it avoids rounding issues and keeps balance updates predictable.

### Swagger UI
I wired in **Swagger UI** because it is the fastest way for a reviewer to test the API interactively without needing a Postman collection or custom scripts.

## Features covered

The API supports:
- creating a user
- logging in and receiving a JWT
- fetching, updating, and deleting the authenticated user
- creating, listing, fetching, updating, and deleting accounts
- creating deposit and withdrawal transactions
- listing account transactions
- fetching an individual transaction
- ownership checks so users can only access their own records
- transaction immutability at the API level

This lines up with the take-home brief’s core scenarios around users, accounts, transactions, and bearer-token authentication.

## Project structure

```text
eagle-bank-node-api-express-sql/
├── data/                      # SQLite database file will be created here at runtime
├── src/
│   ├── app.js                 # Express app wiring
│   ├── server.js              # Startup entrypoint
│   ├── config/
│   │   └── index.js           # Environment-driven configuration
│   ├── db/
│   │   ├── connection.js      # SQLite connection wrapper
│   │   ├── init.js            # Manual DB initialisation script
│   │   └── schema.js          # Table and index creation
│   ├── middleware/
│   │   ├── authenticate.js    # JWT auth middleware
│   │   └── errorHandler.js    # 404 and error handling
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── accountRepository.js
│   │   └── transactionRepository.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── userRoutes.js
│   │   └── accountRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── accountService.js
│   │   └── transactionService.js
│   └── utils/
│       ├── errors.js
│       ├── money.js
│       └── serializers.js
├── tests/
│   ├── helpers/                 # Test DB setup helpers
│   ├── integration/            # Repository and API flow tests
│   └── unit/                   # Unit tests for utils, middleware and services
├── openapi.yaml
├── package.json
└── README.md
```



## Note if you are upgrading from the earlier cents-based zip

This version stores money in SQLite using `balance_pence` and `amount_pence` columns rather than the earlier `balance_cents` and `amount_cents` names.

If you already created a database file from the earlier zip, delete the old SQLite file and re-initialise the schema so the new column names are created cleanly:

```bash
rm -f data/eagle-bank.sqlite
npm run init-db
```

## Requirements

- **Node.js 24.x**
- **npm** that ships with Node 24

You can verify your version with:

```bash
node -v
npm -v
```

## What was uplifted for Node 24

This zip keeps the same API behaviour, Swagger docs, Jest coverage, and SQLite database model, but updates the runtime target and package versions so it fits a current Node environment better.

The main changes are:
- **Express 5** instead of the older Express 4 line
- **jsonwebtoken 9** for the maintained major version
- **uuid 11** for current UUID support
- **swagger-ui-express 5**
- **Jest 30** and **Supertest 7**
- a **Node 24** engine target and `.nvmrc` file
- a `npm run dev` script using Node's built-in `--watch` mode

I kept SQLite because it is still the best fit for a take-home: real SQL, minimal setup, and easy local inspection.

## Install dependencies

From the project root:

```bash
npm install
```

If you use `nvm`, you can switch straight to the intended runtime with:

```bash
nvm use
```

## Running the application

### Option 1: normal start
This is the standard way to run the API:

```bash
npm start
```

On startup, the app will:
1. create the SQLite database file if it does not already exist
2. create the tables and indexes if they do not already exist
3. start the HTTP server on port `3000` by default

You should then be able to open:
- API base URL: `http://localhost:3000`
- health endpoint: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/docs`

### Option 2: initialise the database only
If you want to create the database schema without starting the server:

```bash
npm run init-db
```

That runs the schema bootstrap logic and exits.

## Environment variables

The app supports these environment variables:

- `PORT` - port for the HTTP server
- `JWT_SECRET` - signing secret for JWTs
- `DB_FILE` - path to the SQLite database file

### Example on macOS/Linux

```bash
PORT=3000 JWT_SECRET=my-secret DB_FILE=./data/eagle-bank.sqlite npm start
```

### Example on Windows PowerShell

```powershell
$env:PORT="3000"
$env:JWT_SECRET="my-secret"
$env:DB_FILE="./data/eagle-bank.sqlite"
npm start
```

## Database location and how to connect to it

This app uses a **SQLite file**, so there is no separate database server to connect to.

By default, the database file is created at:

```text
data/eagle-bank.sqlite
```

That means once the app has started, you should see:

```text
<project-root>/data/eagle-bank.sqlite
```

### Inspecting the database with the SQLite CLI

If you have the `sqlite3` command line tool installed:

```bash
sqlite3 data/eagle-bank.sqlite
```

Inside the SQLite shell, useful commands are:

```sql
.tables
.schema users
.schema accounts
.schema transactions
SELECT * FROM users;
SELECT * FROM accounts;
SELECT * FROM transactions;
```

Exit the shell with:

```sql
.quit
```

### Inspecting the database with a GUI
You can also open `data/eagle-bank.sqlite` in tools like:
- DB Browser for SQLite
- DBeaver
- Beekeeper Studio

That is usually the easiest way to inspect rows and relationships visually.


## Running the test suite

The project now includes **Jest** tests for:
- utility functions
- middleware
- services
- repositories
- an end-to-end API flow through the Express app

### Run all tests

```bash
npm test
```

### Run only unit tests

```bash
npm run test:unit
```

### Run only integration tests

```bash
npm run test:integration
```

### Notes about the test setup

- The integration tests create a **temporary SQLite database** for each run, so they do not depend on or modify your normal `data/eagle-bank.sqlite` file.
- The API integration test exercises the main user, auth, account and transaction flow against the real Express app.
- The service tests mock repository dependencies so business rules can be tested in isolation.

Because this repo is pinned to **Node 10.15.3**, I used versions of Jest and Supertest that are compatible with that runtime.

## How to test the API in Swagger

1. Start the server with `npm start`
2. Open `http://localhost:3000/docs`
3. Call `POST /v1/users` to create a user
4. Call `POST /v1/auth/login` with the same email and password
5. Copy the returned JWT token
6. Click **Authorize** in Swagger
7. Paste: `Bearer <your-token>`
8. Call the protected endpoints

## Example API flow

### 1. Create a user

`POST /v1/users`

```json
{
  "email": "alex@example.com",
  "password": "Password123!",
  "fullName": "Alex Example"
}
```

### 2. Log in

`POST /v1/auth/login`

```json
{
  "email": "alex@example.com",
  "password": "Password123!"
}
```

### 3. Create an account

`POST /v1/accounts`

```json
{
  "name": "Main Current Account",
  "accountType": "current"
}
```

### 4. Deposit money

`POST /v1/accounts/{accountId}/transactions`

```json
{
  "type": "deposit",
  "amount": "250.00",
  "description": "Initial deposit"
}
```

## Notes on implementation choices

### Why transactions are only create/read
The brief says transactions should be retrievable but not modified or deleted, so I made them **immutable** at the API layer.

### Why I used a SQL transaction for balance updates
Deposits and withdrawals update both:
- the `transactions` table
- the `accounts.balance_pence` value

I wrapped that in a SQLite transaction so those two operations succeed or fail together.

### Why there is ownership checking in services
The brief expects users to be blocked from accessing another user's data. I kept those ownership checks in the **service layer** so they are centralised and not duplicated in every route.

## Scripts

```bash
npm start      # start the API
npm run dev    # same as start in this repo
npm run init-db
npm test
```

## Dependency note
Because this repo is pinned for **Node 10.15.3**, the dependency versions are also intentionally pinned to older compatible releases. That is deliberate so the app matches your runtime rather than assuming a newer local environment.
