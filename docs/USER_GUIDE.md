# OrderUp User Guide

This is a plain-language walkthrough of how to use the platform. For installing and
running the app itself, see the main [README.md](../README.md).

## Video tutorials

Short screen-recorded clips (silent, with on-screen captions), one per workflow:

| Clip | Covers |
|---|---|
| [Onboarding a business](videos/01-onboarding-a-business.webm) | Super admin creates a new business with a business type and admin login |
| [Menu & tables setup](videos/02-menu-and-tables-setup.webm) | Business admin adds a menu category, an item, and a table |
| [Taking an order](videos/03-taking-an-order.webm) | Starting a dine-in order, adding items, moving it through kitchen status |
| [Billing & receipt](videos/04-billing-and-receipt.webm) | Recording a payment and viewing the printable receipt |
| [Staff, attendance & payroll](videos/05-staff-attendance-payroll.webm) | Adding staff, clocking in, generating and marking payroll paid |

`.webm` files play in Chrome, Firefox, Edge, and VLC — if your player of choice doesn't
support webm, most OSes can open it via a free player or browser tab.

## 1. Who uses this platform

There are two kinds of users:

| User | What they do | Where they log in |
|---|---|---|
| **Platform Super Admin** | Onboards businesses (restaurants, cafes, bakeries, etc.), suspends/reactivates them, manages logos and webhook secrets | `/admin` |
| **Business staff** (Admin, Manager, Cashier, Waiter, Chef, Accountant, Delivery, Helper) | Run day-to-day operations for **one specific business** — menu, orders, billing, inventory, staff | `/dashboard` |

Everyone logs in at the same page (`/login`) with their email and password — the system
automatically sends super admins to the platform admin area and everyone else to their
business's dashboard.

## 2. Onboarding a new business (Super Admin)

🎥 [Watch: Onboarding a business](videos/01-onboarding-a-business.webm)

1. Log in as the super admin.
2. Go to **Businesses** → **New Business**.
3. Fill in:
   - **Business name** — e.g. "Blue Ribbon Bakery"
   - **Business type** — Restaurant, Cafe, Cake/Bakery Shop, Cloud Kitchen, Bar/Pub, or Food Truck
   - **Logo** (optional) — PNG, JPEG, WebP, or SVG, under 2MB. If you skip this, the
     business's name is shown instead once its staff log in.
   - **Initial admin login** — the name, email, and a temporary password for that
     business's first user. Share these credentials with the business owner; they can
     start using the system immediately and should change the password once real user
     management is added.
4. Click **Create business**. You'll land on the business's detail page, where you can:
   - Edit its name, type, or logo later
   - Suspend it (its staff immediately lose access) or reactivate it
   - View and regenerate its external-order webhook secrets (see §8)

Every business's data — menu, tables, orders, staff, everything — is completely separate
from every other business. Nothing is shared between them.

## 3. First-time setup (Business Admin/Manager)

🎥 [Watch: Menu & tables setup](videos/02-menu-and-tables-setup.webm)

Once a business is created, its admin should log in and set up, roughly in this order:

1. **Menu** — Add categories (e.g. Starters, Main Course, Beverages, or Cakes), then add
   items under each category with one or more pricing variants (e.g. Small/Medium/Large,
   or Half kg/1 kg). Mark items unavailable when they're 86'd for the day instead of
   deleting them.
2. **Tables** (dine-in businesses) — Add each table with a name (e.g. T1) and seating
   capacity, grouped by floor.
3. **Inventory** — Add ingredients you track stock for, with a unit (kg/g/pcs/etc.), a
   reorder level, and a cost per unit. Optionally link ingredients to a menu item as a
   "recipe" so stock deducts automatically when that item is ordered.
