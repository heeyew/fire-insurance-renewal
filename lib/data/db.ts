import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function db() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Database configuration is missing.');
  return createClient(url,key,{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})},
  });
}
