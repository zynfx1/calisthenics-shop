# API Contracts — Conventions & Index

**Base URL (dev):** `http://localhost:3000/api/v1`
Business rules live in [[System Documentation]]. This folder only defines request/response shapes.

---

## Contract Index

| File | Module | Access |
| ---- | ------ | ------ |
| [[API Contracts/auth]] | Register, login, refresh, logout | Public / Auth |
| [[API Contracts/users]] | Own profile, change password | Customer |
| [[API Contracts/categories]] | Category read + admin CRUD | Public / Admin |
| [[API Contracts/products]] | Product read + admin CRUD | Public / Admin |
| [[API Contracts/uploads]] | Product image upload | Admin |
| [[API Contracts/cart]] | Server-side cart | Customer |
| [[API Contracts/orders]] | Checkout, history, cancel | Customer |
| [[API Contracts/admin-orders]] | Order management, customers | Admin |

---

## Authentication

- Protected routes require header: `Authorization: Bearer <accessToken>`
- Access token: JWT, **15 min**, payload `{ sub, role, iat, exp }`
- Refresh token: JWT in cookie `refreshToken` — `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
- Frontend must send requests with `credentials: 'include'` for `/auth/*`

## Access Levels

| Tag | Meaning |
| --- | ------- |
| `Public` | No token |
| `Auth` | Any logged-in user |
| `Customer` | Role `CUSTOMER` |
| `Admin` | Role `ADMIN` |

## Success Envelope

```json
{ "data": { } }
```

List endpoints:

```json
{
  "data": [ ],
  "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4 }
}
```

## Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

`details` is optional.

## Standard Status Codes

| Code | Use |
| ---- | --- |
| 200 | OK |
| 201 | Created |
| 204 | No content (delete / logout) |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` (wrong role) |
| 404 | `NOT_FOUND` |
| 409 | Business-rule conflict (see each contract) |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

## Conventions

- JSON keys are `camelCase`; DB columns are `snake_case`
- IDs are integers
- Money fields are **integers in centavos** (`185000` = ₱1,850.00)
- Timestamps are ISO-8601 UTC strings
- Pagination query: `?page=1&limit=12` (limit max 50)
- Enums: `Role = ADMIN | CUSTOMER` · `OrderStatus = PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED`
