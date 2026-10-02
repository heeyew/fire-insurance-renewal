import { listProperties } from '@/lib/data/properties';
import { Dashboard } from '@/components/dashboard';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<{status?:string}>}) {
  const [properties,params]=await Promise.all([listProperties(),searchParams]);
  return <Dashboard properties={properties} filter={params.status}/>;
}
