# Vexora E-commerce Project

## Purpose

Vexora is a French-language Tunisian e-commerce storefront prototype. It presents a curated catalog across electronics, home, fashion, and beauty, lets visitors filter/search products, build a temporary cart, review the cart in a floating modal, and submit a guest order through a dedicated checkout page.

This document is written for future AI agents and developers. It describes the current implementation, important conventions, data flow, known limitations, and safe extension points.

## Product and UX Summary

- Brand: VEXORA, tagline “Plus qu'une boutique”.
- Locale/content: French, Tunisian delivery messaging, prices displayed as DT.
- Visual direction: dark storefront with near-black backgrounds, white text, and Vexora red accents.
- Main customer journey:
  1. Visit `/`.
  2. Search or filter the featured catalog.
  3. Add one or more products to the cart.
  4. Click the floating cart button or header cart icon.
  5. Review products and quantities in the floating cart window.
  6. Click “Passer la commande”.
  7. Complete the form on `/checkout`.
  8. The server validates and stores the guest order through `/api/orders`.

## Technology Stack

- Next.js `16.3.3` with the App Router.
- React 19.
- TypeScript 5.7.
- Tailwind CSS 4 with `tw-animate-css` and shadcn CSS foundations.
- `lucide-react` for icons.
- Express and `mysql2` in `../backend` for guest order storage in MySQL.
- `/admin` order dashboard, protected by a backend `ADMIN_API_KEY`.
- pnpm `12.3.4`.
- Admin access uses a shared API key; customer accounts are not implemented.
- Shopify helper code exists, but the active storefront currently uses the local catalog in `lib/products.ts`.

## Repository Layout

```text
app/
  api/orders/route.ts       Guest order POST endpoint.
  api/admin/orders/route.ts Admin order API proxy.
  admin/page.tsx            Protected order management dashboard.
  cart/page.tsx             Older standalone cart page; not the primary cart flow.
  checkout/page.tsx         Checkout form and selected-product summary.
  globals.css               Tailwind imports, theme variables, and base styles.
  layout.tsx                Root HTML layout and metadata.
  page.tsx                  Main interactive storefront and floating cart modal.
  products/page.tsx         Full catalog route with search/category filters.

components/
  ui/button.tsx             shadcn/Base UI button primitive.

lib/
  products.ts               Canonical editable local product catalog.
  shopify.ts                Shopify Storefront API helper utilities.
  utils.ts                  Shared class-name utility.

public/
  Brand and placeholder static assets.

next.config.mjs             Next.js configuration.
postcss.config.mjs          PostCSS/Tailwind configuration.
components.json             shadcn configuration.
package.json                Scripts and dependencies.
pnpm-lock.yaml              Locked dependency graph.
```

## Routes

### `/`

Defined in `app/page.tsx`. This is a client component because it owns interactive state:

- Header navigation and mobile menu.
- Search input.
- Category selection.
- Favorites state.
- Product filtering.
- Cart state and quantity changes.
- Floating cart dialog.
- Link to checkout.

The home page currently renders the first six products from the shared `products` array through filtering. Product cards add items to the in-memory cart.

### `/products`

Defined in `app/products/page.tsx`. This is the complete local catalog page:

- Uses all products from `lib/products.ts`.
- Search by product name or category.
- Filter by `productCategories`.
- Local favorites state.
- Responsive grid.
- Navigation back to `/`.

The products page currently has its own local UI state and its own header cart button. It does not share the homepage React cart state because there is no global cart provider yet.

### `/cart`

Defined in `app/cart/page.tsx`. This is an older standalone cart-review route. The current intended UX is the floating cart modal on `/`, followed by `/checkout`; avoid restoring `/cart` as the main flow unless explicitly requested. Keep this file only if a future route-level cart is desired.

### `/checkout`

Defined in `app/checkout/page.tsx`. This is the correct order form route. It reads selected items from the `items` query parameter, resolves IDs against `lib/products.ts`, and displays:

- Selected product names.
- Quantities.
- Customer name.
- Phone number.
- City.
- Delivery address.
- Guest checkout explanation.
- Order confirmation/error status.

Example URL:

```text
/checkout?items=1:2,2:1
```

The query means product ID `1` quantity `2`, and product ID `2` quantity `1`.