4. **Staff** — Add your team: name, phone, role, and monthly base salary. A staff member
   can optionally be linked to a login account (for roles that need to use the app, like
   Waiter or Chef) or left without one (e.g. a kitchen helper or delivery rider who
   doesn't need to log in).

## 4. Taking an order

🎥 [Watch: Taking an order](videos/03-taking-an-order.webm)

1. From **Tables**, click **Start Order** on any available table (for dine-in), or go to
   **Orders** → **New Order** and choose Takeaway or Delivery.
2. On the order page, use **Add item** to pick a category, item, variant, and quantity.
   Add as many items as needed — the order total (with tax) updates live.
3. The kitchen sees each item's status (Pending → Cooking → Ready → Served) and can
   update it from the order page.
4. Move the order through its stages with the buttons at the top: Confirmed →
   Preparing → Ready → Served. You can cancel at any point before completion — this
   automatically returns any deducted ingredient stock.

## 5. Billing a customer

🎥 [Watch: Billing & receipt](videos/04-billing-and-receipt.webm)

1. On an order's page, use the **Billing & payment** panel (visible once the order has
   items).
2. Optionally enter a coupon code for a discount.
3. Choose a payment method (Cash, Card, UPI, Wallet) and enter the amount received.
   Partial payments are supported — record one payment now and another later; the order
   only completes once the full amount is collected.
4. Click **Record payment**. Once fully paid, the order is marked Completed and (for
   dine-in) the table is freed for cleaning.
5. Click **Receipt** on the order page any time to view or print a customer receipt.

All generated bills also appear under **Billing**, with tax and discount breakdowns.

## 6. Managing inventory day to day

- **Inventory** shows every ingredient's current stock against its reorder level —
  anything at or below reorder level is flagged "Low stock" (and shows up on the
  Dashboard too).
- Stock deducts automatically whenever an order includes an item with a recipe attached.
- Use **Adjust stock** on any ingredient to record a new purchase delivery ("Add stock")
  or write off spoilage/waste ("Remove stock").

## 7. Staff, attendance, leave, and payroll

🎥 [Watch: Staff, attendance & payroll](videos/05-staff-attendance-payroll.webm)

- **Staff** page: add/edit staff, toggle active/inactive, jump into a staff member's
  profile.
- A staff profile shows their attendance history, leave requests, and payroll history,
  plus a form to request new leave.
- **Staff → Attendance**: a daily roster to clock people in/out or mark them absent.
- **Staff → Payroll**: pick a month, click **Generate payroll for this month** to create
  a draft line for every active staff member (base salary pre-filled). Adjust incentives,
  overtime, or deductions per person, then **Mark paid** once processed.

## 8. Online orders from Swiggy/Zomato

Real Swiggy/Zomato integration requires becoming an approved partner with them first —
that's a business process outside this app, not something turned on with a setting. Once
your business has that partner access, a developer can wire the real payload format in;
until then, this exists so the plumbing (kitchen, billing, stock) is ready on day one.

Each business has its own secret per source, visible to the super admin on that
business's detail page (`/admin/clients/[id]`) under **External order webhook secrets**.
An external order posted to `/api/webhooks/external-orders/swiggy` (or `zomato`/`website`)
with the matching secret in the `x-webhook-secret` header creates an order automatically,
matched to your menu by item name.

## 9. Roles cheat sheet

| Role | Can do |
|---|---|
| **Admin** | Everything for their business |
| **Manager** | Everything except business-level settings a super admin controls |
| **Cashier** | Orders, tables, billing |
| **Waiter** | Orders, tables (start/view, add items) |
| **Chef** | Orders (kitchen status only) |
| **Accountant** | Inventory, billing (read-heavy) |
| **Delivery / Helper** | Staff records only — no login required, no dashboard access |

## 10. Tips

- If an item runs out mid-shift, toggle it "unavailable" on the Menu page instead of
  deleting it — you keep its sales history and recipe links.
- The Dashboard's "Pending payments" tile is your at-a-glance list of orders that still
  owe money — useful at shift handover.
- "Profit summary" on the Dashboard only counts orders that have actually been billed, so
  it won't look wrong just because a few orders are still open.
