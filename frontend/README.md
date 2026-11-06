# Calisthenics Shop — Frontend

Vue 3 + TypeScript + Tailwind CSS v4.1 + Pinia + Vue Router. Talks to the Express backend in `../calisthenics-shop-backend`.

## Run

```bash
cp .env.example .env     # VITE_API_URL points at the backend
npm install
npm run dev              # http://localhost:5173
```

The backend must be running with `CLIENT_URL=http://localhost:5173` (CORS + refresh cookie).

## Structure

```
src/
  api/          axios instance (token refresh + retry) and endpoint modules
  stores/       auth (session), cart, toast
  router/       routes + guards (guest / customer / admin)
  layouts/      StoreLayout, AuthLayout, AdminLayout
  views/        storefront, auth, and admin/ pages
  components/   ui/ (buttons, inputs, modal, badges...) and admin/ProductFormModal
  utils/        price/date formatting, API error helpers
  types/        shared TypeScript types
  style.css     Tailwind import + design tokens
```

## Design

Monochrome: true black page, dark-gray surfaces (`surface`, `raised`), hairline `line` borders, white primary actions.
White panels are reserved for the cart and checkout summaries. Order status is told apart by fill and weight, not color.
Tokens live in `@theme` in `src/style.css` (`bg-void`, `bg-surface`, `bg-raised`, `border-line`, `text-muted`, `text-soft`, `bg-paper`).

## Auth

The access token is kept in memory only. On load the app calls `/auth/refresh` (HTTP-only cookie) to restore the session;
any 401 triggers one silent refresh and a retry of the original request.
