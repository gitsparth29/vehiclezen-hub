
# Fleet Management SaaS — Build Plan

This is a large build (12 modules, full CRUD, charts, exports, realtime). Attempting it all in a single turn would produce shallow, buggy code. I'll ship it in **4 phases**, each independently usable. Phase 1 lays the foundation that every other phase depends on.

A few notes about the stack — the project already has these in place, so I'll use them instead of swapping:
- **Routing**: TanStack Router (not React Router DOM) — file-based, type-safe, already wired.
- **Backend**: Lovable Cloud (Supabase under the hood) — already enabled. Tables `tenants`, `profiles`, `user_roles` are live with multi-tenant RLS.
- **State**: TanStack Query is already wired and is the idiomatic choice here. I'll add Zustand only if we hit genuine client-state needs (sidebar collapsed state, theme) that don't belong in URL/server state.

---

## Phase 1 — Foundation (this turn)

The slice that unblocks every module.

**Auth surface**
- `/auth` page: sign up + sign in (email/password + Google OAuth via Lovable broker), Zod validation, toast feedback.
- `_authenticated/route.tsx` layout gate (integration-managed pattern, `ssr: false`, redirects to `/auth`).
- Root `onAuthStateChange` listener for cache invalidation.
- Sign-out hygiene helper.

**App shell**
- Collapsible shadcn sidebar with all 13 menu items (Dashboard, Vehicles, Documents, Services, Maintenance, Drivers, Fuel Logs, Rentals, Trip Logs, Alerts, Reports, Settings, Logout).
- Active route highlighting, icon-only collapsed mode, mobile drawer.
- Top header with breadcrumb, theme toggle (dark mode), user menu.
- Dark mode via `class` strategy on `<html>` + tokens already in `styles.css`.

**Database schema** (one migration, all domain tables with RLS scoped to `tenant_id`):
- `vehicles`, `drivers`, `documents`, `services`, `maintenance`, `fuel_logs`, `rentals`, `trip_logs`, `alerts`
- Enums for vehicle status, fuel type, maintenance priority/status, rental status, alert severity, license categories
- FK relationships (driver ↔ vehicle, documents → vehicle, etc.) with `ON DELETE` rules
- `tenant_id` on every row, RLS via `is_tenant_member()`
- Storage bucket `documents` (private) with RLS for document file uploads
- `updated_at` triggers

**Routes scaffolded under `_authenticated/`** (each renders a styled "empty state" placeholder ready to be filled in Phase 2+):
- `/app/dashboard`, `/app/vehicles`, `/app/drivers`, `/app/documents`, `/app/services`, `/app/maintenance`, `/app/fuel-logs`, `/app/rentals`, `/app/trip-logs`, `/app/alerts`, `/app/reports`, `/app/settings`

**Dashboard (Phase 1 version)** — wired to real data immediately so the foundation is provable:
- 5 KPI cards (Fleet Health %, Fit, Service Due, Expired Docs, In Maintenance) — computed from `vehicles` + `documents`
- Circular Fleet Health gauge (Recharts RadialBar)
- Cost Overview bar chart (last 6 months from `services` + `fuel_logs`)
- Fleet Status donut (Recharts Pie)
- Empty state when no vehicles exist, with "Add your first vehicle" CTA → /app/vehicles

**Landing page changes**
- "Sign in" / "Get started" buttons in nav → `/auth`
- "Go to dashboard" if already signed in

---

## Phase 2 — Core CRUD (next turn)

Vehicles, Drivers, Documents modules end-to-end:
- List tables (search, filters, pagination, sort)
- Create/Edit dialogs with Zod schemas
- Detail drawer (View action)
- Delete with confirm
- Document upload to Storage with preview/download
- Driver ↔ Vehicle assignment
- Status chips, expiry warnings
- Reusable `<DataTable>`, `<EntityFormDialog>`, `<StatusBadge>` components

## Phase 3 — Operations modules

Services, Maintenance (table + Kanban), Fuel Logs (+ monthly chart, MPG calc), Rentals (auto total), Trip Logs (auto duration/avg speed), Alerts feed.

## Phase 4 — Reports, Settings, Exports, Realtime

- Reports page (6 charts + driver performance table)
- Settings (Company Profile, Users/roles invite flow, Preferences)
- CSV / Excel / PDF export utilities (papaparse, xlsx, jspdf)
- Supabase Realtime subscriptions for alerts/document expiry
- Scheduled job (`pg_cron` + server route) to generate alerts daily

---

## Technical details (Phase 1)

**File additions**
```
src/routes/auth.tsx
src/routes/_authenticated/route.tsx                  (integration-managed)
src/routes/_authenticated/app.tsx                    (shell layout: sidebar + header + <Outlet/>)
src/routes/_authenticated/app.dashboard.tsx
src/routes/_authenticated/app.vehicles.tsx           (placeholder)
src/routes/_authenticated/app.drivers.tsx            (placeholder)
src/routes/_authenticated/app.documents.tsx          (placeholder)
src/routes/_authenticated/app.services.tsx           (placeholder)
src/routes/_authenticated/app.maintenance.tsx        (placeholder)
src/routes/_authenticated/app.fuel-logs.tsx          (placeholder)
src/routes/_authenticated/app.rentals.tsx            (placeholder)
src/routes/_authenticated/app.trip-logs.tsx          (placeholder)
src/routes/_authenticated/app.alerts.tsx             (placeholder)
src/routes/_authenticated/app.reports.tsx            (placeholder)
src/routes/_authenticated/app.settings.tsx           (placeholder)

src/components/app/AppSidebar.tsx
src/components/app/AppHeader.tsx
src/components/app/ThemeToggle.tsx
src/components/app/UserMenu.tsx
src/components/dashboard/KpiCard.tsx
src/components/dashboard/HealthGauge.tsx
src/components/dashboard/CostBarChart.tsx
src/components/dashboard/FleetStatusDonut.tsx

src/lib/dashboard.functions.ts     (server fns: getDashboardSummary)
src/lib/auth.ts                    (signOut hygiene helper)
src/hooks/use-theme.ts
src/stores/ui-store.ts             (Zustand — sidebar collapsed, theme)
```

**Packages to add**: `recharts`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner` (toasts), `zustand`, `date-fns`, `next-themes`.

**Migration** — one transaction creating 9 tables + enums + indexes + RLS + storage bucket policies. All `tenant_id` columns NOT NULL with FK to `tenants(id) ON DELETE CASCADE`. Insert policies check `tenant_id = current_tenant_id()`.

**Linter fix from prior migration** — also revokes `EXECUTE … FROM PUBLIC, anon` on the 4 SECURITY DEFINER helper functions and grants only to `authenticated` (closes the 8 lint warnings from the earlier migration).

**Out of scope for Phase 1** (deferred to later phases): CRUD forms, file uploads, exports, realtime subscriptions, cron jobs, role-based invites.

---

Reply **"go"** to start Phase 1, or tell me to adjust scope (e.g. "skip auth, I want to see all 12 module pages first with mock data" or "build everything in vehicles module first").
