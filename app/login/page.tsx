import {redirect} from 'next/navigation';
import {teamContext} from '@/lib/data/teams';
import {sendSignIn} from '@/lib/team-actions';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{sent?:string;error?:string;next?:string}>}) {
 const params=await searchParams;
 const context=await teamContext(false);
 if(context) redirect(/^\/join\/[0-9a-f-]{36}$/i.test(params.next??'')?params.next!:'/teams');
 return <section className="panel team-panel"><h1>Sign in to your workspace</h1><p>Use your work email to receive a secure sign-in link. Each team has its own private property portfolio.</p>
 {params.sent&&<p role="status">Check your inbox for a sign-in link. Open it in this browser. If it does not arrive, check spam or ask your administrator to check email delivery.</p>}
 {params.error&&<p role="alert">{params.error==='invalid-email'?'Enter a valid email address.':params.error==='delivery'?'We could not send the sign-in link. Your administrator may need to configure email delivery, or the service may be rate limited. Please retry later.':params.error==='callback'?'The sign-in link expired or could not be verified. Request a new link.':'Sign-in is not configured. Please contact your administrator.'}</p>}
 <form action={sendSignIn} className="team-form"><input type="hidden" name="next" value={params.next??'/teams'}/><label>Work email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><button className="button primary" type="submit">Email me a sign-in link</button></form>
 <p>No password is required. An invitation must be accepted using the email address it was sent to.</p></section>;
}
