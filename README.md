# OrderUp — Multi-Client Restaurant Management Platform

A Next.js 16 multi-client SaaS platform for restaurants, cafes, bakeries, cloud kitchens,
bars/pubs and food trucks. A platform **super-admin** onboards businesses ("clients"),
each with fully isolated data, its own branding, and its own staff logins.

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI primitives)
- **Database**: PostgreSQL (via Docker Compose), Prisma 7 (driver adapters / `@prisma/adapter-pg`)
- **Auth**: Auth.js v5 (Credentials provider, JWT sessions, role-based access)
- **Charts**: Recharts

## Getting started

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install dependencies
npm install

# 3. Apply the schema and seed demo data
npx prisma db push
npm run db:seed

# 4. Start the dev server (fixed port to avoid clashing with other local apps)
npm run dev
```

App runs at http://localhost:3311.

Demo logins (all `password123`):
- **Platform super-admin**: `superadmin@platform.com` → `/admin`, manages all businesses
- **Demo Restaurant** (full seed data): `admin@restaurant.com` (also `manager@`, `cashier@`,
  `waiter@`, `chef@restaurant.com`)
- **Sweet Treats Bakery** (minimal second client, proves data isolation): `admin@sweettreats.com`

For a plain-language walkthrough (with short video clips) instead of this technical
README, see [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## Multi-client architecture

Every operational table (`MenuCategory`, `MenuItem`, `Ingredient`, `RestaurantTable`,
`Customer`, `Order`, `Bill`, `Coupon`, `Staff`, `Shift`) carries a `clientId`, and every
query/mutation is scoped to the logged-in user's client — enforced centrally by
`requireRole()` (`src/lib/rbac.ts`, client-scoped actions) and `requireCurrentClientId()`
(`src/lib/current-client.ts`, client-scoped pages). Platform super-admins (`isSuperAdmin`
on `User`, `clientId: null`) sit above all clients and only manage the `/admin` area —
they never see client operational data directly.

**Onboarding a business**: super-admin → `/admin/clients/new` → business name, business
type (Restaurant / Cafe / Cake-Bakery / Cloud Kitchen / Bar-Pub / Food Truck), optional
logo upload, and the business's first admin login. Logged-in client users see their
business's logo (or name, if no logo) in the sidebar instead of a generic app name.

## Environment variables

See `.env.local` — `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`. Rotate `AUTH_SECRET`
before deploying anywhere beyond local development.

## What's implemented (Phase 1 MVP)

- **Platform admin**: super-admin client CRUD, business-type categorization, logo upload
  (local disk in dev — swap for S3/Cloudinary in production), per-client webhook secrets.
- **Auth & roles**: Admin, Manager, Cashier, Waiter, Chef, Accountant, Delivery, Helper —
  route/action-level access control, scoped to the user's client.
- **Menu management**: categories, items, multiple pricing variants (e.g. Small/Medium/Large),
  availability toggle, seasonal flag, recipe → ingredient links for stock deduction.
- **Table management**: floor layout, live occupancy status, start-order shortcut per table.
- **Order management**: dine-in/takeaway/delivery, cascading item/variant picker, kitchen
  status per item, order status flow (pending → confirmed → preparing → ready → served →
  completed), cancel with automatic ingredient stock restoration.
- **Billing & payments**: GST tax, coupon discounts (percentage/fixed), multiple payment
  methods (cash/card/UPI/wallet), partial payments, printable receipt.
- **Inventory**: ingredient stock levels, reorder thresholds, manual stock adjustments
  (purchase received / waste), low-stock badges, automatic deduction on order.
- **Dashboard**: today's sales, active orders, total customers, pending payments, low
  stock alerts, 7-day revenue chart, 30-day profit summary, top-selling dishes.
- **External orders (Swiggy/Zomato-ready)**: a generic webhook endpoint at
  `/api/webhooks/external-orders/[source]` (source = `swiggy` | `zomato` | `website`)
  that accepts a normalized order payload, matches items to the menu by name/variant,
  creates the order (auto-deducting stock), and is idempotent per `(client, source,
  externalOrderId)`. **This is not wired to Swiggy or Zomato's real APIs** — those are
  only issued after a formal partner/business approval process. Once a client has that
  partner API access, translate their payload shape into `externalOrderSchema` (in
  `src/lib/external-orders.ts`) at the top of the handler; everything downstream (order
  pipeline, kitchen, billing, inventory) already works. Auth is a secret unique to each
  client+source (visible on the client's `/admin/clients/[id]` page, regenerable), sent
  via the `x-webhook-secret` header — this is how the webhook knows which client an
  incoming order belongs to.
- **Staff management**: staff directory (role, phone, base salary, active/inactive),
  attendance (daily clock in/out/mark absent), leave requests (request + approve/reject),
  and monthly payroll (generate for all active staff, edit incentives/overtime/
  deductions, mark paid). Staff can optionally link to a login `User` account (e.g. the
  waiter/chef roles) or exist without one (e.g. a kitchen helper or delivery rider who
  doesn't need app access).
- **Design system**: warm terracotta/amber brand palette (light + dark CSS variables),
  branded split-panel login page, per-client logo/name in the sidebar.

## Not yet built (later phases, per the original roadmap)

Kitchen Display System, reservations, customer loyalty/CRM, purchase orders & supplier
management, QR self-ordering, multi-branch support (one client, several physical
locations), email receipts, AI forecasting, real Swiggy/Zomato/payment-gateway
integration (pending each client's partner API access — see above), and a light/dark
theme toggle (dark-mode CSS variables exist in `globals.css` but no `next-themes`
provider is wired up yet, so the app currently always renders in light mode).

## Notes

- Dev server is pinned to port **3311** (`next dev -p 3311`) to avoid ambiguity with other
  local projects; if you change it, update `NEXTAUTH_URL` in `.env.local` to match.
- Prisma uses the new driver-adapter client (`@prisma/adapter-pg`) — the generated client
  lives in `src/generated/prisma` (gitignored) and requires `npx prisma generate` after
  schema changes.
- Client logos are saved to `public/uploads/logos/` on local disk — fine for one dev
  instance, but won't survive across multiple deployed instances/containers. Swap
  `src/lib/logo-upload.ts` for S3/Cloudinary before deploying beyond a single server.
- `src/auth.config.ts` (edge-safe: no Prisma/bcrypt) is shared by both `middleware.ts`
  and the full `src/auth.ts`. If you ever add fields to the session, add the jwt/session
  copying logic in `auth.config.ts`, not `auth.ts` — otherwise middleware's separate
  `NextAuth` instance won't see them (this caused a real login-redirect-loop bug once).
