# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Vite dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Run tests once (Vitest)
pnpm test:watch   # Vitest in watch mode
```

To run a single test file: `pnpm vitest run src/path/to/file.test.ts`

## Environment Variables

The app requires these env vars (stored in `.env.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui (Radix), React Router v6, TanStack Query v5, Supabase (auth + Postgres + PostGIS), React Hook Form + Zod, Recharts.

Path alias: `@/` → `src/`

### Two distinct user ecosystems

The app serves two separate user types with different UIs and routes:

**Cliente (customer):** Browses barbershops, books appointments, manages their profile.
- Routes: `/descobrir`, `/agendar`, `/meus-agendamentos`, `/perfil/cliente`, `/favoritos`, `/checkout`, `/sucesso`
- Layout: `AppLayout` (top header + bottom mobile nav)

**Barbeiro (barber business):** B2B workspace for managing a barbershop.
- Routes: `/dashboard`, `/agendamentos`, `/servicos`, `/financeiro`, `/equipe`, `/produtos`, `/dashboard/configuracoes`
- Layout: `BarberLayout` (fixed sidebar on desktop, slide-over on mobile)
- Special standalone views: `/onboarding` (shop setup wizard), `/bancada` (workstation queue screen)

### Auth & RBAC (`src/context/AuthContext.tsx`)

`AuthContext` exposes `currentUser`, `role`, `isAuthenticated`, `isLoading`. Role is either `"cliente"` or `"barbeiro"`, resolved from the `profiles` table on Supabase. Barbers without a `barbearia_id` who are `is_admin` get redirected to `/onboarding`.

`ProtectedRoute` in `App.tsx` enforces both role-level and module-level access:

| Module      | Who can access                         |
|-------------|----------------------------------------|
| `finance`   | Owner only (`is_admin`)                |
| `team`      | Owner or `gerente`                     |
| `settings`  | Owner or `gerente`                     |
| `products`  | Owner, `gerente`, or `secretária`      |

`job_title` on the profile determines staff role (gerente / secretária / barbeiro).

### Data layer

