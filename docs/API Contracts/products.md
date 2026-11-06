# Products Contracts

Rules: [[System Documentation]] §1, §5.2

Product object:
```json
{
  "id": 12,
  "name": "Gymnastic Rings (Wood)",
  "description": "32mm birch rings with adjustable straps.",
  "price": 185000,
  "stock": 14,
  "imageUrl": "https://example.com/rings.jpg",
  "isActive": true,
  "category": { "id": 2, "name": "Gymnastic Rings", "slug": "gymnastic-rings" },
  "createdAt": "2026-11-04T08:00:00Z",
  "updatedAt": "2026-11-04T08:00:00Z"
}
```

---

## GET `/products`
**Access:** Public (returns active products only)

Query: `page`, `limit`, `q` (name search), `categoryId`, `sort` = `newest | price_asc | price_desc` (default `newest`)

Response `200`:
```json
{ "data": [ Product, ... ], "meta": { "page": 1, "limit": 12, "total": 48, "totalPages": 4 } }
```

## GET `/products/:id`
**Access:** Public (inactive → `404`)

Response `200`: `{ "data": Product }`
Errors: `404 NOT_FOUND`

---

## GET `/admin/products`
**Access:** Admin (includes inactive)

Query: `page`, `limit`, `q`, `categoryId`, `isActive`
Response `200`: same list shape as `GET /products`.

## POST `/products`
**Access:** Admin

Request:
```json
{
  "name": "Gymnastic Rings (Wood)",
  "description": "32mm birch rings with adjustable straps.",
  "price": 185000,
  "stock": 14,
  "categoryId": 2,
  "imageUrl": "https://example.com/rings.jpg",
  "isActive": true
}
```
Validation: `name` required · `price` integer > 0 · `stock` integer ≥ 0 · `categoryId` must exist.
Response `201`: `{ "data": Product }`
Errors: `400 VALIDATION_ERROR` · `404 CATEGORY_NOT_FOUND`

## PATCH `/products/:id`
**Access:** Admin

Request: any subset of the create fields.
Response `200`: `{ "data": Product }`
Errors: `400 VALIDATION_ERROR` · `404 NOT_FOUND`

## DELETE `/products/:id`
**Access:** Admin

Response `204`. Also removes the product from carts.
Errors: `404 NOT_FOUND` · `409 PRODUCT_HAS_ORDERS` (deactivate instead)
