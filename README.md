# Fire Insurance Renewal Tracker

Manage property values, reminders, renewal history and renewal-list exports in private team workspaces. Sign in using a secure email link, then create a team or accept an invitation.

## Working features

- Add, edit and delete properties, with all changes stored in Supabase.
- Calculate updated value and the 30-day reminder in the database.
- Renew an item atomically: log old/new values, save refurbishment costs, advance one year and recalculate the reminder. Stale or double submissions cannot create a second renewal.
- Read renewal history on each property's detail page.
- View dashboard status counts and filter properties by urgency.
- Download the complete renewal schedule as CSV or print it in landscape format.

Owners manage membership, editors manage properties and renewals, and viewers read and export. Team portfolios are isolated by Supabase RLS and server-side scoping. Invitation links are shared manually and restricted to the invited email; sign-in emails require configured email delivery. Amounts use a single consistent policy currency, without conversion. No AI or payment services are used. See `docs/TEAMS.md` for team permissions and setup.

## Database setup

Connect this Vercel project to Supabase, then configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Development, Preview and Production. No service-role key is needed by the app.

Apply the migrations in order exactly once through the project's SQL editor or the Supabase CLI:

1. `supabase/migrations/0001_init.sql` creates the tables, anonymous demo RLS policies, and five dated demo properties.
2. `supabase/migrations/0002_atomic_renewals.sql` adds calculated-field triggers, revision checking and the transactional renewal function.
3. `supabase/migrations/0003_private_teams.sql` adds private teams, roles and invitations, removes anonymous access, and preserves old shared rows as an inaccessible unassigned archive.

Set `NEXT_PUBLIC_APP_URL` to your application URL and configure Supabase Auth Site URL and the `/auth/callback` redirect allowlist. Keep email confirmation enabled. Configure custom SMTP before inviting ordinary users: Supabase's default sender is restricted to Supabase organization members. New teams start empty; owners/editors can explicitly add their own fictional sample properties.

Do not rerun the initial seed migration on an existing database. The second migration preserves existing declared values and reconciles derived columns. Renewal dates advance from the existing cycle date, not from the processing date; a significantly overdue policy may therefore remain lapsed after one renewal. Leap-day renewals advance to February 28 in a non-leap year.

## Local development and verification

```sh
pnpm install
vercel link --project fire-insurance-renewal
vercel env pull .env.local
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:migrations
pnpm test:db
pnpm build
# In a second terminal, with the app running:
pnpm test:e2e
```

Live tests require a signed-in test owner/editor: set `TEST_ACCESS_TOKEN` and `TEST_TEAM_ID`; E2E also needs `TEST_STORAGE_STATE` pointing to a private Playwright cookie-state file. Tests create only disposable properties and remove them afterward. Keep tokens and cookie files private; `.auth/` and `*.storage-state.json` are ignored. The isolated migration tests cover tenant isolation and owner/editor/viewer access without emailing users or bypassing production RLS. Never commit `.env.local`.

Deploy only by committing and pushing to `main`; Vercel deploys the GitHub commit. Do not deploy local files with the Vercel CLI.

The original plan, security boundaries and later sprints are in `/docs`.

## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL and Vercel. Package manager: pnpm. The homepage and all list/detail routes fetch uncached database values. Browser components call named server actions; only the data layer talks to Supabase.

## Original shared-demo verification — 2 October 2026

Both migrations are applied to the hosted Supabase project. The public URL and public publishable key (under the app's `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable) are configured in all three Vercel environments. The GitHub repository is connected for deployment from `main`.

The verification below predates the private-team upgrade. Migration 0003 and authenticated live tests must be verified separately; passing the old anonymous flow does not establish team isolation.

The browser success scenario passed against this database: add 8M + 300K, edit, renew at 9M + 200K, verify the 9.2M value and advanced dates after refresh, inspect old/new history, verify dashboard counts and the Due filter, download CSV, inspect print layout, use mobile navigation, and delete the disposable property with history cleanup. Database integration checks also passed for leap years, invalid amounts, stale submissions, and simultaneous renewals.
