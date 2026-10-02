# Security

## Secret Handling
- Supabase service key used only in server actions / server-side data layer — never in client components.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only keys exposed to the browser.
- No other secrets in frontend code or environment variables prefixed `NEXT_PUBLIC_`.

## Permission Model
- **v1 (demo-first):** RLS enabled but permissive — anonymous read/write so the app renders without login. Seed data is visible and editable.
- **Lock-down sprint:** Replace permissive policies with owner-scoped: `auth.uid() = user_id` on all tables. Only the Director (logged in) sees and edits their properties.
- Agent (later) inherits the Director's permissions — never runs with service key for user-scoped actions.

## Approved-Tools Rule
- Only named, server-side functions (`renewProperty`, `upsertProperty`, `deleteProperty`, `suggest_insured_value`) may mutate data.
- No generic `run_any` or `send_any` tool exposed to the client or agent.
- Every data mutation goes through `lib/data/` — UI never writes to Supabase directly.

## Audit Principle
- Every renewal, property create/edit/delete, and (later) AI suggestion acceptance is a meaningful action that must be traceable. v1 logs renewal records (the renewal_records table). Later: a dedicated audit_logs table for all mutations.
