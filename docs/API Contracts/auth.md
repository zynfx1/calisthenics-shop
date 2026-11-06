# Auth Contracts

Rules: [[System Documentation]] §0

---

## POST `/auth/register`
**Access:** Public

Request:
```json
{ "name": "Juan Dela Cruz", "email": "juan@email.com", "password": "secret123" }
```
Response `201`:
```json
{ "data": { "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com", "role": "CUSTOMER" } }
```
Errors: `400 VALIDATION_ERROR` · `409 EMAIL_TAKEN`

Validation: `name` 1–100 chars · `email` valid format · `password` min 8 chars.

---

## POST `/auth/login`
**Access:** Public

Request:
```json
{ "email": "juan@email.com", "password": "secret123" }
```
Response `200` (+ `Set-Cookie: refreshToken=...`):
```json
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "user": { "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com", "role": "CUSTOMER" }
  }
}
```
Errors: `401 INVALID_CREDENTIALS` (generic message) · `403 ACCOUNT_DISABLED` · `429 RATE_LIMITED`

---

## POST `/auth/refresh`
**Access:** Public (requires refresh cookie)

Request: no body.
Response `200` (+ rotated `Set-Cookie: refreshToken=...`): same shape as login.
Errors: `401 UNAUTHORIZED` (missing, expired, or revoked token). On **reuse of a revoked token** all of that user's refresh tokens are revoked.

---

## POST `/auth/logout`
**Access:** Auth

Request: no body. Revokes current refresh token and clears the cookie.
Response `204`.

---

## GET `/auth/me`
**Access:** Auth

Response `200`:
```json
{ "data": { "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com", "role": "CUSTOMER" } }
```
