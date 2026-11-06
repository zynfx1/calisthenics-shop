**Last synced with codebase:** Nov 04, 2026
Product-level documentation only. API contracts, request/response shapes, and implementation details live in [[API Contracts/00-conventions]] and the repo.

---

### Overview

| Field            | Details                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| **Project Name** | Calisthenics Shop                                                                                        |
| **Type**         | Public E-commerce Web Application (Single Store)                                                         |
| **Purpose**      | Simple online store for calisthenics gear (bars, rings, bands, apparel) — browse, cart, and place orders |
| **Target Users** | Guest (browse only), Customer (cart + orders), Admin (store owner — manages catalog and orders)          |
| **Tech Stack**   | Vue 3 (TypeScript) + Tailwind CSS v4.1 (frontend) · Node.js + Express (backend) · PostgreSQL in Docker (database) |
| **Auth**         | JWT — short-lived access token + HTTP-only refresh-token cookie                                          |
| **Scope**        | MVP — core CRUD only                                                                                     |

---

### Module Index

| Module                  | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Auth                    | Register, login, logout, token refresh; role-based routing for Customer and Admin    |
| Public Storefront       | Product listing, search, category filter, product detail — no login required         |
| Customer — Cart         | Add, update quantity, remove items, view cart totals                                 |
| Customer — Orders       | Checkout (Cash on Delivery), order history, order detail, cancel while pending       |
| Customer — Profile      | View and edit own name, phone, and default shipping address; change password         |
| Admin — Catalog         | CRUD for categories and products (including stock and active/inactive toggle)        |
| Admin — Orders          | View all orders, update order status through the allowed flow                        |
| Admin — Customers       | Read-only list of registered customers                                               |

---

### Core Features

---

## 0. Auth

**Features**

- Register with name, email, password
- Login with email + password
- Role-based redirect after login: Customer → Storefront (or the page they were trying to reach) · Admin → `/admin/products`
- Access token (JWT) returned in the response body, kept in memory on the frontend
- Refresh token (JWT) stored in an HTTP-only cookie; used to silently get a new access token
- Logout revokes the refresh token and clears the cookie

**Business Rules**

- Two roles: `ADMIN`, `CUSTOMER`
- Public registration always creates `CUSTOMER`; the `ADMIN` account is seeded into the database before launch — no admin self-registration
- Email must be unique (case-insensitive)
- Password: minimum 8 characters, hashed with bcrypt — never stored or returned in plain text
- Invalid credentials → generic "Invalid email or password" — never reveal which field is wrong
- Access token lifetime: **15 minutes**; refresh token lifetime: **7 days**
- Access token payload: `sub` (user ID), `role` — no email or personal data inside the token
- Refresh token is **rotated** on every refresh: old one is revoked, a new one is issued; a refresh token is stored hashed in `refresh_tokens`
- Reusing a revoked refresh token → reject with 401 and revoke all refresh tokens of that user
- On app load the frontend calls refresh once; success restores the session, failure redirects to login
- Role checks are enforced on both frontend routes and backend middleware — frontend guards are convenience only
- Customer cannot access `/admin/*`; Admin cannot use cart or place orders
- Deactivated accounts (`is_active = false`) cannot log in and their refresh tokens are rejected

---

## 1. Public Storefront

**Features**

- Public product grid — no login required
- Product card shows: image, name, price, category, "Out of stock" badge when stock is 0
- Search by product name
- Filter by category
- Sort by: Newest · Price low→high · Price high→low
- Pagination (12 per page)
- Product detail page: image, name, description, price, stock status, quantity picker, Add to Cart

**Business Rules**

- Only products with `is_active = true` are returned to the public
- No authentication required to browse
- Product with `stock = 0` is still visible but Add to Cart is disabled
- Guests who click Add to Cart are redirected to login, then returned to the product
- Product image is uploaded by the Admin; the product stores the resulting image URL; a placeholder is shown when empty
- Prices are stored in the smallest currency unit as integers (centavos) and formatted by the frontend

---

## 2. Customer — Cart

**Features**

- Add product to cart with a quantity
- Update item quantity
- Remove an item
- View cart with line totals, subtotal, and item count
- Cart icon in the header shows item count

**Business Rules**

- Cart is stored server-side per customer (`cart_items`) so it follows the user across devices
- One row per `(user, product)` — adding an existing product increases its quantity
- Quantity must be a positive integer and cannot exceed the product's current `stock`
- Inactive or deleted products are flagged in the cart and block checkout until removed
- Prices are always read from the product at fetch time — cart never stores a price
- Cart is emptied automatically after a successful order

---

## 3. Customer — Orders

**Features**

- Checkout form: recipient name, phone, shipping address (prefilled from profile)
- Place order from the current cart
- Order history list (newest first)
- Order detail: items, quantities, price snapshot, shipping info, status
- Cancel an order while it is still `PENDING`

**Business Rules**

- Payment method for MVP is **Cash on Delivery** only — no payment gateway
- Placing an order runs in a **single database transaction**: validate stock → create `orders` + `order_items` → decrement stock → clear cart. All succeed or all fail
- Stock is checked again inside the transaction; insufficient stock → `409 INSUFFICIENT_STOCK` listing the affected products
- `order_items` stores a **snapshot** of product name and unit price at order time — later product edits do not change past orders
- Shipping details are stored on the order itself (snapshot), not linked to the profile
- Order total = Σ (unit_price × quantity); no tax, shipping fee, or discounts in MVP
- Cancelling a `PENDING` order restores stock in the same transaction
- A customer can only view their own orders; accessing another customer's order returns `404`
- Orders are never deleted (audit trail)

