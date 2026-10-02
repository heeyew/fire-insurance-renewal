import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {db} from '@/lib/data/db';
export async function GET(request:Request) {
  const client=await db();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user) return NextResponse.redirect(new URL('/login?error=callback',request.url));
  const store=await cookies();
  const next=store.get('sign-in-next')?.value??'/teams';
  store.delete('sign-in-next');store.delete('sign-in-retry-at');
  return NextResponse.redirect(new URL(/^\/join\/[0-9a-f-]{36}$/i.test(next)?next:'/teams',request.url));
}
