**Last updated:** Nov 04, 2026
Status key: ⬜ Not started · 🟨 In progress · ✅ Done · ⛔ Blocked

Update this file whenever a task changes status. Each task maps to a module in [[System Documentation]] and a contract in [[API Contracts/00-conventions]].

---

### Progress Summary

| Phase                         | Tasks | Done | Status |
| ----------------------------- | ----- | ---- | ------ |
| 0. Project Setup              | 6     | 0    | ⬜     |
| 1. Auth (JWT)                 | 8     | 0    | ⬜     |
| 2. Catalog (Admin CRUD)       | 10    | 2    | 🟨     |
| 3. Storefront (Public)        | 6     | 0    | ⬜     |
| 4. Cart                       | 5     | 0    | ⬜     |
| 5. Orders & Checkout          | 8     | 0    | ⬜     |
| 6. Admin Orders & Customers   | 5     | 0    | ⬜     |
| 7. Profile                    | 3     | 0    | ⬜     |
| 8. Polish & QA                | 6     | 0    | ⬜     |

---

### Phase 0 — Project Setup

| #   | Task                                                                 | Layer    | Status |
| --- | -------------------------------------------------------------------- | -------- | ------ |
| 0.1 | Docker Compose with PostgreSQL + volume + `.env`                     | DB       | ⬜     |
| 0.2 | Express app scaffold (TS, folder structure, error handler, CORS)     | Backend  | ⬜     |
| 0.3 | DB migrations for all tables (see Data Model)                        | Backend  | ⬜     |
| 0.4 | Seed script: admin account + sample categories/products              | Backend  | ⬜     |
| 0.5 | Vue 3 + TS + Vite scaffold, Vue Router, Pinia                        | Frontend | ⬜     |
| 0.6 | Tailwind CSS v4.1 setup, base layout, axios instance with interceptor| Frontend | ⬜     |

### Phase 1 — Auth (JWT)

| #   | Task                                                             | Layer    | Status |
| --- | ---------------------------------------------------------------- | -------- | ------ |
| 1.1 | `POST /auth/register` (bcrypt, validation)                       | Backend  | ⬜     |
| 1.2 | `POST /auth/login` (access token + refresh cookie)               | Backend  | ⬜     |
| 1.3 | `POST /auth/refresh` with rotation + reuse detection             | Backend  | ⬜     |
| 1.4 | `POST /auth/logout` (revoke + clear cookie)                      | Backend  | ⬜     |
| 1.5 | `authenticate` + `requireRole` middleware                        | Backend  | ⬜     |
| 1.6 | Login / Register pages                                           | Frontend | ⬜     |
| 1.7 | Auth store, silent refresh on load, 401 retry interceptor        | Frontend | ⬜     |
| 1.8 | Router guards (guest / customer / admin)                         | Frontend | ⬜     |

### Phase 2 — Catalog (Admin CRUD)

| #   | Task                                                    | Layer    | Status |
| --- | ------------------------------------------------------- | -------- | ------ |
| 2.1 | Categories CRUD endpoints (+ delete guard)              | Backend  | ⬜     |
| 2.2 | Products CRUD endpoints (+ toggle active, delete guard) | Backend  | ⬜     |
| 2.3 | Request validation schemas (zod)                        | Backend  | ⬜     |
| 2.4 | Admin layout + sidebar                                  | Frontend | ⬜     |
| 2.5 | Admin Categories page                                   | Frontend | ⬜     |
| 2.6 | Admin Products page (table, search, filter)             | Frontend | ⬜     |
| 2.7 | Product form modal (create / edit)                      | Frontend | ⬜     |
| 2.8 | Delete confirm dialog + server error toast              | Frontend | ⬜     |
| 2.9 | `POST /uploads/product-image` (multer, type/size/signature checks, static `/uploads`) | Backend | ✅ |
| 2.10 | ImageUpload component in product form (drag-drop, preview, replace, remove) | Frontend | ✅ |

### Phase 3 — Storefront (Public)

| #   | Task                                              | Layer    | Status |
| --- | ------------------------------------------------- | -------- | ------ |
| 3.1 | `GET /products` (search, category, sort, paginate)| Backend  | ⬜     |
| 3.2 | `GET /products/:id` + `GET /categories`           | Backend  | ⬜     |
| 3.3 | Storefront page (grid, filters, pagination)       | Frontend | ⬜     |
| 3.4 | Product card component + out-of-stock state       | Frontend | ⬜     |
| 3.5 | Product detail page                               | Frontend | ⬜     |
| 3.6 | Header with cart count + user menu                | Frontend | ⬜     |

