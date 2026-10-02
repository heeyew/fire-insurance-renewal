import { listProperties } from '@/lib/data/properties';
import { PropertyControls } from '@/components/property-controls';
import { PropertyTable } from '@/components/property-table';
export const dynamic='force-dynamic';
export default async function PropertiesPage() {
  const properties=await listProperties();
  return <><header className="page-header"><div><div className="eyebrow">YOUR PORTFOLIO</div><h1>Properties</h1><p>Keep values current. Stay ahead of every renewal.</p></div><PropertyControls add/></header>
    <div className="section-heading"><h2>All properties <span className="count">{properties.length}</span></h2><span>Sorted by reminder date</span></div><PropertyTable properties={properties}/></>;
}
