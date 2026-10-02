'use client';
import {useEffect,useState} from 'react';
import {useFormStatus} from 'react-dom';

export function SignInButton({retryAt=0,initialSeconds=0}:{retryAt?:number;initialSeconds?:number}) {
  const {pending}=useFormStatus();
  const [ready,setReady]=useState(false);
  const [remaining,setRemaining]=useState(initialSeconds);
  useEffect(()=>{
    setReady(true);
    const update=()=>setRemaining(Math.max(0,Math.ceil((retryAt-Date.now())/1000)));
    update();const timer=setInterval(update,1000);
    return ()=>clearInterval(timer);
  },[retryAt]);
  return <button className="button primary" type="submit" disabled={!ready||pending||remaining>0}>
    {pending?'Sending sign-in link…':remaining>0?`Resend available in ${remaining}s`:'Email me a sign-in link'}
  </button>;
}
