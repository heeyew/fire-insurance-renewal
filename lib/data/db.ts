import 'server-only';
import { createServerClient,type CookieMethodsServer } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function db(cookieAdapter?:CookieMethodsServer) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Database configuration is missing.');
  const store=await cookies();
  return createServerClient(url,key,{
    cookies:cookieAdapter??{getAll:()=>store.getAll(),setAll:values=>{
      try {for(const {name,value,options} of values) store.set(name,value,options);} catch {/* Middleware refreshes cookies for server components. */}
    }},
    global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})},
  });
}
