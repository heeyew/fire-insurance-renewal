import {NextResponse} from 'next/server';
import {db} from '@/lib/data/db';
import {cookies} from 'next/headers';
export async function GET(request:Request) {
 const url=new URL(request.url);const code=url.searchParams.get('code');
 if(code) {const client=await db();const {error}=await client.auth.exchangeCodeForSession(code);if(!error) {
  const store=await cookies();const next=store.get('sign-in-next')?.value??'/teams';store.delete('sign-in-next');
  return NextResponse.redirect(new URL(/^\/join\/[0-9a-f-]{36}$/i.test(next)?next:'/teams',url.origin));
 }}
 return NextResponse.redirect(new URL('/login?error=callback',url.origin));
}
