import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServerClient} from '@supabase/ssr';
import {bufferedCookies} from '../lib/cookie-buffer';

test('A rejected resend preserves the verifier for the previously sent email',async()=>{
  const jar=new Map<string,string>();
  const buffer=()=>bufferedCookies(()=>[...jar].map(([name,value])=>({name,value})),({name,value,options})=>{if(options.maxAge===0)jar.delete(name);else jar.set(name,value);});
  let challenge='';
  const sent=buffer();
  const first=createServerClient('https://test-project.supabase.co','synthetic-public-key',{cookies:sent,global:{fetch:async(_url,options)=>{
    challenge=JSON.parse(String(options?.body)).code_challenge;
    return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  }}});
  assert.equal((await first.auth.signInWithOtp({email:'synthetic@example.com'})).error,null);
  sent.commit();
  const original=[...jar];assert.ok(original.length>0);
  const failed=buffer();
  const second=createServerClient('https://test-project.supabase.co','synthetic-public-key',{cookies:failed,global:{fetch:async()=>new Response(JSON.stringify({code:'over_email_send_rate_limit',msg:'Email rate limit exceeded'}),{status:429,headers:{'Content-Type':'application/json'}})}});
  assert.equal((await second.auth.signInWithOtp({email:'synthetic@example.com'})).error?.status,429);
  assert.deepEqual([...jar],original,'failed requests never commit their replacement cookies');
  let verifier='';
  const exchange=createServerClient('https://test-project.supabase.co','synthetic-public-key',{cookies:buffer(),global:{fetch:async(_url,options)=>{
    verifier=JSON.parse(String(options?.body)).code_verifier;
    return new Response(JSON.stringify({code:'invalid_grant',msg:'Synthetic exchange; no real account'}),{status:400,headers:{'Content-Type':'application/json'}});
  }}});
  await exchange.auth.exchangeCodeForSession('synthetic-code');
  assert.ok(verifier);
  assert.equal(createHash('sha256').update(verifier).digest('base64url'),challenge,'earlier emailed challenge still has its matching verifier');
});