### `/api/orders`

Defined in `app/api/orders/route.ts`. Only `POST` is implemented. The endpoint:

1. Parses JSON.
2. Validates name, Tunisian phone number, address, and city.
3. Requires a non-empty item array with at most 50 lines.
4. Normalizes item IDs, names, and quantities.
5. Forwards the order to the Express backend, which stores it in MySQL.
6. Returns `{ orderId }` on success.

Set `BACKEND_API_URL` in the frontend environment when the backend is not running at `http://localhost:4000`.

## Editing Products

The main edit point is `lib/products.ts`. It exports:

```ts
export type Product = {
  id: number
  name: string
  category: string
  price: string
  oldPrice: string
  badge: string
  image: string
}

export const products: Product[] = []
export const productCategories = []
```

To add or edit a product:

1. Open `lib/products.ts`.
2. Keep every product ID unique and numeric.
3. Update `name`, `category`, `price`, `oldPrice`, `badge`, and `image`.
4. Add a category to `productCategories` if it is new.
5. Keep image URLs publicly reachable and provide meaningful product names for alt text.

The homepage, `/products`, and `/checkout` all depend on this file. Do not duplicate product data in page components.

## Cart Data Flow

The current cart is intentionally lightweight and client-side:

- State lives in `app/page.tsx` as `orderItems`.
- Each item stores only `id`, `name`, and `quantity`.
- `cartCount` is derived from all item quantities.
- Adding an existing product increments quantity.
- The floating modal can decrement, increment, or remove quantities.
- “Passer la commande” serializes the cart as `id:quantity` pairs and navigates to `/checkout`.
- The checkout page resolves product details again from the canonical catalog.

Current limitations:

- Cart state is not persisted across refreshes.
- Cart state is not shared between `/` and `/products`.
- The client sends `total: 0`; the API currently stores that value.
- The API trusts submitted item names and does not recalculate prices from a server-side catalog.

For production checkout, add a shared cart context or server-backed cart, validate product IDs against a server-side price catalog, calculate totals server-side, and enforce quantity limits at the aggregate order level.

## Order Storage

The backend creates a MySQL table named `guest_orders` automatically when it receives its first order:

```sql
id char(36) primary key
customer_name varchar(120) not null
phone varchar(30) not null
address varchar(300) not null
city varchar(80) not null
items json not null
total decimal(12,3) not null
status varchar(30) not null default 'pending'
created_at timestamp not null default current_timestamp
```

Configure MySQL in `backend/.env` with `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`, or provide a `MYSQL_URL` connection string. Order requests fail with a clear error when MySQL is not configured or unavailable; they are not reported as successful unless stored.

Set a long, private `ADMIN_API_KEY` in `backend/.env` to enable the `/admin` dashboard. Enter this key on the dashboard; it is kept only in the current browser session and is required for listing or updating orders. The frontend API proxies admin requests to the backend, using `BACKEND_API_URL` if it is not running at `http://localhost:4000`.

Do not expose database credentials to client components. Do not build SQL using string interpolation; use parameterized queries as the current API does.

## Environment Variables

The project environment includes MySQL backend and Shopify-related variables. Relevant variables are:

```text
MYSQL_URL
MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE
ADMIN_API_KEY
BACKEND_API_URL
SHOPIFY_STORE_DOMAIN
SHOPIFY_STOREFRONT_ACCESS_TOKEN
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
```

`BETTER_AUTH_SECRET` has been discussed for a future Better Auth setup, but no Better Auth runtime files currently exist in this project. Do not add authentication code unless the variable is confirmed available and the user explicitly requests authentication.

Never commit `.env` files, secret values, database URLs, access tokens, or generated credentials.

## Shopify Integration Status

`lib/shopify.ts` contains reusable Shopify Storefront API helpers:

- `getProducts()` fetches up to 12 products using GraphQL.
- `formatPrice()` formats currency for the `fr-TN` locale.
- URL helpers build product, store, and cart links.
- `isShopifyConfigured()` checks the Shopify environment variables.
- Product mapping helpers normalize title, type, description, image, price, and metadata.

The current visible pages do not call `getProducts()`. They use `lib/products.ts` instead. If switching to Shopify, make the switch deliberately across the storefront and products route, preserve loading/error states, and do not leave two competing sources of truth.