### Phase 4 — Cart

| #   | Task                                              | Layer    | Status |
| --- | ------------------------------------------------- | -------- | ------ |
| 4.1 | `GET /cart`, `POST /cart/items`                   | Backend  | ⬜     |
| 4.2 | `PATCH /cart/items/:productId`, `DELETE ...`      | Backend  | ⬜     |
| 4.3 | Stock + active-product validation                 | Backend  | ⬜     |
| 4.4 | Cart store (Pinia) + Add to Cart flow w/ login redirect | Frontend | ⬜ |
| 4.5 | Cart page                                         | Frontend | ⬜     |

### Phase 5 — Orders & Checkout

| #   | Task                                                          | Layer    | Status |
| --- | ------------------------------------------------------------- | -------- | ------ |
| 5.1 | `POST /orders` transaction (stock check, snapshot, clear cart)| Backend  | ⬜     |
| 5.2 | `GET /orders`, `GET /orders/:id` (owner only)                 | Backend  | ⬜     |
| 5.3 | `POST /orders/:id/cancel` + stock restore                     | Backend  | ⬜     |
| 5.4 | Concurrency test: two buyers, last item in stock              | Backend  | ⬜     |
| 5.5 | Checkout page (prefill from profile)                          | Frontend | ⬜     |
| 5.6 | Handle `INSUFFICIENT_STOCK` response                          | Frontend | ⬜     |
| 5.7 | Order history page                                            | Frontend | ⬜     |
| 5.8 | Order detail page + cancel button                             | Frontend | ⬜     |

### Phase 6 — Admin Orders & Customers

| #   | Task                                                      | Layer    | Status |
| --- | --------------------------------------------------------- | -------- | ------ |
| 6.1 | `GET /admin/orders`, `GET /admin/orders/:id`              | Backend  | ⬜     |
| 6.2 | `PATCH /admin/orders/:id/status` (transition validation)  | Backend  | ⬜     |
| 6.3 | `GET /admin/customers`, `PATCH /admin/customers/:id/active` | Backend | ⬜    |
| 6.4 | Admin Orders list + detail pages                          | Frontend | ⬜     |
| 6.5 | Admin Customers page                                      | Frontend | ⬜     |

### Phase 7 — Profile

| #   | Task                                              | Layer    | Status |
| --- | ------------------------------------------------- | -------- | ------ |
| 7.1 | `GET/PATCH /users/me`, `POST /users/me/password`  | Backend  | ⬜     |
| 7.2 | Revoke refresh tokens on password change          | Backend  | ⬜     |
| 7.3 | Profile page                                      | Frontend | ⬜     |

### Phase 8 — Polish & QA

| #   | Task                                                    | Layer | Status |
| --- | ------------------------------------------------------- | ----- | ------ |
| 8.1 | Empty / loading / error states on all screens           | FE    | ⬜     |
| 8.2 | Responsive check (mobile, tablet, desktop)              | FE    | ⬜     |
| 8.3 | Rate limit on `/auth/*` routes                          | BE    | ⬜     |
| 8.4 | Security pass: helmet, cookie flags, input validation   | BE    | ⬜     |
| 8.5 | End-to-end happy path test (register → order → admin ships) | QA | ⬜     |
| 8.6 | README: setup, env vars, Docker commands                | Docs  | ⬜     |

---

### Decisions Log

| Date         | Decision                                                      | Reason                                     |
| ------------ | ------------------------------------------------------------- | ------------------------------------------ |
| Nov 04, 2026 | Access token in memory, refresh token in HTTP-only cookie     | Avoids XSS token theft from localStorage   |
| Nov 04, 2026 | Cash on Delivery only                                         | MVP — no payment gateway                   |
| Nov 04, 2026 | Money stored as integer centavos                              | Avoids float rounding errors               |
| Nov 04, 2026 | Server-side cart                                              | Cart persists across devices               |

### Open Questions

- [ ] Currency and locale formatting (PHP assumed)
- [x] Product images are uploaded to the backend `uploads/` folder and served at `/uploads/...`
- [ ] Move image storage to cloud storage (S3 / Cloudinary) before production, and delete orphaned files

---

**Related docs:** [[System Documentation]] · [[Wireframe & Flows]] · [[API Contracts/00-conventions]]
