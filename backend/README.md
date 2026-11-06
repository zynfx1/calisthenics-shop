# Calisthenics Shop — Backend

Node.js + Express + TypeScript + PostgreSQL (Docker). Implements the contracts in `API Contracts/`.

## Structure

```
config/        env validation, db pool + transaction helper, constants
controllers/   request handlers + zod schemas, one file per module
middleware/    authenticate / requireRole, validate, errorHandler, rateLimiter
routes/        one router per module, mounted in routes/index.ts at /api/v1
database/      schema.sql, migrate.ts, seed.ts
utils/         AppError, tokens (JWT), order queries, sql/slug/param helpers
server.ts      app entry
```

## Setup

```bash
cp .env.example .env        # then set real JWT secrets
docker compose up -d        # PostgreSQL
npm install
npm run migrate             # create tables
npm run seed                # admin account + sample catalog
npm run dev                 # http://localhost:3000/api/v1
```

Default admin (from `.env`): `admin@calishop.com` / `Admin12345!` — change before deploying.

## Quick smoke test

```bash
curl http://localhost:3000/api/v1/health
curl "http://localhost:3000/api/v1/products?limit=5"
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" -c cookies.txt \
  -d '{"email":"admin@calishop.com","password":"Admin12345!"}'
```

## Notes

- Access token: 15 min, sent as `Authorization: Bearer`. Refresh token: 7 days, HTTP-only cookie scoped to `/api/v1/auth`, rotated on every refresh, stored hashed.
- Money is integer centavos.
- Checkout and cancellations run in DB transactions; product rows are locked with `FOR UPDATE` to prevent overselling.
