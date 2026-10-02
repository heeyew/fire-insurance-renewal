import { listProperties } from '@/lib/data/properties';
import { PropertyControls } from '@/components/property-controls';
import { PropertyTable } from '@/components/property-table';
import { teamContext } from '@/lib/data/teams';
import {TeamSummary} from '@/components/team-summary';
export const dynamic='force-dynamic';
export default async function PropertiesPage() {
  const properties=await listProperties();
  const context=await teamContext();const readOnly=context?.team?.role==='viewer';
  return <><TeamSummary team={context?.team}/><header className="page-header"><div><div className="eyebrow">YOUR PORTFOLIO</div><h1>Properties</h1><p>Keep values current. Stay ahead of every renewal.</p></div><PropertyControls add readOnly={readOnly}/></header>
    <div className="section-heading"><h2>All properties <span className="count">{properties.length}</span></h2><span>Sorted by reminder date</span></div><PropertyTable properties={properties} readOnly={readOnly}/></>;
}
