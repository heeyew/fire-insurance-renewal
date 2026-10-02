import { listProperties } from '@/lib/data/properties';
import { Dashboard } from '@/components/dashboard';
import { teamContext } from '@/lib/data/teams';
import {TeamSummary} from '@/components/team-summary';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<{status?:string}>}) {
  const [properties,params]=await Promise.all([listProperties(),searchParams]);
  const context=await teamContext();
  return <><TeamSummary team={context?.team}/><Dashboard properties={properties} filter={params.status} readOnly={context?.team?.role==='viewer'}/></>;
}
