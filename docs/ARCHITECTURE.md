# Architecture

## Stack
Next.js (App Router) + Supabase (Postgres) + Vercel.

## Responsive Shell
Persistent left sidebar on desktop (Properties, Dashboard, Renewal List); collapses to hamburger on mobile. Current section highlighted.

## Key User Action Flow
1. Director opens Dashboard → sees properties sorted by reminder date.
2. A property shows status "due" (reminder date has passed).
3. Director clicks "Renew" → modal opens with current insured value pre-filled.
4. Director enters new insured value + refurbishment cost → updated value auto-calculated.
5. On confirm: system writes a renewal record (old value, new value, date), updates the property's insured value, refurbishment cost, updated value, advances renewal date +1 year, recalculates reminder date, sets status to "renewed".
6. Property moves down the list; dashboard counts update.

## Build Order
1. **Data layer** — Supabase tables, seed data, data-access functions (`lib/data/`).
2. **App logic** — property CRUD, renewal action, status/reminder calculation (server actions).
3. **UI** — dashboard, property list, renewal modal, CSV export.
4. **Smart features (later)** — AI-suggested insured values based on refurbishment scope and market data.

## Why Core Works Without AI
Updated value is a pure sum (insured + refurbishment). Reminder date is a pure date subtraction. Status is a pure date comparison. Renewal advances by exactly one year. No AI needed for any core action.

## Repo Structure
```
src/
  features/
    properties/   (list, form, delete, status badge)
    dashboard/    (summary counts, sorted view)
    renewals/     (renew modal, renewal history, CSV export)
  lib/
    data/         (all DB reads/writes — properties.ts, renewals.ts)
    actions/      (server actions — renewProperty, upsertProperty, deleteProperty)
    ai/           (suggested values — later)
  components/     (shared UI primitives)
  tests/          (beside each feature)
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| `data/properties` | All property DB reads/writes | properties table | 1st |
| `data/renewals` | All renewal record DB reads/writes | renewal_records table | 1st |
| `actions/renewProperty` | Renewal transaction (log + update + advance) | both tables | 2nd |
| `features/properties` | Property list, add/edit form, delete | properties | 3rd |
| `features/dashboard` | Summary + sorted-by-reminder view | properties (read) | 3rd |
| `features/renewals` | Renew modal, history, CSV export | both tables | 3rd |
| `lib/ai/suggested-value` | AI-suggested insured value (later) | properties.ai fields | later |
