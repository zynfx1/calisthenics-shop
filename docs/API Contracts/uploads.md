# Uploads Contracts

Rules: [[System Documentation]] §5.2

---

## POST `/uploads/product-image`
**Access:** Admin

Request: `multipart/form-data` with one file in the field **`image`**.

| Rule | Value |
| ---- | ----- |
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Max size | 5 MB |
| Files per request | 1 |

Response `201`:
```json
{ "data": { "url": "http://localhost:3000/uploads/3f2b9c1e-7d4a-4c1e-9b0a-2e6f1d8a5c77.jpg" } }
```

The returned `url` is what the frontend sends as `imageUrl` when creating or updating a product ([[API Contracts/products]]). Uploading does not attach the image to anything by itself.

Errors:
- `400 VALIDATION_ERROR` — no file in the `image` field
- `400 INVALID_FILE_TYPE` — type not allowed, or the file contents are not a real image
- `413 FILE_TOO_LARGE` — over 5 MB
- `401 UNAUTHORIZED` / `403 FORBIDDEN`

## GET `/uploads/:filename`
**Access:** Public. Static file, served from the backend root (not under `/api/v1`).
