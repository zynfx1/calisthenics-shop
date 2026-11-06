# Users (Profile) Contracts

Rules: [[System Documentation]] §4

---

## GET `/users/me`
**Access:** Customer

Response `200`:
```json
{
  "data": {
    "id": 5, "name": "Juan Dela Cruz", "email": "juan@email.com",
    "phone": "09170000000", "address": "123 Sample St, Calamba, Laguna",
    "createdAt": "2026-11-04T08:00:00Z"
  }
}
```

## PATCH `/users/me`
**Access:** Customer

Request (all fields optional):
```json
{ "name": "Juan D.", "phone": "09170000000", "address": "123 Sample St, Calamba, Laguna" }
```
Response `200`: same shape as GET. Email is not editable.
Errors: `400 VALIDATION_ERROR`

## POST `/users/me/password`
**Access:** Customer

Request:
```json
{ "currentPassword": "secret123", "newPassword": "newSecret456" }
```
Response `204`. Revokes all refresh tokens of the user.
Errors: `400 VALIDATION_ERROR` · `401 INVALID_CREDENTIALS` (wrong current password)
