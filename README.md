# Fire Insurance Renewal Tracker

Manage property values, reminders, renewal history and renewal-list exports. The homepage is the working demo, with no login required in v1.

## Working features

- Add, edit and delete properties, with all changes stored in Supabase.
- Calculate updated value and the 30-day reminder in the database.
- Renew an item atomically: log old/new values, save refurbishment costs, advance one year and recalculate the reminder. Stale or double submissions cannot create a second renewal.
- Read renewal history on each property's detail page.
- View dashboard status counts and filter properties by urgency.
- Download the complete renewal schedule as CSV or print it in landscape format.

The demo workspace is shared and editable by anonymous visitors. Use sample data only until the documented authentication and owner-scoped RLS sprint is completed. Amounts are recorded in a single consistent policy currency, without conversion. No emails, AI services or payment services are used.

## Database setup

Connect this Vercel project to Supabase, then configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Development, Preview and Production. No service-role key is needed by the app.

Apply the migrations in order exactly once through the project's SQL editor or the Supabase CLI:

1. `supabase/migrations/0001_init.sql` creates the tables, anonymous demo RLS policies, and five dated demo properties.
2. `supabase/migrations/0002_atomic_renewals.sql` adds calculated-field triggers, revision checking and the transactional renewal function.

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
pnpm test:db
pnpm build
```

The database test creates only a disposable `Integration Test` property and removes it after verifying CRUD, computed values, atomic renewal history, invalid inputs and concurrent submissions. It does not change demo or real properties. If keys are only configured for Production, pull that environment explicitly for verification. Never commit `.env.local`.

Deploy only by committing and pushing to `main`; Vercel deploys the GitHub commit. Do not deploy local files with the Vercel CLI.

The original plan, security boundaries and later sprints are in `/docs`.

---

## Stack reference

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 (CSS-first, no config file) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Package manager | Bun |
| Deploy | Vercel |

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in your Supabase keys
bun dev
```

Open http://localhost:3000. Edit `app/page.tsx` to start building.

## Provisioning a new project

Use the `/new-vibe-project <name>` skill (see `claude-dotfiles` repo) which:
1. Clones this template and renames it
2. Creates a new GitHub repo and pushes
3. Creates a Supabase project and injects URL + anon key
4. Creates a Vercel project linked to the GitHub repo
5. Triggers first deploy and returns the preview URL

## Working with AI

See [CLAUDE.md](CLAUDE.md) for conventions. This repo is pre-wired for gstack — start with `/office-hours`.

## Switching to Neon

If you need Postgres without Supabase (e.g. prefer Drizzle ORM + Clerk for auth), a `vibe-stack-neon` variant is planned. For now: fork this and swap `@supabase/ssr` for `drizzle-orm` + `@neondatabase/serverless`, add Clerk or NextAuth.


## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL and Vercel. Package manager: pnpm. The homepage and all list/detail routes fetch uncached database values. Browser components call named server actions; only the data layer talks to Supabase.
