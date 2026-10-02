# Private teams

The team upgrade replaces the public shared demo with authenticated, private portfolios. Supabase cookie sessions use passwordless email links. No service-role credentials are used by the application.

Owners create and switch teams, invite editors or viewers, revoke pending invitations, and change or remove member access. Editors manage properties and renewals; viewers can read history and export but cannot mutate. The owner cannot be removed or downgraded. Multiple teams per user are supported.

Invitation links are created on request and shared manually by the owner; the application does not email invitations. Each link is bound to the specified verified email, expires in seven days, and is consumed once. Reissuing an invitation revokes the previous token. Sign in with the invited email before accepting.

## Migration and deployment

Apply `0003_private_teams.sql` after 0001 and 0002, then deploy the team application from Git. Existing shared-demo rows remain unassigned and inaccessible to normal app users. A first signup never inherits them. A new team starts empty; its owner/editor can explicitly add fictional sample properties only while it is empty.

Keep Supabase email verification enabled. Configure a custom SMTP provider for ordinary team users: Supabase's default mail service restricts recipients to the Supabase organization and has restrictive rate limits. Set Auth Site URL to the production application and allow its `/auth/callback` redirect. Development sign-in requires a localhost callback allowlist entry and a matching local `NEXT_PUBLIC_APP_URL`.

RLS enforces memberships at the database boundary, including direct REST requests. Server data functions additionally scope reads and writes to the selected team. A trigger prohibits moving properties between teams, and renewal history derives its team from the property. Renewal records cannot be edited or deleted directly; deleting the property cascades its history. The existing renewal RPC still logs and advances dates atomically.

## Verification

`pnpm test:migrations` checks both the original renewal engine and private-team isolation in isolated PostgreSQL with realistic `auth.uid()` and `auth.jwt()` functions. It does not bypass production RLS or send sign-in emails.

Live database tests now require `TEST_ACCESS_TOKEN` and `TEST_TEAM_ID` for a signed-in test owner/editor. Browser CRUD tests also need `TEST_STORAGE_STATE` pointing to a private Playwright cookie-state file. Never commit session tokens or cookie-state files. Anonymous CRUD tests intentionally fail because the team upgrade removes anonymous access.
