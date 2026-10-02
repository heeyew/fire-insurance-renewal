import { listProperties } from '@/lib/data/properties';
import { PropertyTable } from '@/components/property-table';
export const dynamic='force-dynamic';
export default async function RenewalList() {
  const properties=await listProperties();
  return <><header className="page-header"><div><div className="eyebrow">ANNUAL RENEWAL</div><h1>Renewal list</h1><p>Property values and reminders for the next renewal cycle.</p></div></header><PropertyTable properties={properties}/></>;
}
