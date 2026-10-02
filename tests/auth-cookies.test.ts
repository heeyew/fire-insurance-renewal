import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServerClient,createBrowserClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
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

test('Email requests omit browser-bound PKCE state in the supported implicit flow',async()=>{
  let payload:Record<string,unknown>={};let requestUrl='';
  const client=createClient('https://test-project.supabase.co','synthetic-public-key',{
    auth:{flowType:'implicit',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(url,options)=>{
      requestUrl=String(url);payload=JSON.parse(String(options?.body));
      return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
    }},
  });
  assert.equal((await client.auth.signInWithOtp({email:'synthetic@example.com',options:{emailRedirectTo:'https://app.example.com/auth/complete'}})).error,null);
  assert.equal(payload.code_challenge,null);
  assert.equal(new URL(requestUrl).searchParams.get('redirect_to'),'https://app.example.com/auth/complete');
});

test('The verified browser session is available to a fresh server client through SSR cookies',async()=>{
  const jar=new Map<string,string>();
  const cookies={getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:(values:Array<{name:string;value:string}>)=>values.forEach(({name,value})=>jar.set(name,value))};
  const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',email:'synthetic@example.com',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
  const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic-signature'].join('.');
  const fetchUser:typeof fetch=async()=>new Response(JSON.stringify(user),{status:200,headers:{'Content-Type':'application/json'}});
  const browser=createBrowserClient('https://test-project.supabase.co','synthetic-public-key',{isSingleton:false,cookies,auth:{detectSessionInUrl:false,autoRefreshToken:false},global:{fetch:fetchUser}});
  assert.equal((await browser.auth.setSession({access_token:token,refresh_token:'synthetic-refresh'})).error,null);
  assert.ok([...jar.keys()].some(name=>name.includes('auth-token')));
  let authorization='';
  const server=createServerClient('https://test-project.supabase.co','synthetic-public-key',{cookies,global:{fetch:async(_url,options)=>{
    authorization=new Headers(options?.headers).get('authorization')??'';
    return fetchUser(_url,options);
  }}});
  assert.equal((await server.auth.getUser()).data.user?.id,user.id);
  assert.equal(authorization,`Bearer ${token}`);
});
