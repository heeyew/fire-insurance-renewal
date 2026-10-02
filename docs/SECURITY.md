# Security

## Current team upgrade

The user-requested team upgrade supersedes the historical v1 permission model below. Apply migration 0003: anonymous access is removed; verified Supabase users see only teams they belong to. Owners manage invitations and membership, editors mutate properties and renewals, and viewers only read/export. Existing unassigned shared-demo rows remain archived; no first user inherits them. Server actions use the user's cookie session and public key, never a service-role key. See `TEAMS.md` for email verification, SMTP setup, invitations, and isolation tests.

## Secret Handling
- The application uses the public Supabase key and the signed-in user's cookie session. No service-role key is configured or used.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the application URL are public configuration.
- No other secrets in frontend code or environment variables prefixed `NEXT_PUBLIC_`.

## Historical v1 Permission Model
- **v1 (demo-first):** RLS enabled but permissive — anonymous read/write so the app renders without login. Seed data is visible and editable.
- **Lock-down sprint:** Replace permissive policies with owner-scoped: `auth.uid() = user_id` on all tables. Only the Director (logged in) sees and edits their properties.
- Agent (later) inherits the Director's permissions — never runs with service key for user-scoped actions.

## Approved-Tools Rule
- Only named, server-side functions (`renewProperty`, `upsertProperty`, `deleteProperty`, `suggest_insured_value`) may mutate data.
- No generic `run_any` or `send_any` tool exposed to the client or agent.
- Every data mutation goes through `lib/data/` — UI never writes to Supabase directly.

## Audit Principle
- Every renewal, property create/edit/delete, and (later) AI suggestion acceptance is a meaningful action that must be traceable. v1 logs renewal records (the renewal_records table). Later: a dedicated audit_logs table for all mutations.
