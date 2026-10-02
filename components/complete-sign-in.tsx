'use client';
import {useEffect,useRef,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

export function CompleteSignIn() {
  const started=useRef(false);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(started.current) return;
    started.current=true;
    const params=new URLSearchParams(window.location.hash.slice(1));
    const accessToken=params.get('access_token'),refreshToken=params.get('refresh_token');
    // Credentials remain in the URL fragment, never in request logs or referrers.
    // Clear it before rendering links or navigating to another page.
    window.history.replaceState(null,'','/auth/complete');
    if(!accessToken||!refreshToken) {setFailed(true);return;}
    const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{detectSessionInUrl:false}});
    void (async()=>{
      try {
        const {error}=await client.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
        if(error) {setFailed(true);return;}
        const {data:{user},error:userError}=await client.auth.getUser();
        if(userError||!user) {setFailed(true);return;}
        window.location.replace('/auth/finish');
      } catch {setFailed(true);}
    })();
  },[]);
  return failed?<><p role="alert">This sign-in link expired or was already used. Request a new link to continue.</p><a className="button" href="/login">Return to sign-in</a></>:<p role="status">Verifying your email and opening your workspace…</p>;
}
