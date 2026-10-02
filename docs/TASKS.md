# Tasks

## Sprint 1 — Core Engine: Property CRUD + Renewal Action
**Goal:** The Director can add, edit, delete properties and process a renewal end-to-end against the database.
- [ ] Create Supabase tables (properties, renewal_records) + seed 5 demo properties.
- [ ] Build `lib/data/properties.ts` — all CRUD functions.
- [ ] Build `lib/data/renewals.ts` — insert renewal record, update property.
- [ ] Build server action `renewProperty` — logs old→new value, advances renewal date +1 year, recalculates reminder_date + updated_value, sets status.
- [ ] Build server actions `upsertProperty`, `deleteProperty`.
- [ ] Property list page — table with all fields, sorted by reminder date.
- [ ] Add/edit property form — insured value + refurbishment cost → updated value auto-calc; renewal date → reminder date auto-calc.
- [ ] Renew button per property → modal → confirm → calls `renewProperty`.
- [ ] Status badge (upcoming / due / renewed / lapsed) computed on read.
- [ ] Delete property with confirm.
- [ ] Left sidebar nav (Properties, Dashboard, Renewal List) — responsive.

**Definition of Done:** Director adds a property, sets insured value 10M + refurbishment 500K, sees updated value 10.5M and reminder date auto-set. Clicks Renew, enters 11M, sees renewal record logged, renewal date advanced +1 year, status changes to renewed. All persisted — survives refresh.

## Sprint 2 — Dashboard + Renewal List Export
**Goal:** Dashboard summary + the printable/CSV renewal list that replaces the Excel sheet.
- [ ] Dashboard page — counts (upcoming / due / renewed / lapsed), properties sorted by urgency.
- [ ] Renewal list page — all properties with values, renewal dates, status; CSV export button; print-friendly layout.
- [ ] Empty state: "No properties yet — add your first property."
- [ ] Loading skeletons on all pages.
- [ ] Error states with retry.

**Definition of Done:** Dashboard shows accurate counts. CSV export downloads a file with all properties, values, and renewal dates. Print layout is clean and readable. ← **v1 functional milestone**

## Sprint 3 — Lock It Down (Auth + RLS)
**Goal:** Only the Director can see and edit data.
- [ ] Supabase Auth — login/signup page.
- [ ] Replace permissive RLS with `auth.uid() = user_id` on both tables.
- [ ] Redirect anonymous users to login (app no longer viewable without auth).
- [ ] Set `user_id` on all new properties/renewal records from session.
- [ ] Migrate seed data to a demo user or remove it.

**Definition of Done:** Anonymous user redirected to login. Logged-in Director sees only their properties. Another user cannot read or write the Director's data.

## Sprint 4 — AI-Suggested Insured Values (later)
- [ ] `lib/ai/suggested-value.ts` — reads property + refurbishment scope, returns suggestion with confidence.
- [ ] "Suggest value" button on property edit form.
- [ ] Suggestion stored with source/confidence/review_status; Director accepts or rejects.
- [ ] Audit log for suggestion acceptance.

## Gantt
```
S1: ████████ Core CRUD + Renewal
S2: ████     Dashboard + Export (v1 functional)
S3: ████     Auth + RLS Lock-down
S4: ████     AI Suggestions (later)
```
