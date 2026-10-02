# Private teams

The team upgrade replaces the public shared demo with authenticated, private portfolios. Supabase cookie sessions use passwordless email links. No service-role credentials are used by the application.

Owners create and switch teams, invite editors or viewers, revoke pending invitations, and change or remove member access. Editors manage properties and renewals; viewers can read history and export but cannot mutate. The owner cannot be removed or downgraded. Multiple teams per user are supported.

Invitation links are created on request and shared manually by the owner; the application does not email invitations. Each link is bound to the specified verified email, expires in seven days, and is consumed once. Reissuing an invitation revokes the previous token. Sign in with the invited email before accepting.

## Migration and deployment

Apply `0003_private_teams.sql` after 0001 and 0002, then deploy the team application from Git. Existing shared-demo rows remain unassigned and inaccessible to normal app users. A first signup never inherits them. A new team starts empty; its owner/editor can explicitly add fictional sample properties only while it is empty.

Keep Supabase email verification enabled. Configure a custom SMTP provider for ordinary team users: Supabase's default mail service restricts recipients to the Supabase organization and has restrictive rate limits. Set Auth Site URL to the production application and allow exact `/auth/complete` and legacy `/auth/callback` redirects. Development sign-in requires a matching localhost callback allowlist entry and local `NEXT_PUBLIC_APP_URL`.

Email requests use Supabase's supported implicit magic-link flow, with no browser-bound PKCE challenge. `/auth/complete` reads credentials from the URL fragment, immediately removes the fragment from browser history, verifies the session with Supabase, and persists SSR session cookies. `/auth/finish` validates the user on the server before opening the workspace or the pending invitation. Protected reads and RLS still require a verified user. This allows Gmail to open the link in a different browser. The legacy PKCE callback remains for already-sent links. Callback responses disable caching and referrer transmission; tokens are never placed in query parameters or logs.

The sign-in form disables repeat submissions while pending and during the 60-second resend window. Provider cooldown, hourly email limit, unauthorized recipient and invalid-link failures have distinct messages. Neither this UX nor the callback changes raises the provider's sending quota.

RLS enforces memberships at the database boundary, including direct REST requests. Server data functions additionally scope reads and writes to the selected team. A trigger prohibits moving properties between teams, and renewal history derives its team from the property. Renewal records cannot be edited or deleted directly; deleting the property cascades its history. The existing renewal RPC still logs and advances dates atomically.

## Verification

`pnpm test:migrations` checks both the original renewal engine and private-team isolation in isolated PostgreSQL with realistic `auth.uid()` and `auth.jwt()` functions. It does not bypass production RLS or send sign-in emails.

Live database tests now require `TEST_ACCESS_TOKEN` and `TEST_TEAM_ID` for a signed-in test owner/editor. Browser CRUD tests also need `TEST_STORAGE_STATE` pointing to a private Playwright cookie-state file. Never commit session tokens or cookie-state files. Anonymous CRUD tests intentionally fail because the team upgrade removes anonymous access.

## Hosted verification — 2 October 2026

Migration 0003 is applied. The production Auth Site URL and exact `/auth/callback` allowlist entry are saved; email confirmation remains enabled and anonymous Auth sign-in remains disabled. The Vercel production deployment is connected to the Git commit.

`scripts/verify-live-tenancy.sql` passed in the hosted database using disposable transaction fixtures: independent tenants, immutable property ownership, owner/editor/viewer restrictions, email-bound invitations, atomic renewal history, removed-member denial, delete cascade and anonymous denial. The transaction rolled back all fixtures. Domain tests and isolated migration tests passed, as did the production build.

The anonymous browser smoke tests passed locally and at the public production URL. Private routes redirect to login, export returns 401, and login/navigation checks pass at 320/390/760 pixels with 44px controls and no page overflow. Mobile property-card and print layouts were separately checked with non-production fixtures.

Custom SMTP is not configured. Ordinary staff email delivery and a complete two-user browser invitation scenario remain pending a production sender. The earlier shared-demo E2E result is not claimed as authenticated-team E2E coverage.

The owner's real Gmail sign-in succeeded on the public deployment after the built-in sender's hourly window cleared. The signed-in owner created `SPSB Finance`, added three explicitly fictional sample properties, renewed Sample Marina Tower from 12,000,000 to 13,000,000 with 200,000 refurbishment (13,200,000 updated value), and verified the 16 October 2027 renewal / 16 September 2027 reminder dates and one history record. A full page refresh preserved both the session and stored changes. No real property or insurer transaction was used for this check.

Nine domain/session unit tests and four anonymous/mobile/callback browser tests pass. The production build passes. The public callback rejects missing credentials, clears the URL fragment, prohibits caching/referrer transmission, and the server finish route rejects an anonymous session. No user browser cookies or service-role keys were exported into test files.
