import {CompleteSignIn} from '@/components/complete-sign-in';
export const dynamic='force-dynamic';
export const metadata={referrer:'no-referrer'};
export default function Complete() {
  return <section className="panel team-panel"><h1>Completing sign-in</h1><CompleteSignIn/></section>;
}
