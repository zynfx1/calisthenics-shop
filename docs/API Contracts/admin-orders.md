# Admin — Orders & Customers Contracts

Rules: [[System Documentation]] §6, §7 · All endpoints: **Admin**
Order object: see [[API Contracts/orders]] (admin version adds `customer`).

```json
"customer": { "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com" }
```

---

## GET `/admin/orders`
Query: `page`, `limit`, `status`
Response `200`: `{ "data": [ Order (without items) ], "meta": { ... } }` newest first.

## GET `/admin/orders/:id`
Response `200`: `{ "data": Order }`
Errors: `404 NOT_FOUND`

## PATCH `/admin/orders/:id/status`
Request: `{ "status": "CONFIRMED" }`
Allowed transitions: `PENDING→CONFIRMED|CANCELLED` · `CONFIRMED→SHIPPED|CANCELLED` · `SHIPPED→DELIVERED`.
Cancelling restores stock in the same transaction.
Response `200`: `{ "data": Order }`
Errors: `400 VALIDATION_ERROR` · `404 NOT_FOUND` · `409 INVALID_STATUS_TRANSITION`

---

## GET `/admin/customers`
Query: `page`, `limit`, `q` (name or email)
Response `200`:
```json
{
  "data": [
    { "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com", "isActive": true, "orderCount": 3, "createdAt": "2026-11-04T08:00:00Z" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

## PATCH `/admin/customers/:id/active`
Request: `{ "isActive": false }`
Response `200`: customer object. Deactivating blocks login and revokes refresh tokens.
Errors: `404 NOT_FOUND`
