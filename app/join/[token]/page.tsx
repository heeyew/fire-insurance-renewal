import {teamContext} from '@/lib/data/teams';
import {acceptInvite,signOut} from '@/lib/team-actions';
export const dynamic='force-dynamic';
export default async function Join({params,searchParams}:{params:Promise<{token:string}>;searchParams:Promise<{error?:string}>}) {
 const {token}=await params;const query=await searchParams;const context=await teamContext(false);
 return <section className="panel team-panel"><h1>Join a private team</h1><p>This invitation is bound to the email address chosen by the team owner and expires after seven days.</p>
 {query.error&&<p role="alert">This invitation expired, was revoked, or is for a different email. Sign in with the invited email, or ask the owner for a fresh link.</p>}
 {context?<><p>Signed in as {context.user.email}</p><form action={acceptInvite}><input type="hidden" name="token" value={token}/><button className="button primary">Accept invitation</button></form><form action={signOut}><button className="button secondary">Sign out to use another email</button></form></>:<a className="button primary" href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}>Sign in to accept</a>}</section>;
}
