import {redirect} from 'next/navigation';
import {teamContext} from '@/lib/data/teams';
import {sendSignIn} from '@/lib/team-actions';
import {cookies} from 'next/headers';
import {SignInButton} from '@/components/sign-in-button';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{sent?:string;error?:string;next?:string}>}) {
 const params=await searchParams;
 const context=await teamContext(false);
 if(context) redirect(/^\/join\/[0-9a-f-]{36}$/i.test(params.next??'')?params.next!:'/teams');
 const cookieRetryAt=Number((await cookies()).get('sign-in-retry-at')?.value??0);
 const retryAt=Number.isFinite(cookieRetryAt)&&cookieRetryAt<=Date.now()+60000?cookieRetryAt:0;
 const errors:Record<string,string>={
   'invalid-email':'Enter a valid email address.',
   cooldown:'A sign-in email was requested recently. Check your inbox and spam for the newest link, and open it in this browser. Wait for the countdown before requesting another.',
   'email-limit':'The email service has reached its sending limit. Use the newest link already in your inbox, or retry later. Your administrator can configure email delivery with a higher sending limit.',
   'request-limit':'Too many sign-in requests. Wait before trying again, or use the newest link already in your inbox.',
   'email-not-authorized':'The default email service cannot send to this address. Your administrator must configure email delivery for team users.',
   delivery:'The email service could not send a sign-in link. Please ask your administrator to check email delivery.',
   callback:'This link expired, was already used, or was opened in a different browser. Open the newest link in the browser where you requested it. If needed, request a new link.',
   configuration:'Sign-in is not configured. Please contact your administrator.',
 };
 return <section className="panel team-panel"><h1>Sign in to your workspace</h1><p>Use your work email to receive a secure sign-in link. Each team has its own private property portfolio.</p>
 {params.sent&&<p role="status">The email service accepted your request. Check your inbox and spam for the newest sign-in link. Open it in this browser. You do not need to request it again.</p>}
 {params.error&&<p role="alert">{Object.prototype.hasOwnProperty.call(errors,params.error)?errors[params.error]:errors.delivery}</p>}
 <form action={sendSignIn} className="team-form"><input type="hidden" name="next" value={params.next??'/teams'}/><label>Work email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><SignInButton retryAt={retryAt} initialSeconds={Math.max(0,Math.ceil((retryAt-Date.now())/1000))}/></form>
 <p>No password is required. An invitation must be accepted using the email address it was sent to.</p></section>;
}
