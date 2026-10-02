'use server';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {db} from './data/db';
import {teamContext} from './data/teams';
import {createClient} from '@supabase/supabase-js';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function localNext(value:string) {return /^\/join\/[0-9a-f-]{36}$/i.test(value)?value:'/teams';}
export async function sendSignIn(form:FormData) {
  const email=String(form.get('email')??'').trim();
  const next=localNext(String(form.get('next')??''));
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) redirect('/login?error=invalid-email');
  const origin=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,'');
  if(!origin) redirect('/login?error=configuration');
  const store=await cookies();
  const retryAt=Number(store.get('sign-in-retry-at')?.value??0);
  if(retryAt>Date.now()&&retryAt<=Date.now()+60000) redirect(`/login?error=cooldown&next=${encodeURIComponent(next)}`);
  // Email links must work when Gmail opens another browser. This client only
  // requests an email; it never persists a user session on the server.
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    auth:{flowType:'implicit',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:`${origin}/auth/complete`}});
  if(error) {
    console.error('Sign-in email delivery failed:',error.code);
    const seconds=error.message.match(/after (\d+) seconds/i);
    let reason='delivery';
    if(error.status===429&&seconds) {
      const wait=Math.min(60,Math.max(1,Number(seconds[1])));
      store.set('sign-in-retry-at',String(Date.now()+wait*1000),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:wait});
      reason='cooldown';
    } else if(error.code==='over_email_send_rate_limit') reason='email-limit';
    else if(error.status===429) reason='request-limit';
    else if(error.code==='email_address_not_authorized') reason='email-not-authorized';
    redirect(`/login?error=${reason}&next=${encodeURIComponent(next)}`);
  }
  store.set('sign-in-next',next,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});
  store.set('sign-in-retry-at',String(Date.now()+60000),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60});
  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`);
}
export async function signOut() {const client=await db();await client.auth.signOut();(await cookies()).delete('active-team');redirect('/login');}
async function selectTeam(id:string) {(await cookies()).set('active-team',id,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*365});revalidatePath('/','layout');}
export async function switchTeam(form:FormData) {
  const context=await teamContext(false);const id=String(form.get('team_id'));
  if(!context?.teams.some(team=>team.id===id)) redirect('/teams?error=access');
  await selectTeam(id);redirect('/');
}
export async function createTeam(form:FormData) {
  const context=await teamContext(false);if(!context) redirect('/login');
  const name=String(form.get('name')??'').trim();if(!name||name.length>100) redirect('/teams?error=name');
  const {data,error}=await context.client.rpc('create_team',{p_name:name});
  if(error) {console.error('Team create failed:',error.code);redirect('/teams?error=save');}
  await selectTeam(data);redirect('/teams?created=1');
}
export async function inviteMember(form:FormData) {
  const context=await teamContext();if(context?.team?.role!=='owner') redirect('/teams?error=owner');
  const {error}=await context.client.rpc('invite_team_member',{p_team:context.team.id,p_email:String(form.get('email')??'').trim(),p_role:String(form.get('role')??'')});
  if(error) redirect('/teams?error=invite');revalidatePath('/teams');redirect('/teams?invited=1');
}
export async function manageMember(form:FormData) {
  const context=await teamContext();if(context?.team?.role!=='owner') redirect('/teams?error=owner');
  const id=String(form.get('user_id')??'');if(!uuid.test(id)) redirect('/teams?error=save');
  const {error}=await context.client.rpc('manage_team_member',{p_team:context.team.id,p_user:id,p_role:String(form.get('role')??'')});
  if(error) redirect('/teams?error=save');revalidatePath('/teams');redirect('/teams');
}
export async function revokeInvite(form:FormData) {
  const context=await teamContext();if(context?.team?.role!=='owner') redirect('/teams?error=owner');
  const {error}=await context.client.rpc('revoke_team_invitation',{p_team:context.team.id,p_id:String(form.get('id')??'')});
  if(error) redirect('/teams?error=save');revalidatePath('/teams');redirect('/teams');
}
export async function addSamples() {
  const context=await teamContext();if(!context?.team||context.team.role==='viewer') redirect('/teams?error=access');
  const {error}=await context.client.rpc('add_team_samples',{p_team:context.team.id});
  if(error) redirect('/teams?error=samples');revalidatePath('/','layout');redirect('/');
}
export async function acceptInvite(form:FormData) {
  const token=String(form.get('token')??'');if(!uuid.test(token)) redirect('/teams?error=expired');
  const context=await teamContext(false);if(!context) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  const {data,error}=await context.client.rpc('accept_team_invitation',{p_token:token});
  if(error) redirect(`/join/${token}?error=1`);await selectTeam(data);redirect('/teams?joined=1');
}
