# Cart Contracts

Rules: [[System Documentation]] §2 · All endpoints: **Customer**

Cart object:
```json
{
  "items": [
    {
      "productId": 12,
      "name": "Gymnastic Rings (Wood)",
      "imageUrl": "https://example.com/rings.jpg",
      "unitPrice": 185000,
      "quantity": 1,
      "stock": 14,
      "lineTotal": 185000,
      "isAvailable": true
    }
  ],
  "itemCount": 1,
  "subtotal": 185000
}
```
`isAvailable` is `false` when the product is inactive or `stock < quantity`; checkout is blocked until fixed.

---

## GET `/cart`
Response `200`: `{ "data": Cart }`

## POST `/cart/items`
Request: `{ "productId": 12, "quantity": 1 }`
Adds, or increases quantity if the product is already in the cart.
Response `201`: `{ "data": Cart }`
Errors: `400 VALIDATION_ERROR` · `404 PRODUCT_NOT_FOUND` · `409 INSUFFICIENT_STOCK`

## PATCH `/cart/items/:productId`
Request: `{ "quantity": 3 }` (sets absolute quantity)
Response `200`: `{ "data": Cart }`
Errors: `404 NOT_FOUND` (not in cart) · `409 INSUFFICIENT_STOCK`

## DELETE `/cart/items/:productId`
Response `200`: `{ "data": Cart }`
Errors: `404 NOT_FOUND`

## DELETE `/cart`
Clears the cart. Response `204`.
