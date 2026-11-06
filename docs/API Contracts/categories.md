# Categories Contracts

Rules: [[System Documentation]] §5.1

Category object:
```json
{ "id": 1, "name": "Gymnastic Rings", "slug": "gymnastic-rings", "productCount": 4 }
```

---

## GET `/categories`
**Access:** Public

Response `200`: `{ "data": [ Category, ... ] }` sorted by name.

## POST `/categories`
**Access:** Admin

Request: `{ "name": "Parallettes" }`
Response `201`: `{ "data": Category }`
Errors: `400 VALIDATION_ERROR` · `409 CATEGORY_NAME_TAKEN`

## PATCH `/categories/:id`
**Access:** Admin

Request: `{ "name": "Parallette Bars" }`
Response `200`: `{ "data": Category }`
Errors: `404 NOT_FOUND` · `409 CATEGORY_NAME_TAKEN`

## DELETE `/categories/:id`
**Access:** Admin

Response `204`.
Errors: `404 NOT_FOUND` · `409 CATEGORY_HAS_PRODUCTS`