**Order Status Flow**

| From        | Allowed To              | Who             |
| ----------- | ----------------------- | --------------- |
| `PENDING`   | `CONFIRMED`, `CANCELLED`| Admin · Customer may only cancel |
| `CONFIRMED` | `SHIPPED`, `CANCELLED`  | Admin           |
| `SHIPPED`   | `DELIVERED`             | Admin           |
| `DELIVERED` | —                       | final           |
| `CANCELLED` | —                       | final           |

- Admin cancelling a `CONFIRMED` order restores stock the same way
- Backend rejects any transition not in the table with `409 INVALID_STATUS_TRANSITION`

---

## 4. Customer — Profile

**Features**

- View and edit name, phone, default shipping address
- Change password (requires current password)

**Business Rules**

- Email is not editable in MVP
- Changing password revokes all of the user's refresh tokens (other devices are logged out)
- Customer can only read and edit their own profile

---

## 5. Admin — Catalog

---

### 5.1 Category Management

**Features**

- Create category: name
- View list of all categories with product count
- Edit category name
- Delete category

**Business Rules**

- Category name must be unique
- Slug is generated from the name on create/update
- Cannot delete a category that still has products; backend rejects with `409 CATEGORY_HAS_PRODUCTS` and the message is shown to Admin
- Example categories: Pull-up Bars, Gymnastic Rings, Resistance Bands, Parallettes, Apparel

---

### 5.2 Product Management

**Features**

- Create product: name, description, price, stock, category, product image (upload)
- View list of all products (including inactive) with search and category filter
- Edit any product field, including replacing or removing the product image
- Upload product image: drag-and-drop or file picker with a live preview
- Toggle active / inactive
- Delete product

**Business Rules**

- Every product belongs to exactly one category
- Price must be a positive integer (centavos); stock must be an integer ≥ 0
- Name is required; description and image URL are optional
- Inactive products are hidden from the storefront but stay in existing orders and in the Admin list
- Product that appears in any `order_items` row **cannot be hard-deleted**; backend returns `409 PRODUCT_HAS_ORDERS` — Admin should deactivate it instead
- Product with no orders can be deleted; it is also removed from any customer carts
- Editing price or name never rewrites past orders (snapshots)
- Image upload accepts JPG, PNG, WebP or GIF up to **5 MB**; one image per product
- Only Admin can upload; the server checks the file's type and contents, and stores it under a random filename (the original filename is discarded)
- Uploaded files are served publicly at `/uploads/<filename>`
- Replacing or removing a product's image does not delete the old file from disk in this version
- Saving a product is blocked while an upload is still in progress

---

## 6. Admin — Orders

**Features**

- List all orders, newest first, filter by status
- Order detail: customer, items, shipping info, total, status
- Update status using the allowed next-status buttons only

**Business Rules**

- Admin sees all orders; status transitions follow the table in §3
- Status buttons are derived from the current status — frontend never shows invalid transitions; backend re-validates
- Admin cannot edit order items, quantities, or prices
- Every status change records `updated_at`; full history log is out of scope for MVP

---

## 7. Admin — Customers

**Features**

- Read-only list of customers: name, email, joined date, order count

**Business Rules**

- Admin cannot view passwords or tokens
- Deactivating / reactivating a customer is a simple toggle on the list (sets `is_active`); no deletion of users

---

### Data Model (Summary)

| Table            | Key Fields                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `users`          | `id`, `name`, `email` (unique), `password_hash`, `role`, `phone`, `address`, `is_active`, timestamps |
| `refresh_tokens` | `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`                          |
| `categories`     | `id`, `name` (unique), `slug` (unique), timestamps                                               |
| `products`       | `id`, `category_id`, `name`, `description`, `price`, `stock`, `image_url`, `is_active`, timestamps |
| `cart_items`     | `id`, `user_id`, `product_id`, `quantity` — unique `(user_id, product_id)`                       |
| `orders`         | `id`, `user_id`, `status`, `total`, `recipient_name`, `phone`, `shipping_address`, `payment_method`, timestamps |
| `order_items`    | `id`, `order_id`, `product_id`, `product_name`, `unit_price`, `quantity`                         |

---

### Cross-Cutting Business Rules

- Single-store system — all data belongs to one shop
- All timestamps stored in UTC (`timestamptz`)
- Role-based access enforced by backend middleware on every protected route
- All request bodies validated server-side (never trust the frontend)
- Passwords hashed with bcrypt; refresh tokens stored hashed
- Money stored as integers (centavos); never floats
- Orders are never deleted; users are never deleted
- API errors follow one shape — see [[API Contracts/00-conventions]]
- Database runs in Docker (PostgreSQL); backend and frontend run locally in development

---

### System Scope

**In Scope**

- Register / login / logout with JWT access + refresh tokens
- Public storefront with search, filter, sort, pagination
- Server-side cart
- Checkout and order history (Cash on Delivery)
- Admin CRUD for categories and products
- Admin order management with status flow
- Customer profile

**Out of Scope (Not built in this version)**

- Online payment gateway (card, GCash, etc.)
- Cloud image storage (images are stored on the backend server's disk), multiple images per product, image cropping or resizing
- Product variants (size / color), reviews, wishlist
- Discounts, coupons, shipping fees, tax
- Email / SMS notifications, password reset by email
- Guest checkout
- Admin dashboard analytics and sales reports
- Order status history / audit log page
- Multiple stores or multi-admin roles

---

**Related docs:** [[Wireframe & Flows]] · [[Implementation Tracker]] · [[API Contracts/00-conventions]]