## Styling and Design System

The visual system is implemented mainly with Tailwind utility classes directly in page components:

- Background: `#0b0d0f`.
- Secondary surface: `#111417` and `#15191c`.
- Accent red: `#e51b2b`.
- Hover red: `#ff3347`.
- White text with opacity variations for secondary content.
- Rounded cards and pill buttons.
- Responsive mobile-first grids using Tailwind breakpoints.
- Semantic `main`, `header`, `section`, `article`, `footer`, buttons, links, labels, and dialog attributes are used throughout.

`app/globals.css` imports Tailwind and shadcn styles, defines light/dark design tokens, and enables smooth scrolling. Page-specific storefront styling remains in JSX classes rather than CSS modules.

## Configuration

### `next.config.mjs`

- `typescript.ignoreBuildErrors` is currently `true`. This allows builds to complete despite TypeScript diagnostics and should be revisited before production.
- `images.unoptimized` is `true`; images are rendered without Next.js image optimization.

### `package.json`

Available scripts:

```bash
pnpm dev
pnpm build
pnpm start
```

The project uses pnpm and the lockfile must be kept synchronized with dependency changes.

## Development Workflow

1. Inspect the relevant route and shared modules before editing.
2. Keep product data in `lib/products.ts`.
3. Use absolute project paths when editing in the v0 environment.
4. Prefer existing Tailwind conventions and Lucide icons.
5. Validate changed behavior in the browser with `agent-browser` when UI behavior changes.
6. Run `pnpm build` after route, dependency, API, or TypeScript changes.
7. Run `SyncGit` after the final file change so the branch remains synchronized.

## Validation Checklist

For storefront changes:

- Open `/`.
- Confirm the page renders in dark mode.
- Search for a known product.
- Test a category filter.
- Add a product to the cart.
- Open the floating cart.
- Change quantity and remove an item.
- Click “Passer la commande”.
- Confirm `/checkout` displays the selected products.

For order API changes:

- Test valid French/Tunisian customer data.
- Test invalid name, phone, city, address, and empty cart.
- Confirm parameterized database insertion remains intact.
- Never use real customer data in tests.

For catalog changes:

- Confirm the product appears on `/` or `/products`.
- Confirm its image has a useful alt name.
- Confirm its category is available in the filter list.
- Confirm checkout can resolve the product ID.

## Known Issues and Future Work

1. Remove the unused hidden order form and obsolete `submitFastOrder` logic from `app/page.tsx`; checkout is now the intended submission path.
2. Remove or repurpose `/cart` so there is one clear cart experience.
3. Share cart state between `/` and `/products` using a React context or another intentional state layer.
4. Persist the cart if cross-refresh or cross-route continuity is required.
5. Recalculate totals server-side from trusted product data.
6. Add stock/inventory validation.
7. Add order confirmation email or an admin order view.
8. Add rate limiting and abuse protection to `/api/orders`.
9. Add authentication only when requested and configured.
10. Set `typescript.ignoreBuildErrors` to `false` after fixing all TypeScript issues.
11. Replace remote Unsplash/blob image URLs with managed production assets if reliability or licensing requires it.
12. Either fully adopt Shopify as the runtime catalog or remove unused Shopify helpers.

## Guidance for Future AI Agents

- Treat `lib/products.ts` as the canonical local catalog.
- Treat `/checkout` as the canonical customer order form.
- Treat the floating cart on `/` as the intended cart UX.
- Do not reintroduce a form inside the cart modal unless the user explicitly asks.
- Do not redirect the cart button directly to checkout; the expected sequence is cart modal first, then checkout.
- Preserve the existing French copy and Tunisian delivery context unless a copy change is requested.
- Do not invent authentication, payment, Shopify, or database behavior that is not already wired.
- Before changing storage or integrations, inspect the live configuration and follow the project’s integration-specific instructions.
- Keep UI accessible: preserve labels, alt text, dialog semantics, keyboard-accessible buttons, and clear status messages.
- Avoid localStorage for durable order data. Use the database for orders and a deliberate state solution for cart behavior.

## License and Ownership

This repository is a private Vexora project. No license file is currently included. Treat all brand assets, product content, customer data, and integration credentials as project-owned/private unless explicitly documented otherwise.
