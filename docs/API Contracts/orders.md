# Orders Contracts (Customer)

Rules: [[System Documentation]] §3 · All endpoints: **Customer**

Order object:
```json
{
  "id": 1042,
  "status": "PENDING",
  "total": 305000,
  "paymentMethod": "COD",
  "recipientName": "Juan Dela Cruz",
  "phone": "09170000000",
  "shippingAddress": "123 Sample St, Calamba, Laguna",
  "items": [
    { "productId": 12, "productName": "Gymnastic Rings (Wood)", "unitPrice": 185000, "quantity": 1, "lineTotal": 185000 }
  ],
  "createdAt": "2026-11-04T08:00:00Z",
  "updatedAt": "2026-11-04T08:00:00Z"
}
```

---

## POST `/orders`
Creates an order from the current cart in one transaction (stock check → create order + items → decrement stock → clear cart).

Request:
```json
{ "recipientName": "Juan Dela Cruz", "phone": "09170000000", "shippingAddress": "123 Sample St, Calamba, Laguna" }
```
Response `201`: `{ "data": Order }`
Errors:
- `400 VALIDATION_ERROR`
- `409 CART_EMPTY`
- `409 INSUFFICIENT_STOCK`
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Some items are no longer available in the requested quantity.",
    "details": [{ "productId": 12, "requested": 3, "available": 1 }]
  }
}
```
- `409 PRODUCT_UNAVAILABLE` (inactive product in cart)

## GET `/orders`
Query: `page`, `limit`, `status` (optional)
Response `200`: `{ "data": [ Order (without items) ], "meta": { ... } }`

## GET `/orders/:id`
Response `200`: `{ "data": Order }`
Errors: `404 NOT_FOUND` (also returned for other customers' orders)

## POST `/orders/:id/cancel`
Allowed only while `PENDING`. Restores stock in the same transaction.
Response `200`: `{ "data": Order }`
Errors: `404 NOT_FOUND` · `409 INVALID_STATUS_TRANSITION`