- **Supabase client:** `src/lib/supabase.ts` — single shared instance using PKCE flow, session key `barberpro-auth-v1`.
- **React Query:** `src/lib/queryClient.ts` — `staleTime: 5 min`, `gcTime: 10 min`, `retry: 1`, `refetchOnWindowFocus: false`. Mutations have `retry: 0` intentionally to prevent duplicate bookings/charges.
- **Sensitive operations** (services CRUD, team management, shop settings) go through internal REST API routes under `/api/...` (fetched with the user's JWT), not directly via the Supabase client. The client helpers are in `src/lib/services-client.ts`, `src/lib/team-client.ts`, `src/lib/shop-client.ts`.
- Direct Supabase queries are used for read-heavy, lower-risk data (appointments list, dashboard metrics, booked days).

### Database Schema

#### Tables

**`appointments`** — Core booking record.
- `id`, `appointment_date` (ISO string), `barbearia_id`, `client_id` → `profiles`, `professional_id` → `profiles`, `service_id` → `services`, `service_name` (snapshot), `status` (`"agendado"` | `"concluido"` | `"cancelado"`), `total_price`, `commission_value`, `commission_rate_snapshot`, `payment_method`

**`barbearias`** — Barbershop entity.
- `id`, `name`, `slug`, `about`, `neighborhood`, `street`, `address_number`, `complement`, `city`, `state`, `zip_code`, `location` (PostGIS geography), `cover_image`, `instagram_url`, `whatsapp`, `working_hours` (JSON: `{ "0": { open, close, closed }, ... }`), `payment_methods` (string[]), `categories` (string[]), `rating`, `review_count`, `owner_id`, `status`

**`profiles`** — Unified user profile for both roles.
- `id` (= auth.users.id), `name`, `full_name`, `email`, `phone`, `telefone`, `cpf`, `document`, `role` (`"cliente"` | `"barbeiro"`), `barbearia_id`, `is_admin`, `job_title`, `provides_services`, `commission_rate`, `avatar_url`, `instagram`, `status`

**`services`** — Master service catalog per barbershop.
- `id`, `barbearia_id`, `name`, `description`, `price`, `duration_min`, `is_active`, `promo_days` (number[]), `promo_percentage`

**`barber_services`** — Per-barber overrides on master services (pivot table).
- `id`, `barbearia_id`, `professional_id`, `service_id`, `is_active`, `price` (custom, nullable), `duration_minutes` (custom, nullable), `custom_name`

**`barber_work_hours`** — Per-barber weekly schedule.
- `id`, `barbearia_id`, `professional_id`, `day_of_week` (0–6), `start_time`, `end_time`, `is_closed`

**`invites`** — Pending team invitations.
- `id`, `barbearia_id`, `email`, `job_title`, `provides_services`, `role`, `status` (`"pendente"` | `"aceito"`), `expires_at`

**`products`** — Inventory per barbershop.
- `id`, `barbearia_id`, `name`, `category`, `price`, `stock`, `low_stock_threshold`

**`sales`** — Product sale records.
- `id`, `barbearia_id`, `client_id`, `product_id`, `payment_method`

**`shop_reviews`** — Client reviews for barbershops.
- `id`, `shop_id` → `barbearias`, `client_id`, `rating`, `comment`

**`user_favorites`** — Client saved items.
- `id`, `user_id`, `target_id`, `type`

#### Views

**`booking_engine_view`** — Joins `services` + `barber_services` + `profiles` to expose resolved price/duration per barber+service combo. Used by the client-facing booking flow. Key fields: `professional_id`, `professional_name`, `service_id`, `service_name`, `base_price`, `custom_price`, `resolved_price`, `base_duration_min`, `custom_duration`, `resolved_duration`, `promo_days`, `promo_percentage`.

#### RPC Functions

- `finalizar_setup_barbearia(...)` — Atomic onboarding: creates the `barbearias` row, first service, and sets owner's `barbearia_id`. Called by `/onboarding`.
- `setup_barber_owner(user_id)` — Marks a user as barber admin.
- `get_nearby_barbershops(client_lat, client_lng, radius_km)` — PostGIS geospatial search; returns shops with `distancia_metros` and `starting_price`.
- `delete_user_data_lgpd()` — LGPD-compliant user data deletion.
- `auth_minha_barbearia()` — Returns the calling user's `barbearia_id`.

### Component organization

```
src/components/
  ui/              # shadcn/ui primitives (do not modify directly)
  layout/          # AppLayout, BarberLayout, MobileNav, DesktopNav
  booking/         # Booking flow (calendar, confirm modal, auth guard)
  checkout/        # Payment selector, online payment form, summary card
  dashboard/       # KPIs, revenue chart, occupancy ring, client risk list
  agenda/          # Day view for the barber schedule
  financial/       # Wallet summary, transaction table, payout history, donut chart
  onboarding/      # Multi-step wizard (identity → services → team → success)
  workstation/     # Live queue card, appointment queue, delay modal, quick actions
  profile/         # Barber profile editor and client profile components
  discovery/       # Client-facing discovery components
  team/            # InviteForm, MemberCard, BarberServicesModal, BarberWorkHoursModal
```

### Routing entry point

`src/App.tsx` defines all routes. `HomeRedirect` decides where to send a user based on auth state and role. All routes use `React.lazy` for code splitting with a `Suspense` fallback spinner.

### Design system notes

- Dark-first UI: primary background is `#0a0c12`, accent is `hsl(var(--primary))`.
- Rounded corners use `rounded-[2rem]` or `rounded-3xl` throughout — avoid mixing standard Tailwind radii.
- Typography pattern: labels are `text-[10px] font-black uppercase tracking-widest`, headings are `font-black uppercase italic tracking-tighter`.
- Page components render bare `<div>` containers (no wrapping layout tag) — `BarberLayout` injects them via `<Outlet />`.
